import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MEDIA, COPY } from '../config';
import { audio } from '../audio';
import { Star, Icon } from './Icons';
export function Envelope({ reduced, onCalendar }: { reduced: boolean; onCalendar: () => void }) {
  const root = useRef<HTMLDivElement>(null), timeline = useRef<gsap.core.Timeline | null>(null), [opened, setOpened] = useState(false), [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => setReady(true) });
      tl.fromTo('.match-shimmer', { xPercent: -130 }, { xPercent: 160, duration: reduced ? .01 : 1.15, ease: 'power2.inOut' })
        .fromTo('.envelope-object', { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, reduced ? 0 : .48)
        .to('.frame-shade', { opacity: .87, duration: reduced ? .01 : 1.2 }, .45)
        .fromTo('.delivery-copy', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6 }, .7);
    }, root);
    return () => { timeline.current?.kill(); ctx.revert(); };
  }, [reduced]);
  function open() {
    if (opened || !ready) return;
    setOpened(true); audio.unlock(); audio.click(); audio.paper();
    const el = root.current; if (!el) return;
    const duration = reduced ? .01 : 1;
    timeline.current = gsap.timeline({ onComplete: () => { el.querySelector<HTMLElement>('.ticket-title')?.focus({ preventScroll: true }); } })
      .to(el.querySelector('.envelope-object'), { y: -8, rotation: -2, duration: .18 })
      .to(el.querySelector('.wax-seal'), { scale: 1.25, rotation: 20, autoAlpha: 0, duration: .24 * duration }, .12)
      .to(el.querySelector('.envelope-flap'), { rotateX: 180, duration: .65 * duration, ease: 'power2.inOut' }, .24)
      .set(el.querySelector('.envelope-flap'), { zIndex: 0 }, .45)
      .to(el.querySelector('.delivery-copy'), { autoAlpha: 0, y: -20, duration: .3 * duration }, .15)
      .to(el.querySelector('.theater-ticket'), { yPercent: -55, autoAlpha: 1, rotation: 2, duration: .9 * duration, ease: 'power3.out' }, .62 * duration)
      .set(el.querySelector('.theater-ticket'), { zIndex: 8 }, .9 * duration)
      .to(el.querySelector('.theater-ticket'), { yPercent: -65, scale: 1.06, duration: .6 * duration, ease: 'power2.out' }, .95 * duration)
      .to(el.querySelector('.frame-shade'), { opacity: .98, duration: .8 * duration }, .4)
      .fromTo(el.querySelector('.ticket-next'), { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: .5 * duration }, 1.3 * duration);
  }
  const match = MEDIA.envelopeMatch;
  return <div ref={root} className={`delivery-layer ${opened ? 'envelope-opened' : ''}`}>
    {MEDIA.finalFrame ? <img className="final-frame" src={MEDIA.finalFrame} alt=""/> : <div className="frame-placeholder"><span>Anteprima del raccordo · frame finale da inserire</span></div>}
    <div className="frame-shade"/><div className="match-shimmer"/>
    <div className="delivery-copy"><span className="eyebrow">CONSEGNA SPECIALE</span><h2>Per Stefania<br/><em>D'Amore.</em></h2></div>
    <div className="envelope-anchor" style={{ left: `${match.x * 100}%`, top: `${match.y * 100}%`, width: `${match.width * 100}%`, rotate: `${match.rotation}deg` }}>
      <div className="envelope-object">
        <div className="envelope-back"/>
        <article className="theater-ticket" aria-label="Il regalo" aria-hidden={!opened}>
          <div className="ticket-top"><Star/><span>AMICI SENZA BUDGET<br/>PRODUCTIONS</span><Star/></div>
          <span className="ticket-eyebrow">INVITO UFFICIALE</span>
          <h2 className="ticket-title" tabIndex={-1}>Ste, si va<br/><em>a teatro!</em></h2>
          <p className="ticket-together">{COPY.together}</p>
          <div className="ticket-perforation"/>
          <dl><div><dt>DATA</dt><dd>Da decidere</dd></div><div><dt>SPETTACOLO</dt><dd>{COPY.surprise}</dd></div></dl>
          <p className="ticket-joke">Lo spettacolo lo abbiamo scelto noi.<br/>La data la troviamo insieme.</p>
          <p className="ticket-givers">Un regalo di<br/><strong>{COPY.givers}</strong></p>
          <div className="ticket-barcode"/><span className="ticket-number">ASB / STEFANIA / INVITO</span>
        </article>
        <div className="envelope-front"/><div className="envelope-flap"/>
        <button className="envelope-tap" onClick={open} disabled={!ready || opened} aria-label="Apri la busta dorata"><span className="wax-seal"><Star/></span></button>
      </div>
      {!opened ? <span className="tap-hint">TOCCA PER APRIRE <span>↗</span></span> : null}
    </div>
    <div className="ticket-next" style={{ visibility: 'hidden' }}><button className="button" onClick={onCalendar} disabled={!opened}>Scegliamo la data <Icon name="arrow"/></button></div>
  </div>;
}
