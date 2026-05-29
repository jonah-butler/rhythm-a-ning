import { getSoundMap } from '../services/sound.services';

import {
  type FrequencyData,
  type NotePlayer,
  type OscillatorParams,
  PlayerType,
  Sound,
} from './oscillator.types';

// just name it as note player or something more generic
export class Oscillator implements NotePlayer {
  private static soundMap = getSoundMap();

  audioCtx: AudioContext;
  frequency: number;
  beatOneOffset: number;
  subdividedOffset: number;
  gain: number;
  type: PlayerType;
  sound: Sound | null;

  constructor({
    audioCtx,
    frequency,
    beatOneOffset,
    subdividedOffset,
    gain,
    type,
    sound,
  }: OscillatorParams) {
    this.audioCtx = audioCtx;
    this.frequency = frequency;
    this.beatOneOffset = beatOneOffset;
    this.subdividedOffset = subdividedOffset;
    this.gain = gain;
    this.sound = PlayerType.Sound && sound !== undefined ? sound : null;
    this.type = type ? type : PlayerType.Oscillator;
  }

  play(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
    sound: Sound,
  ): OscillatorNode | AudioBufferSourceNode | null {
    let node: OscillatorNode | AudioBufferSourceNode | null;
    switch (sound) {
      case Sound.Oscillator:
        node = this.playOscillator(startTime, isFirstNote, isSubdividedNote);
        break;
      default:
        node = this.playSound(startTime, isFirstNote, isSubdividedNote, sound);
    }

    return node;
  }

  playSound(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
    sound: Sound,
  ): AudioBufferSourceNode | null {
    if (sound === null) return null;
    const buffer = Oscillator.soundMap[sound];
    if (!buffer) return null; // still loading

    const source = this.audioCtx.createBufferSource();
    const gain = this.audioCtx.createGain();

    source.buffer = Oscillator.soundMap[sound];

    // Pitch-shift via playbackRate instead of osc frequency
    let freq = this.frequency;
    if (isFirstNote) freq *= this.calculateInterval(this.beatOneOffset);
    else if (isSubdividedNote) {
      const interval = this.calculateInterval(this.subdividedOffset);
      freq = this.subdividedOffset <= 0 ? freq / interval : freq * interval;
    }
    source.playbackRate.value = freq / this.frequency; // ratio relative to base

    source.connect(gain);
    gain.connect(this.audioCtx.destination);
    gain.gain.setValueAtTime(this.gain, startTime);
    source.start(startTime);

    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };

    return source;
  }

  playOscillator(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
  ) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';

    // compute base frequency
    let freq = this.frequency;
    if (isFirstNote) freq = freq * this.calculateInterval(this.beatOneOffset);
    else if (isSubdividedNote) {
      const interval = this.calculateInterval(this.subdividedOffset);
      if (this.subdividedOffset <= 0) {
        freq = freq / interval;
      } else {
        freq = freq * interval;
      }
    }

    osc.frequency.setValueAtTime(freq, startTime);

    // connect chain properly
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    // avoid negative time scheduling
    const safeStart = Math.max(0, startTime - 0.005);

    gain.gain.setValueAtTime(0.01, safeStart);
    gain.gain.exponentialRampToValueAtTime(this.gain, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.045);

    osc.start(startTime);
    osc.stop(startTime + 0.05);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    return osc;
  }

  updateFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  calculateInterval(range: number): number {
    switch (range) {
      case -5:
        return 2;
      case -4:
        return 3 / 2;
      case -3:
        return 3 / 2;
      case -2:
        return 4 / 3;
      case -1:
        return 5 / 4;
      case 0:
        return 6 / 5;
      case 1:
        return 1;
      case 2:
        return 6 / 5;
      case 3:
        return 5 / 4;
      case 4:
        return 4 / 3;
      case 5:
        return 3 / 2;
      case 6:
        return 2;
      default:
        return 1;
    }
  }

  updateFrequencyData(data: FrequencyData): void {
    this.frequency = data.frequency;
    this.beatOneOffset = data.beatOneOffset;
    this.subdividedOffset = data.subdividedOffset;
    this.gain = data.gain;
  }
}
