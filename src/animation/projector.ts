import { gsap } from 'gsap';
import turn from '../../assets/projector/turn/geometry.json';

type Options = { root: HTMLElement; reduced: boolean; project: () => void; complete: () => void };
export const PROJECTOR_TIME_SCALE = .62;

/** The machine turns towards the viewer before the picture opens from its lens. */
export function igniteProjector({ root, reduced, project, complete }: Options) {
  const query = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const frame = query('.film-frame'), projector = query('.projector-object');
  const lamp = query('.projector-light-core'), halo = query('.projector-lens-halo'), rig = query('.projection-rig');
  const sprite = query('.projector-turn-sprite'), still = query('.projector-static');
  const atlas = query<HTMLImageElement>('.projector-turn-atlas'), power = query('.projector-power-switch');
  const svg = query<SVGSVGElement>('.projection-beams');
  const bloom = query<SVGCircleElement>('.projection-forward-bloom'), ring = query<SVGCircleElement>('.projection-forward-ring');
  const glow = query<SVGRadialGradientElement>('#projection-forward-glow');
  gsap.set(frame, { clearProps: 'transform,filter,opacity,boxShadow,clipPath' });
  const finish = () => {
    gsap.set(frame, { clearProps: 'transform,filter,opacity,boxShadow,clipPath' });
    gsap.set(rig, { opacity: 0 });
    complete();
  };
  const tl = gsap.timeline({ onComplete: finish });
  if (reduced) { tl.set(frame, { opacity: 1 }).call(project).to({}, { duration: .15 }); return tl; }

  const motion = { frame: 0, radius: 0 }, light = { radius: 0 };
  let hasAtlas = false, painted = -1, originX = 0, originY = 0, pictureRadius = 0;
  const paintTurn = () => {
    if (!hasAtlas) return;
    const index = Math.min(turn.frames.length - 1, Math.max(0, Math.round(motion.frame)));
    if (painted === index) return;
    painted = index;
    const pose = turn.frames[index], [width, height] = turn.size;
    sprite.style.backgroundPosition = `${index % turn.columns / (turn.columns - 1) * 100}% ${Math.floor(index / turn.columns) / (turn.rows - 1) * 100}%`;
    for (const el of [lamp, halo]) {
      el.style.left = `${pose.lamp[0] / width * 100}%`;
      el.style.top = `${pose.lamp[1] / height * 100}%`;
    }
    lamp.style.width = `${pose.lamp[2] * 2 / width * 100}%`;
    lamp.style.height = `${pose.lamp[3] * 2 / height * 100}%`;
    lamp.style.aspectRatio = 'auto';
    power.style.left = `${pose.indicator[0] / width * 100}%`;
    power.style.top = `${pose.indicator[1] / height * 100}%`;
  };
  const prepareAtlas = async () => {
    let timeout = 0;
    try {
      return await Promise.race([
        atlas.decode().then(() => true, () => false),
        new Promise<boolean>(resolve => { timeout = window.setTimeout(() => resolve(false), 1800); }),
      ]);
    } finally { clearTimeout(timeout); }
  };
  const atlasReady = prepareAtlas();
  const setOpticalOrigin = () => {
    const a = lamp.getBoundingClientRect(), picture = frame.getBoundingClientRect();
    const x = a.left + a.width / 2, y = a.top + a.height / 2;
    originX = x - picture.left; originY = y - picture.top;
    pictureRadius = Math.max(...[[0, 0], [picture.width, 0], [0, picture.height], [picture.width, picture.height]].map(([px, py]) => Math.hypot(px - originX, py - originY))) + 2;
    svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    for (const el of [bloom, ring, glow]) { el.setAttribute('cx', `${x}`); el.setAttribute('cy', `${y}`); }
    frame.style.clipPath = `circle(0px at ${originX}px ${originY}px)`;
  };
  const paintLight = () => {
    bloom.setAttribute('r', `${light.radius}`);
    glow.setAttribute('r', `${Math.max(1, light.radius)}`);
    ring.setAttribute('r', `${light.radius * .72}`);
  };
  const paintPicture = () => { frame.style.clipPath = `circle(${motion.radius}px at ${originX}px ${originY}px)`; };
  gsap.set(frame, { opacity: 0 });
  gsap.set(rig, { opacity: 0 });
  tl.to(query('.start-button'), { scale: .98, duration: .09 }, 0)
    .to(query('.hero-action'), { autoAlpha: 0, duration: .18, ease: 'power1.out' }, 0)
    .to(power, { scale: .82, duration: .1, yoyo: true, repeat: 1 }, 0)
    .to(query('.projector-status-light'), { opacity: 1, duration: .12 }, .12)
    .to(query('[data-reel="one"]'), { rotation: 22, duration: .25, ease: 'power2.in' }, 0)
    .to(query('[data-reel="two"]'), { rotation: 26, duration: .25, ease: 'power2.in' }, 0)
    .to(query('.projector-aura'), { opacity: 1, duration: .7 }, .15)
    .addPause(.25, () => {
      void atlasReady.then(ready => {
        if (!root.isConnected || !root.classList.contains('scene-starting')) return;
        if (ready) { hasAtlas = true; paintTurn(); gsap.set(still, { opacity: 0 }); gsap.set(sprite, { opacity: 1 }); }
        tl.resume();
      });
    })
    .to(motion, { frame: turn.frames.length - 1, duration: 1.05, ease: 'none', onUpdate: paintTurn }, .28)
    .to(power, { opacity: 0, duration: .3 }, .53)
    .to(lamp, { opacity: .45, duration: .35 }, .35)
    .to(lamp, { opacity: .95, duration: .3 }, 1.06)
    .to(halo, { opacity: .7, scale: 1, duration: .65, ease: 'power2.out' }, .75)
    .to(query('.hero-heading'), { y: -10, opacity: 0, duration: .5, ease: 'power2.in' }, .4)
    .to(root.querySelectorAll('.intro-side-note, .object-caption'), { opacity: 0, duration: .25 }, .58)
    .call(setOpticalOrigin, [], 1.36)
    .to(rig, { opacity: 1, duration: .22 }, 1.36)
    .to(light, { radius: Math.hypot(innerWidth, innerHeight) * .8, duration: .9, ease: 'power2.inOut', onUpdate: paintLight }, 1.36)
    .set(frame, { opacity: 1 }, 1.62)
    .call(project, [], 1.62)
    .to(motion, { radius: () => pictureRadius, duration: .66, ease: 'power2.inOut', onUpdate: paintPicture }, 1.62)
    .to(projector, { opacity: 0, duration: .35 }, 1.96)
    .to(rig, { opacity: 0, duration: .32 }, 2.02)
    .to({}, { duration: .04 }, 2.30);
  return tl.timeScale(PROJECTOR_TIME_SCALE);
}
