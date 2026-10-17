import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { gsap } from 'gsap';
import { COPY, STORAGE_KEY } from './config';
import { readAvailability } from './dates';
import { audio } from './audio';
import { Projector } from './components/Projector';
import { ProjectionRig } from './components/ProjectionRig';
import { igniteProjector, PROJECTOR_TIME_SCALE } from './animation/projector';
import { FilmPlayer } from './components/FilmPlayer';
import type { FilmHandle } from './components/FilmPlayer';
import { Envelope } from './components/Envelope';
import { Theater } from './components/Theater';
import { AvailabilityCalendar } from './components/AvailabilityCalendar';
import type { Completion } from './components/AvailabilityCalendar';
import { Icon, Star } from './components/Icons';
type Scene = 'intro' | 'starting' | 'film' | 'delivery' | 'calendar' | 'finale';
const finalStatus: Record<Completion, [string, string]> = {
  received: ['Date ricevute!', 'Le disponibilità sono state inviate alla produzione.'],
  copied: ['Date copiate!', 'Incollale nella chat degli amici: la produzione le aspetta.'],
  whatsapp: ['Il messaggio è pronto.', "Completa l'invio su WhatsApp. Le date non sono ancora confermate dalla produzione."],
  shared: ['Si alzi il sipario!', 'Hai condiviso le tue disponibilità. Ora aspettiamo la produzione.'],
  prepared: ['Tutto pronto per la produzione.', 'Ricordati di mandare il messaggio agli amici.'],
};
export default function App() {
  const [scene, setScene] = useState<Scene>('intro'), [chapter, setChapter] = useState(0), [muted, setMuted] = useState(false), [volume, setVolume] = useState(.7), [audioOpen, setAudioOpen] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches), [data, setData] = useState(() => readAvailability(STORAGE_KEY)), [storageWarning, setStorageWarning] = useState(false), [completion, setCompletion] = useState<Completion>('prepared');
  const root = useRef<HTMLDivElement>(null), film = useRef<FilmHandle>(null), transition = useRef<gsap.core.Timeline | null>(null), locked = useRef(false);
  const act = scene === 'intro' || scene === 'starting' || scene === 'film' ? 0 : scene === 'delivery' ? 1 : 2;
  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const handler = () => setReduced(media.matches); media.addEventListener('change', handler); return () => media.removeEventListener('change', handler); }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setStorageWarning(false); } catch { setStorageWarning(true); } }, [data]);
  useEffect(() => { audio.muted = muted; audio.volume = volume; audio.update(); }, [muted, volume]);
  useEffect(() => () => { transition.current?.kill(); film.current?.stop(); audio.stopMotor(); }, []);
  useLayoutEffect(() => {
    const el = root.current; if (!el) return;
    const ctx = gsap.context(() => {
      if (scene === 'calendar') {
        audio.curtain();
        const tl = gsap.timeline();
        tl.fromTo('.curtain-left', { xPercent: 0 }, { xPercent: -88, duration: reduced ? .01 : 1.4, ease: 'power3.inOut' })
          .fromTo('.curtain-right', { xPercent: 0 }, { xPercent: 88, duration: reduced ? .01 : 1.4, ease: 'power3.inOut' }, 0)
          .fromTo('.calendar-layout', { y: reduced ? 0 : 55, opacity: 0 }, { y: 0, opacity: 1, duration: reduced ? .01 : .8 }, reduced ? 0 : .5);
        el.querySelector<HTMLElement>('.scene-focus')?.focus({ preventScroll: true });
      }
      if (scene === 'finale') {
        audio.applause();
        gsap.fromTo('.curtain-left', { xPercent: 0 }, { xPercent: -88, duration: reduced ? .01 : 1.1, ease: 'power3.inOut' });
        gsap.fromTo('.curtain-right', { xPercent: 0 }, { xPercent: 88, duration: reduced ? .01 : 1.1, ease: 'power3.inOut' });
        gsap.fromTo('.finale-content > *', { y: reduced ? 0 : 24, opacity: 0 }, { y: 0, opacity: 1, duration: reduced ? .01 : .8, delay: reduced ? 0 : .3, stagger: reduced ? 0 : .1, ease: 'power3.out' });
        if (!reduced) gsap.fromTo('.confetti i', { y: -60, x: 0, rotation: 0, opacity: 1 }, { y: '110vh', x: i => Math.sin(i * 4) * 130, rotation: i => 180 + i * 21, duration: i => 3 + (i % 5) * .3, stagger: .03, ease: 'power1.in', onComplete: () => gsap.set('.confetti', { display: 'none' }) });
        el.querySelector<HTMLElement>('.scene-focus')?.focus({ preventScroll: true });
      }
    }, el);
    return () => ctx.revert();
  }, [scene, reduced]);
  function start() {
    if (locked.current) return;
    locked.current = true; audio.unlock(); audio.motor(reduced, 1 / PROJECTOR_TIME_SCALE); film.current?.prime(); setScene('starting');
    const el = root.current; if (!el) return;
    transition.current = igniteProjector({ root: el, reduced, project: () => film.current?.project(), complete: () => { setScene('film'); locked.current = false; requestAnimationFrame(() => film.current?.begin()); } });
  }
  function showEnvelope() { if (scene !== 'film') return; film.current?.stop(); setScene('delivery'); }
  function enterCalendar() {
    if (locked.current) return; locked.current = true; audio.paper();
    transition.current = gsap.timeline({ onComplete: () => { setScene('calendar'); locked.current = false; } })
      .to('.theater-ticket', { yPercent: -120, scale: .7, rotation: 0, duration: reduced ? .01 : .55, ease: 'power2.in' })
      .fromTo('.light-wipe', { clipPath: 'ellipse(10% 5% at 50% 40%)', opacity: 0 }, { clipPath: 'ellipse(100% 100% at 50% 50%)', opacity: .8, duration: reduced ? .01 : .55 }, 0)
      .to('.light-wipe', { opacity: 0, duration: .3 });
  }
  function complete(kind: Completion) {
    if (locked.current) return;
    locked.current = true; audio.curtain();
    transition.current = gsap.timeline({ onComplete: () => { setCompletion(kind); setScene('finale'); locked.current = false; } })
      .to('.calendar-program', { y: -20, scale: .94, autoAlpha: 0, duration: reduced ? .01 : .45, ease: 'power2.in' })
      .to('.calendar-story', { y: -15, autoAlpha: 0, duration: reduced ? .01 : .4 }, 0)
      .to('.curtain-left', { xPercent: 0, duration: reduced ? .01 : .6, ease: 'power2.inOut' }, reduced ? 0 : .2)
      .to('.curtain-right', { xPercent: 0, duration: reduced ? .01 : .6, ease: 'power2.inOut' }, reduced ? 0 : .2);
  }
  function replay() { film.current?.stop(); gsap.set('.light-wipe', { opacity: 0 }); locked.current = false; flushSync(() => setScene('intro')); start(); }
  const theatrical = scene === 'calendar' || scene === 'finale';
  return <div ref={root} className={`experience scene-${scene} ${reduced ? 'reduced-motion' : ''}`}>
    <div className="ambient-world" aria-hidden="true"><div className="ambient-orbit"/><div className="ambient-halo"/><div className="floor-line"/></div>
    <header className="site-header"><a className="studio-brand" href="#" onClick={e => e.preventDefault()} aria-label={COPY.studio}><Star/><span>AMICI SENZA BUDGET<small>PRODUCTIONS</small></span></a><div className="header-right"><span className="private-screening">UNA PRIMA PRIVATA</span><div className="sound-settings"><button className="icon-button sound-toggle" aria-label={muted ? "Attiva l'audio" : "Disattiva l'audio"} aria-pressed={!muted} onClick={() => { audio.unlock(); setMuted(m => !m); }}><Icon name={muted ? 'mute' : 'sound'} size={19}/><span>AUDIO {muted ? 'OFF' : 'ON'}</span></button><button className="volume-toggle" onClick={() => setAudioOpen(v => !v)} aria-label="Regola il volume" aria-expanded={audioOpen}>⌄</button>{audioOpen ? <div className="volume-panel"><label htmlFor="volume">Volume</label><input id="volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={e => { audio.unlock(); setVolume(Number(e.target.value)); }} onKeyDown={e => { if (e.key === 'Escape') setAudioOpen(false); }}/></div> : null}</div></div></header>
    <main>
      {(scene === 'intro' || scene === 'starting') ? <section className="intro-scene" aria-labelledby="welcome-title"><div className="hero-copy"><div className="hero-heading"><span className="eyebrow"><span className="short-rule"/> QUESTA VOLTA, LA PROTAGONISTA SEI TU</span><h1 id="welcome-title">Stefania<span className="title-period">.</span></h1><p className="hero-subtitle">La tua prima<br/><em>sta per cominciare.</em></p></div><div className="hero-action"><button className="button start-button" onClick={start} disabled={scene === 'starting'}><span className="button-play"><Icon name="play" size={15}/></span> ACCENDI IL PROIETTORE <Icon name="arrow" size={18}/></button><p>Abbassa le luci. Al resto pensiamo noi.</p></div></div><Projector/><div className="intro-side-note">UN REGALO DEI TUOI AMICI.<br/>CON UN CERTO SENSO DELLO SPETTACOLO.</div></section> : null}
      <section className={`cinema-scene ${scene === 'film' || scene === 'delivery' ? 'is-visible' : scene === 'starting' ? 'is-projecting' : ''}`} aria-hidden={scene !== 'film' && scene !== 'delivery'} inert={scene !== 'film' && scene !== 'delivery'}>
        <div className="film-frame"><FilmPlayer ref={film} active={scene === 'film'} muted={muted} volume={volume} onEnd={showEnvelope} onChapter={setChapter}/>{scene === 'delivery' ? <Envelope reduced={reduced} onCalendar={enterCalendar}/> : null}</div>
        {scene === 'film' ? <span className="cinema-caption">{chapter === 0 ? '01 / LA GRANDE PRODUZIONE' : '02 / LA FOLLIA BOLLYWOOD'}</span> : null}
      </section>
      {theatrical ? <section className="theater-scene" aria-label="Il teatro"><Theater final={scene === 'finale'}/>{scene === 'calendar' ? <AvailabilityCalendar data={data} setData={setData} onComplete={complete} reduced={reduced} storageWarning={storageWarning}/> : <><div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${3 + (i * 17) % 94}%`, background: i % 3 ? '#d6a64d' : '#f5e7cd' }}/>)}</div><div className="finale-content"><div className="final-ornament"><i/><Star/><i/></div><span className="eyebrow final-status">{finalStatus[completion][0]}</span><h1 className="scene-focus" tabIndex={-1}>Ora tocca<br/>alla produzione<br/><em>fare il miracolo.</em></h1><p className="final-explanation">{finalStatus[completion][1]}</p><p className="final-cheer">Ci vediamo a teatro, Ste!</p><div className="final-actions"><button className="button" onClick={replay}><Icon name="replay" size={18}/> RIVEDI IL TRAILER</button><button className="text-button" onClick={() => setScene('calendar')}>Modifica le date <Icon name="arrow" size={17}/></button></div><span className="final-signature">CON AFFETTO E UN BUDGET DISCUTIBILE,<strong>{COPY.givers}</strong></span></div></>}</section> : null}
    </main>
    <ProjectionRig/>
    <footer className="site-footer"><div className="act-indicator" aria-label={`Atto ${act + 1} di 3`}><span className={act === 0 ? 'active' : ''}><b>I</b> IL FILM</span><i/><span className={act === 1 ? 'active' : ''}><b>II</b> LA SORPRESA</span><i/><span className={act === 2 ? 'active' : ''}><b>III</b> LA SERATA</span></div><p>{COPY.slogan}</p><span className="footer-edition">EDIZIONE SPECIALE · STEFANIA</span></footer>
    <div className="light-wipe" aria-hidden="true"/>
  </div>;
}
