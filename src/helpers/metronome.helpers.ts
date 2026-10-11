import {
  buildDefaultBeatState,
  resolveSubdivisions,
} from '../services/subdivision';
import { subdivisionData } from '../services/subdivision/data';
import {
  SubdivisionKeyValue,
  SubdivisionValueKey,
} from '../services/subdivision/types';
import { Sound } from '../timing_engine/oscillator.types';
import { type BeatState } from '../timing_engine/rhythm.types';

type QueryValidation = {
  bpm: number;
  baseCount: number;
  baseSubdivisions: number[];
  beatState: BeatState[];
  beatSounds: Sound[][];
  usePoly: boolean;
  polyCount: number;
  polySubdivisions: number[];
  polyBeatState: BeatState[];
  polyBeatSound: Sound[][];
};

export const isMobileUserAgent = (): boolean => {
  const userAgent = navigator.userAgent;
  return /android|ipad|iphone|ipod|blackberry|webos|iemobile|mobile/i.test(
    userAgent,
  );
};

/**
 * Per-beat subdivisions are shared as ticks per beat, e.g. `1,3,1,1`.
 * Links made before that carry a single index into the subdivision list
 * (`bs`/`ps`), which still resolves for every beat.
 */
const parseSubdivisions = (
  params: URLSearchParams,
  key: string,
  legacyKey: string,
  beats: number,
): number[] => {
  const ticks = params.get(key);
  const parsed = ticks
    ? ticks.split(',').map((tick) => {
        const sub = 1 / +tick;
        return Number.isInteger(+tick) && SubdivisionValueKey[sub]
          ? sub
          : SubdivisionKeyValue.base;
      })
    : null;

  const legacyIndex = params.get(legacyKey);
  const legacy =
    legacyIndex && Number.isInteger(+legacyIndex)
      ? subdivisionData[+legacyIndex]?.value
      : null;

  return resolveSubdivisions(parsed, legacy, beats);
};

export const parseMetronomeQueryParams = (query: string): QueryValidation => {
  const validation = {
    bpm: 60,
    usePoly: false,
  } as QueryValidation;

  if (query === '') {
    return validation;
  }

  try {
    // trim ? first
    const decodedQuery = atob(query.slice(1));
    const params = new URLSearchParams(decodedQuery);

    const bpm = params.get('bpm');
    if (bpm && Number.isInteger(+bpm)) {
      validation.bpm = Math.min(Math.max(+bpm, 20), 250);
    }

    const baseCount = params.get('bc');
    if (baseCount && Number.isInteger(+baseCount)) {
      validation.baseCount = +baseCount > 10 ? 3 : +baseCount;
    } else {
      validation.baseCount = 3;
    }

    validation.baseSubdivisions = parseSubdivisions(
      params,
      'bsd',
      'bs',
      validation.baseCount + 1,
    );

    const baseState = params.get('bst');
    const referenceState = buildDefaultBeatState(validation.baseSubdivisions);
    if (baseState && Number.isInteger(+baseState)) {
      const normalizedState = baseState
        .split('')
        .map((num) => +num) as BeatState[];
      validation.beatState = normalizedState.slice(0, referenceState.length);
    } else {
      validation.beatState = referenceState;
    }

    const baseSounds = params.get('bsst');
    if (baseSounds) {
      validation.beatSounds = baseSounds
        .split('-')
        .map((sounds) => sounds.split(',').map((s) => +s));
    }

    const usePoly = params.get('p');
    if (usePoly && Number.isInteger(+usePoly) && +usePoly === 1) {
      validation.usePoly = true;
    }

    const polyCount = params.get('pc');
    if (polyCount && Number.isInteger(+polyCount)) {
      validation.polyCount = +polyCount > 10 ? 2 : +polyCount;
    } else {
      validation.polyCount = 2;
    }

    validation.polySubdivisions = parseSubdivisions(
      params,
      'psd',
      'ps',
      validation.polyCount + 1,
    );

    const basePolyState = params.get('pbst');
    const referencePolyState = buildDefaultBeatState(
      validation.polySubdivisions,
    );
    if (basePolyState && Number.isInteger(+basePolyState)) {
      const normalizedState = basePolyState
        .split('')
        .map((num) => +num) as BeatState[];
      validation.polyBeatState = normalizedState.slice(
        0,
        referencePolyState.length,
      );
    } else {
      validation.polyBeatState = referencePolyState;
    }

    const polyBaseSounds = params.get('bpsst');
    if (polyBaseSounds) {
      validation.polyBeatSound = polyBaseSounds
        .split('-')
        .map((sounds) => sounds.split(',').map((s) => +s));
    }

    return validation;
  } catch {
    return validation;
  }
};
