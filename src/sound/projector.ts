/** Original relay, accelerating intermittent transport, motor and cooling fan. */
export function projectorSamples(sampleRate = 24000, duration = 2.8) {
  const samples = new Float32Array(Math.ceil(sampleRate * duration));
  let seed = 351976, phase = 0, fan = 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 2147483648 - 1; };
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate, ramp = Math.min(t / .94, 1), speed = ramp * ramp * (3 - 2 * ramp);
    phase = (phase + (4.5 + speed * 19.5) / sampleRate) % 1;
    const white = random(); fan += .16 * (white - fan);
    const pullDown = Math.exp(-phase * 125), returnClack = Math.exp(-((phase + .64) % 1) * 150);
    const metal = Math.sin(phase * Math.PI * 114) * Math.exp(-phase * 82);
    const relay = t < .045 ? Math.exp(-t * 100) * (white * .32 + Math.sin(t * 18000) * .12) : 0;
    const transport = (pullDown * (.70 * white + .18 * metal) + returnClack * white * .30) * (.40 + speed * .60);
    const hum = (Math.sin(2 * Math.PI * 50 * t) * .027 + Math.sin(2 * Math.PI * 100 * t) * .019) * speed;
    const spindle = Math.sin(2 * Math.PI * (78 * t + 9 * t * t)) * .012 * speed;
    samples[i] = Math.tanh((transport + hum + spindle + fan * .10 * (.2 + speed * .8) + relay) * 1.15) * .8;
  }
  return samples;
}
