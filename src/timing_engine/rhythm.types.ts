import { type ISoundPlayer, Sound } from './oscillator.types';

export type RhythmParams = {
  beats: number;
  subdivision: number;
  sound: ISoundPlayer;
  state: BeatState[];
  poly?: number;
  sounds: Sound[][];
};

export type BeatState = 0 | 1;

export type RhythmEvents = {
  scheduled: number;
  beatChange: number;
  updatedBeats: number;
};
