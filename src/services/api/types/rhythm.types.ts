import type { Sound } from '../../../timing_engine/oscillator.types';
import type { SubdivisionName } from '../../subdivision/types';
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
  /** One subdivision name per beat. */
  subdivisions: SubdivisionName[];
  // legacy: drop once the API reads `subdivisions`
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
  polySubdivisions: SubdivisionName[];
  // legacy: drop once the API reads `polySubdivisions`
  polySubdivision: Subdivision;
};

export type RhythmResponse = {
  rhythmType: RhythmType;
  bpm: number;
  beats: number;
  measures: number;
  sounds: Sound[][];
  subdivisions?: SubdivisionName[] | null;
  // legacy: rhythms saved before per-beat subdivisions
  subdivision: Subdivision | null;
  state: BeatState[];
  name: string;
  level: null;
  description: string;
  polyBeats: number | null;
  polyState: BeatState[] | null;
  polySounds: Sound[][] | null;
  polySubdivisions?: SubdivisionName[] | null;
  // legacy: rhythms saved before per-beat subdivisions
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
