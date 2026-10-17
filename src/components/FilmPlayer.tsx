import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MEDIA } from '../config';
import { audio } from '../audio';
import { Icon, Star } from './Icons';
export type FilmHandle = { prime: () => void; project: () => void; begin: () => void; stop: () => void };
type Props = { active: boolean; muted: boolean; volume: number; onEnd: () => void; onChapter: (n: number) => void };
export const FilmPlayer = forwardRef<FilmHandle, Props>(function FilmPlayer({ active, muted, volume, onEnd, onChapter }, ref) {
  const video = useRef<HTMLVideoElement>(null), progress = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState(0), [playing, setPlaying] = useState(false), [error, setError] = useState(''), [gesture, setGesture] = useState(false), [stalled, setStalled] = useState(false);
  const slotRef = useRef(0), activeRef = useRef(active), started = useRef(false), primePromise = useRef<Promise<void> | null>(null), [previewPaused, setPreviewPaused] = useState(false);
  const current = MEDIA.films[slot], preview = !MEDIA.continuous && !current.src;
  const projected = useRef(false), generation = useRef(0);
  activeRef.current = active;
  const playSafely = () => {
    const v = video.current; if (!v) return;
    const run = generation.current;
    void v.play().catch(() => {
      if (generation.current !== run || !started.current) return;
      v.muted = true;
      const needsGesture = () => { if (generation.current === run) setGesture(true); };
      void v.play().then(needsGesture).catch(needsGesture);
    });
  };
  const project = () => {
    if (projected.current) return;
    projected.current = true; started.current = true;
    const run = generation.current;
    void (primePromise.current || Promise.resolve()).then(() => {
      const v = video.current; if (!v || generation.current !== run) return;
      if (v.readyState >= 1) v.currentTime = 0;
      audio.setVideoAudible(true);
      if (!audio.videoGain) { v.muted = muted; v.volume = volume; }
      if (v.error) { setError('La pellicola non si carica. Puoi riprovare o passare alla sorpresa.'); return; }
      playSafely();
    });
  };
  useImperativeHandle(ref, () => ({
    prime() {
      const v = video.current; if (!v) return;
      audio.unlock(); audio.setVideoAudible(false);
      projected.current = false; const run = ++generation.current;
      const connected = audio.connectVideo(v);
      setSlot(0); slotRef.current = 0; setError(''); setGesture(false); started.current = false;
      v.muted = connected ? false : true;
      const src = MEDIA.continuous || MEDIA.films[0].src;
      if (src) {
        if (v.getAttribute('src') !== src) v.src = src; v.currentTime = 0;
        primePromise.current = v.play().then(() => { if (generation.current === run && !projected.current) { v.pause(); if (v.readyState >= 1) v.currentTime = 0; } }).catch(() => {});
      }
    },
    project,
    begin() {
      const v = video.current; if (!v) return;
      started.current = true; setPreviewPaused(false); setPlaying(true); onChapter(0);
      if (!projected.current) project();
    },
    stop() { generation.current++; started.current = false; projected.current = false; video.current?.pause(); audio.setVideoAudible(false); setPlaying(false); },
  }));
  useEffect(() => {
    const v = video.current; if (!v) return;
    if (audio.videoGain) { audio.muted = muted; audio.volume = volume; audio.update(); }
    else { v.muted = muted; v.volume = volume; }
  }, [muted, volume]);
  useEffect(() => {
    if (!active || !preview || previewPaused) return;
    const tween = gsap.fromTo(progress.current, { scaleX: 0 }, { scaleX: 1, duration: current.previewSeconds || 6, ease: 'none', onComplete: () => advance() });
    return () => { tween.kill(); };
  }, [active, preview, slot, previewPaused]);
  useEffect(() => {
    const hide = () => { if (document.hidden && started.current) { video.current?.pause(); setPreviewPaused(true); } };
    document.addEventListener('visibilitychange', hide); return () => { document.removeEventListener('visibilitychange', hide); video.current?.pause(); };
  }, []);
  function advance() {
    if (!activeRef.current) return;
    if (MEDIA.continuous || slotRef.current >= MEDIA.films.length - 1) { onEnd(); return; }
    const next = slotRef.current + 1; slotRef.current = next; setSlot(next); onChapter(next); setError('');
    const v = video.current, src = MEDIA.films[next].src;
    if (v && src) { v.src = src; playSafely(); }
  }
  function toggle() {
    audio.unlock();
    if (preview) { setPreviewPaused(p => !p); setPlaying(p => !p); return; }
    const v = video.current; if (!v) return;
    if (v.paused) playSafely(); else v.pause();
  }
  function retry() {
    const v = video.current; if (!v) return;
    setError(''); setGesture(false); audio.unlock(); audio.setVideoAudible(true); v.muted = muted;
    if (v.error) v.load(); playSafely();
  }
  return <div className="film-player" aria-label="Proiezione cinematografica">
    <video ref={video} playsInline webkit-playsinline="true" preload="none" poster={MEDIA.films[0].poster} tabIndex={-1}
      onPlay={() => { setPlaying(true); setStalled(false); }} onPause={() => setPlaying(false)} onPlaying={() => setStalled(false)} onWaiting={() => setStalled(true)}
      onError={() => { if (started.current) setError('La pellicola non si carica. Puoi riprovare o passare alla sorpresa.'); }}
      onEnded={advance} onTimeUpdate={() => {
        const v = video.current; if (!v || !activeRef.current) return;
        if (progress.current && Number.isFinite(v.duration)) progress.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
        if (MEDIA.continuous) { const n = v.currentTime >= MEDIA.chapterTime ? 1 : 0; if (slotRef.current !== n) { slotRef.current = n; setSlot(n); onChapter(n); } }
      }} />
    {preview ? <div className="film-preview"><Star/><span className="eyebrow">ANTEPRIMA · VIDEO DA INSERIRE</span><h2>{current.title}</h2><p>La produzione sta preparando questa scena.</p></div> : null}
    {error ? <div className="player-notice" role="alert"><p>{error}</p><button className="button compact" onClick={retry}>Riprova <Icon name="replay"/></button><button className="text-button" onClick={onEnd}>Passa alla sorpresa <Icon name="arrow"/></button></div> : null}
    {gesture && !error ? <button className="enable-sound" onClick={retry}>Tocca per riprendere con audio <Icon name="sound"/></button> : null}
    {stalled && !error && active && !gesture ? <span className="buffering" role="status">La pellicola si sta preparando…</span> : null}
    {active && !error ? <div className="film-controls"><button className="icon-button" aria-label={playing ? 'Metti in pausa' : 'Riprendi il film'} onClick={toggle}><Icon name={playing ? 'pause' : 'play'}/></button><div className="film-progress" role="presentation"><div ref={progress}/></div><button className="text-button skip" onClick={onEnd}>Salta <Icon name="arrow" size={16}/></button></div> : null}
  </div>;
});
