import { v4 as uuidv4 } from 'uuid';
import type { DropdownOptions } from '../components/Dropdown';
import { type RhythmBlock } from '../context/BuilderContext.types';
import { beatCountData, subdivisionData } from '../data';
import { Sound } from '../timing_engine/oscillator.types';
import { type BeatState } from '../timing_engine/rhythm.types';
import { Subdivisions } from '../timing_engine/types';

export type RhythmBlockSlim = Pick<
  RhythmBlock,
  'bpm' | 'subdivision' | 'beats' | 'usePoly' | 'state'
>;

export const getSubdivision = (subdivisionKey: string): number => {
  return Subdivisions[subdivisionKey as keyof typeof Subdivisions];
};

const FOUR_BEATS = beatCountData[3];

export const getBeatCount = (beats: number): DropdownOptions => {
  return beatCountData.find((b) => b.value === beats.toString()) || FOUR_BEATS;
};

export const getBeatState = (
  beats: number,
  subdivisionKey: string | number,
): BeatState[] => {
  let subdivision: number;
  if (typeof subdivisionKey === 'string') {
    subdivision = getSubdivision(subdivisionKey);
  } else {
    subdivision = subdivisionKey;
  }

  return new Array(beats / subdivision).fill(1);
};

// export const getBeatSoundState = (
//   beats: number,
//   previousSounds: Sound[],
//   defaultSound?: Sound,
// ): Sound[] => {
//   const newSounds = new Array(beats).fill(defaultSound ?? Sound.HiHat);
//   for (let i = 0; i < beats; i++) {
//     if (previousSounds[i] !== undefined) {
//       newSounds[i] = previousSounds[i];
//     }
//   }

//   return newSounds;
// };

export const getBeatSoundState = (
  beats: number,
  previousSounds: Sound[][],
  defaultSound?: Sound,
): Sound[][] => {
  const newSounds = new Array(beats).fill([defaultSound ?? Sound.HiHat]);
  for (let i = 0; i < beats; i++) {
    if (previousSounds[i] !== undefined) {
      newSounds[i] = previousSounds[i];
    }
  }

  return newSounds;
};

export const sanitizeOption = (option: DropdownOptions) => {
  const clonedOption = { ...option };
  delete clonedOption.icon;
  return clonedOption;
};

export const generateUUID = (): string => {
  const crypto = window.crypto;
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return uuidv4();
};

export enum Rhythms {
  SonClave23 = 'sonclave23',
  SonClave32 = 'sonclave32',
  RumbaClave23 = 'rumbaclave23',
  RumbaClave32 = 'rumbaclave32',
  Tresillo = 'tresillo',
}

export const RhythmsData: Record<Rhythms, RhythmBlockSlim> = {
  [Rhythms.SonClave23]: {
    bpm: 120,
    subdivision: sanitizeOption(subdivisionData[3]),
    beats: beatCountData[3],
    usePoly: false,
    state: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  },
  [Rhythms.SonClave32]: {
    bpm: 120,
    subdivision: sanitizeOption(subdivisionData[3]),
    beats: beatCountData[3],
    usePoly: false,
    state: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  [Rhythms.RumbaClave23]: {
    bpm: 120,
    subdivision: sanitizeOption(subdivisionData[3]),
    beats: beatCountData[3],
    usePoly: false,
    state: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  },
  [Rhythms.RumbaClave32]: {
    bpm: 120,
    subdivision: sanitizeOption(subdivisionData[3]),
    beats: beatCountData[3],
    usePoly: false,
    state: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  [Rhythms.Tresillo]: {
    bpm: 120,
    subdivision: sanitizeOption(subdivisionData[1]),
    beats: beatCountData[3],
    usePoly: false,
    state: [1, 0, 0, 1, 0, 0, 1, 0],
  },
};
