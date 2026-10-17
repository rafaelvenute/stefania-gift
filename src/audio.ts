import { projectorSamples } from './sound/projector';
// All interface sounds are original, generated locally. Original films keep their own audio.
class AudioDirector {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  volume = 0.7;
  videoGain: GainNode | null = null;
  videoAudible = false;
  motorSource: AudioBufferSourceNode | null = null;
  unlock() {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    if (!this.context) { this.context = new AudioCtor(); this.master = this.context.createGain(); this.master.connect(this.context.destination); }
    this.update(); void this.context.resume().catch(() => {});
  }
  update() {
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume * 0.5, this.context.currentTime, 0.02);
    if (this.videoGain && this.context) this.videoGain.gain.setTargetAtTime(this.muted || !this.videoAudible ? 0 : this.volume, this.context.currentTime, .04);
  }
  connectVideo(video: HTMLVideoElement) {
    if (!this.context || this.videoGain) return !!this.videoGain;
    try {
      this.videoGain = this.context.createGain(); this.videoGain.gain.value = 0;
      this.context.createMediaElementSource(video).connect(this.videoGain); this.videoGain.connect(this.context.destination);
      return true;
    } catch { return false; }
  }
  setVideoAudible(value: boolean) { this.videoAudible = value; this.update(); }
  click() {
    if (!this.context || !this.master) return;
    const ctx = this.context, osc = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime;
    osc.type = 'triangle'; osc.frequency.setValueAtTime(170, t); osc.frequency.exponentialRampToValueAtTime(55, t + .07);
    gain.gain.setValueAtTime(.3, t); gain.gain.exponentialRampToValueAtTime(.001, t + .09);
    osc.connect(gain); gain.connect(this.master); osc.start(t); osc.stop(t + .1);
  }
  noise(duration: number, level: number, filterFrequency = 1800, applause = false) {
    if (!this.context || !this.master) return;
    const ctx = this.context, buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate), samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const t = i / ctx.sampleRate;
      const envelope = applause ? (.2 + .8 * Math.pow(Math.sin(t * 57) * Math.sin(t * 83), 2)) : 1;
      samples[i] = (Math.random() * 2 - 1) * envelope;
    }
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), t = ctx.currentTime;
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = filterFrequency; filter.Q.value = .7;
    gain.gain.setValueAtTime(.001, t); gain.gain.linearRampToValueAtTime(level, t + .07); gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start();
  }
  stopMotor() { try { this.motorSource?.stop(); } catch { /* Already finished. */ } this.motorSource = null; }
  motor(short = false, durationScale = 1) {
    if (!this.context || !this.master) return;
    this.stopMotor();
    const stretch = short ? 1 : durationScale;
    const ctx = this.context, samples = projectorSamples(24000, 2.8 * stretch), buffer = ctx.createBuffer(1, samples.length, 24000), t = ctx.currentTime;
    buffer.copyToChannel(samples, 0);
    const source = ctx.createBufferSource(), highPass = ctx.createBiquadFilter(), lowPass = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; highPass.type = 'highpass'; highPass.frequency.value = 65; lowPass.type = 'lowpass'; lowPass.frequency.value = 6400;
    gain.gain.setValueAtTime(.85, t);
    if (short) gain.gain.exponentialRampToValueAtTime(.001, t + .22);
    else { gain.gain.setValueAtTime(.85, t + .85 * stretch); gain.gain.exponentialRampToValueAtTime(.23, t + 1.30 * stretch); gain.gain.exponentialRampToValueAtTime(.001, t + 2.65 * stretch); }
    source.connect(highPass); highPass.connect(lowPass); lowPass.connect(gain); gain.connect(this.master);
    this.motorSource = source; source.onended = () => { if (this.motorSource === source) this.motorSource = null; }; source.start(); source.stop(t + (short ? .23 : 2.7 * stretch));
  }
  paper() { this.noise(.45, .14, 2600); }
  curtain() { this.noise(1.1, .15, 450); }
  applause() { this.noise(3, .6, 1700, true); }
}
export const audio = new AudioDirector();
