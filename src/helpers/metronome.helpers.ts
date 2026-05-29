import { subdivisionData } from '../data';
import { getBeatState } from '../services/rhythm.services';
import { Sound } from '../timing_engine/oscillator.types';
import { type BeatState } from '../timing_engine/rhythm.types';

type QueryValidation = {
  bpm: number;
  baseCount: number;
  baseSubdivion: number;
  beatState: BeatState[];
  beatSounds: Sound[];
  usePoly: boolean;
  polyCount: number;
  polySubdivision: number;
  polyBeatState: BeatState[];
  polyBeatSound: Sound[];
};

export const isMobileUserAgent = (): boolean => {
  const userAgent = navigator.userAgent;
  return /android|ipad|iphone|ipod|blackberry|webos|iemobile|mobile/i.test(
    userAgent,
  );
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

    const baseSubdivision = params.get('bs');
    if (baseSubdivision && Number.isInteger(+baseSubdivision)) {
      validation.baseSubdivion = +baseSubdivision > 8 ? 0 : +baseSubdivision;
    } else {
      validation.baseSubdivion = 0;
    }

    const baseState = params.get('bst');
    const subLabel = subdivisionData[validation.baseSubdivion];
    const referenceState = getBeatState(
      validation.baseCount + 1,
      subLabel.value,
    );
    if (baseState && Number.isInteger(+baseState)) {
      const normalizedState = baseState
        .split('')
        .map((num) => +num) as BeatState[];
      validation.beatState = normalizedState.slice(0, referenceState.length);
    } else {
      validation.beatState = referenceState;
    }

    const baseSounds = params.get('bsst');
    if (baseSounds && Number.isInteger(+baseSounds)) {
      validation.beatSounds = baseSounds
        .split('')
        .map((num) => +num) as Sound[];
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

    const polySubdivision = params.get('ps');
    if (polySubdivision && Number.isInteger(+polySubdivision)) {
      validation.polySubdivision = +polySubdivision > 8 ? 0 : +polySubdivision;
    } else {
      validation.polySubdivision = 0;
    }

    const basePolyState = params.get('pbst');
    const polySubLabel = subdivisionData[validation.polySubdivision];
    const referencePolyState = getBeatState(
      validation.polyCount + 1,
      polySubLabel.value,
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
    if (polyBaseSounds && Number.isInteger(+polyBaseSounds)) {
      validation.polyBeatSound = polyBaseSounds
        .split('')
        .map((num) => +num) as Sound[];
    }

    return validation;
  } catch {
    return validation;
  }
};
