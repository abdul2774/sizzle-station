// Every sound is synthesized with WebAudio: no audio files, nothing fetched.
// The sizzle is a looped noise buffer through a band-pass filter whose gain
// follows how many things are cooking; the rest are short one-shots.
export function createAudio() {
  let context = null;
  let master = null;
  let sizzleGain = null;
  let muted = false;
  let sizzleLevel = 0;

  /** Must be called from a user gesture at least once; later calls are free. */
  function unlock() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
      const length = context.sampleRate;
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 5200;
      filter.Q.value = 0.6;
      sizzleGain = context.createGain();
      sizzleGain.gain.value = 0;
      noise.connect(filter);
      filter.connect(sizzleGain);
      sizzleGain.connect(master);
      noise.start();
    } catch {
      context = null;
    }
  }

  function tone(freq, start, duration, type, volume, slideTo) {
    if (!context || muted) return;
    const now = context.currentTime + start;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function noiseBurst(start, duration, filterFreq, volume) {
    if (!context || muted) return;
    const now = context.currentTime + start;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
  }

  /** The sizzle follows the kitchen: 0 when nothing cooks, up to 1 at full grill. */
  function setSizzle(level) {
    sizzleLevel = Math.max(0, Math.min(1, level));
    if (context && sizzleGain) {
      sizzleGain.gain.setTargetAtTime(muted ? 0 : sizzleLevel * 0.16, context.currentTime, 0.15);
    }
  }

  function play(name) {
    if (!context || muted) return;
    if (name === 'chop') {
      noiseBurst(0, 0.09, 1800, 0.5);
      tone(140, 0, 0.08, 'sine', 0.35, 70);
    } else if (name === 'ding') {
      tone(1174, 0, 0.18, 'sine', 0.3);
      tone(1568, 0.08, 0.28, 'sine', 0.28);
    } else if (name === 'coin') {
      tone(659, 0, 0.1, 'triangle', 0.3);
      tone(784, 0.08, 0.1, 'triangle', 0.3);
      tone(1046, 0.16, 0.22, 'triangle', 0.32);
    } else if (name === 'serve') {
      tone(523, 0, 0.12, 'triangle', 0.3);
      tone(659, 0.09, 0.12, 'triangle', 0.3);
      tone(784, 0.18, 0.12, 'triangle', 0.3);
      tone(1046, 0.27, 0.3, 'triangle', 0.34);
    } else if (name === 'buzz') {
      tone(110, 0, 0.16, 'square', 0.2, 90);
    } else if (name === 'pop') {
      tone(520, 0, 0.07, 'sine', 0.3, 880);
    } else if (name === 'burn') {
      tone(233, 0, 0.16, 'sawtooth', 0.22, 180);
      tone(233, 0.2, 0.16, 'sawtooth', 0.22, 180);
    } else if (name === 'tick') {
      tone(980, 0, 0.05, 'sine', 0.16);
    } else if (name === 'pickup') {
      tone(440, 0, 0.06, 'sine', 0.22, 660);
    } else if (name === 'expire') {
      tone(311, 0, 0.2, 'triangle', 0.28, 233);
      tone(233, 0.18, 0.3, 'triangle', 0.26, 175);
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (context && sizzleGain) sizzleGain.gain.value = muted ? 0 : sizzleLevel * 0.16;
    return muted;
  }

  return { unlock, play, setSizzle, toggleMute, get muted() { return muted; } };
}
