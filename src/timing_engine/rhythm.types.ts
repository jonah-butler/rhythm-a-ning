import { type ISoundPlayer, Sound } from './oscillator.types';

export type RhythmParams = {
  beats: number;
  subdivision: number;
  sound: ISoundPlayer;
  state: BeatState[];
  poly?: number;
  sounds: Sound[][];
  subNew?: number[];
};

export type BeatState = 0 | 1;

export type BeatUpdatePayload = {
  beats: number;
  sub?: number[];
};

export type RhythmEvents = {
  scheduled: number;
  beatChange: number;
  updatedBeats: BeatUpdatePayload;
};
