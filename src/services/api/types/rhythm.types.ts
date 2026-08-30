import type { Sound } from '../../../timing_engine/oscillator.types';
import type { BeatState } from '../../../timing_engine/rhythm.types';

export enum Subdivision {
  Base = 'base',
  Duplet = 'duplet',
  Triplet = 'triplet',
  Quadruplet = 'quadruplet',
  Quintuplet = 'quintuplet',
  Sextuplet = 'sextuplet',
  Septuplet = 'septuplet',
  Octuplet = 'octuplet',
  Nonuplet = 'nonuplet',
  Decuplet = 'decuplet',
}

export enum RhythmType {
  Mono,
  Poly,
}

export enum RhythmLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export type CreateRhythmBody = {
  bpm: number;
  beats: number;
  measures: number;
  subdivision: Subdivision;
  state: BeatState[];
  name: string;
  description: string;
  // level: RhythmLevel;
  sounds: Sound[][];
} & (CreateMonoRhythmBody | CreatePolyRhythmBody);

export type CreateMonoRhythmBody = {
  rhythmType: RhythmType.Mono;
};

export type CreatePolyRhythmBody = {
  rhythmType: RhythmType.Poly;
  polyBeats: number;
  polyState: BeatState[];
  polySounds: Sound[][];
  polySubdivision: Subdivision;
};

export type RhythmResponse = {
  rhythmType: RhythmType;
  bpm: number;
  beats: number;
  measures: number;
  sounds: Sound[][];
  subdivision: Subdivision;
  state: BeatState[];
  name: string;
  level: null;
  description: string;
  polyBeats: number | null;
  polyState: BeatState[] | null;
  polySounds: Sound[][] | null;
  polySubdivision: Subdivision | null;
  id: string;
  isPoly: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type GetRhythmsResponse = {
  rhythms: RhythmResponse[];
  total: number;
};

export type CreateRhythmResponse = {
  rhythm: RhythmResponse;
};

export type SubdivisionResponse = {
  subdivisionId: number;
  name: Subdivision;
};
