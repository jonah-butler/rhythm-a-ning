export interface ISoundPlayer {
  play(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
    sounds: Sound[],
  ): OscillatorNode | AudioBufferSourceNode | null;
  updateFrequency(frequency: number): void;
  updateFrequencyData(data: FrequencyData): void;
}

export type OscillatorParamsBase = {
  audioCtx: AudioContext;
  frequency: number;
  beatOneOffset: number;
  subdividedOffset: number;
  gain: number;
};

export type OscillatorParamsOscillator = OscillatorParamsBase & {
  type: PlayerType.Oscillator;
  sound: null;
};

export type OscillatorParamsSound = OscillatorParamsBase & {
  type: PlayerType.Sound;
  sound: Sound;
};

export type OscillatorParams =
  | OscillatorParamsOscillator
  | OscillatorParamsSound;

export type FrequencyData = {
  frequency: number;
  beatOneOffset: number;
  subdividedOffset: number;
  gain: number;
};

export enum PlayerType {
  Oscillator,
  Sound,
}

export enum Sound {
  Kick,
  Snare,
  Cowbell,
  HiHat,
  Oscillator,
}

export type SoundMap = Record<Sound, AudioBuffer>;
