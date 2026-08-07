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
  level: RhythmLevel;
  sounds: BeatState[][];
} & (CreateMonoRhythmBody | CreatePolyRhythmBody);

export type CreateMonoRhythmBody = {
  type: RhythmType.Mono;
};

export type CreatePolyRhythmBody = {
  type: RhythmType.Poly;
  polyBeats: number;
  polyState: BeatState[];
  polySounds: BeatState[][];
  PolySubdivision: Subdivision;
};

/**
 * 	PolyBeats       *int              `json:"polyBeats"`
	PolyState       []int64           `json:"polyState"`
	PolySounds      JSONBSounds       `json:"polySounds"`
	PolySubdivision *SubdivisionTypes `json:"polySubdivision"`
 */

export type SubdivisionResponse = {
  subdivisionId: number;
  name: Subdivision;
};
