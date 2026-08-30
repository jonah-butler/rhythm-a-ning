import { v4 as uuidv4 } from 'uuid';
import type { DropdownOptions } from '../components/Dropdown';
import { type RhythmBlock } from '../context/BuilderContext.types';
import { type RhythmSlim } from '../context/MetronomeContext.types';
import { beatCountData, subdivisionData } from '../data';
import { Sound } from '../timing_engine/oscillator.types';
import { type BeatState } from '../timing_engine/rhythm.types';
import { Subdivisions } from '../timing_engine/types';
import type { Subdivision } from './api/types/rhythm.types';
import {
  RhythmType,
  type CreateRhythmBody,
  type RhythmResponse,
} from './api/types/rhythm.types';

export type RhythmBlockSlim = Pick<
  RhythmBlock,
  'bpm' | 'subdivision' | 'beats' | 'usePoly' | 'state'
>;

export const getSubdivision = (subdivisionKey: string): number => {
  return Subdivisions[subdivisionKey as keyof typeof Subdivisions];
};

const FOUR_BEATS = beatCountData[3];

export const getBeatCount = (beats: number | null): DropdownOptions => {
  return beatCountData.find((b) => b.value === beats?.toString()) || FOUR_BEATS;
};

export const getSubdivisionData = (
  key: Subdivision | null,
): DropdownOptions => {
  return (
    subdivisionData.find((option) => option.value === key) ?? subdivisionData[0]
  );
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
  const newSounds = new Array(beats).fill([defaultSound ?? Sound.Oscillator]);
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

/**
 * Stable projection of the fields that define how a rhythm *sounds*, for
 * change detection. Deliberately excludes id/name/description/timestamps --
 * renaming a rhythm is not a settings change.
 *
 * Projects to primitives rather than stringifying the rhythm directly:
 * DropdownOptions carries an optional `icon` React node, which is not
 * serializable, and the option objects are re-created by `getSubdivisionData`
 * and friends so reference equality is not reliable either.
 */
export function rhythmFingerprint(rhythm: RhythmSlim): string {
  return JSON.stringify([
    rhythm.bpm,
    rhythm.measures,
    rhythm.beats.value,
    rhythm.subdivision.value,
    rhythm.state,
    rhythm.sounds,
    rhythm.usePoly,
    // poly settings are inaudible while the toggle is off, so editing them
    // then does not count as a change -- only flipping the toggle itself does
    rhythm.usePoly
      ? [
          rhythm.polyBeats.value,
          rhythm.polySubdivision.value,
          rhythm.polyState,
          rhythm.polySounds,
        ]
      : null,
  ]);
}

export function rhythmToSlim(rhythm: RhythmResponse): RhythmSlim {
  const {
    id,
    bpm,
    measures,
    subdivision,
    beats,
    isPoly,
    state,
    sounds,
    name,
    description,
    polyBeats,
    polySubdivision,
    polySounds,
    polyState,
    updatedAt,
    createdAt,
  } = rhythm;

  const polySubdivisionWithDefault = getSubdivisionData(polySubdivision);
  const polyBeatsWithDefault = getBeatCount(polyBeats);

  const normalizedMeasure = measures ? measures : 1;

  return {
    id,
    bpm,
    measures: normalizedMeasure,
    subdivision: getSubdivisionData(subdivision),
    beats: getBeatCount(beats),
    usePoly: isPoly,
    state,
    sounds,
    name,
    description,
    polyBeats: polyBeatsWithDefault,
    polySubdivision: polySubdivisionWithDefault,
    polySounds:
      polySounds ?? getBeatSoundState(+polyBeatsWithDefault.value, []),
    polyState:
      polyState ??
      getBeatState(
        +polyBeatsWithDefault.value,
        polySubdivisionWithDefault.value,
      ),
    createdAt,
    updatedAt,
  };
}

export function createRhythmPayload(
  rhythm: RhythmSlim,
  meta: { title: string; description: string },
): CreateRhythmBody {
  const payload: Partial<CreateRhythmBody> = {
    bpm: rhythm.bpm,
    beats: +rhythm.beats.value,
    measures: rhythm.measures,
    sounds: rhythm.sounds,
    subdivision: rhythm.subdivision.value as Subdivision,
    state: rhythm.state,
    name: meta.title,
    description: meta.description,
  };

  if (rhythm.usePoly) {
    payload.rhythmType = RhythmType.Poly;
  } else {
    payload.rhythmType = RhythmType.Mono;
  }

  switch (payload.rhythmType) {
    case RhythmType.Mono:
      payload.rhythmType = RhythmType.Mono;
      break;
    case RhythmType.Poly:
      payload.rhythmType = RhythmType.Poly;
      payload.polyBeats = +rhythm.polyBeats.value;
      payload.polyState = rhythm.polyState;
      payload.polySounds = rhythm.polySounds;
      payload.polySubdivision = rhythm.polySubdivision.value as Subdivision;
      break;
    default:
      break;
  }

  return payload as CreateRhythmBody;
}
