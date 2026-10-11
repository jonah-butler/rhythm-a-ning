import { type ReactNode } from 'react';
import { type DropdownOptions } from '../../components/Dropdown';
import { type BeatState } from '../../timing_engine/rhythm.types';
import { subdivisionData, subdivisionDataWithEmpty } from './data';
import {
  type SubdivisionDropdownOptionsWithEmpty,
  SubdivisionKeyValue,
  SubdivisionName,
  SubdivisionValueKey,
} from './types';

/**
 *
 * @param subdivisionKey
 * @returns subdivision value
 * Accepts a subidivions key and returns that keys floating point value
 */
export const getSubdivision = (subdivisionKey: SubdivisionName): number => {
  return SubdivisionKeyValue[subdivisionKey];
};

/**
 *
 * @param subdivisionKey
 * @returns subdivision value
 * Accepts a subidivions key and returns that keys floating point value
 */
export const getSubdivisionName = (subdivision: number): SubdivisionName => {
  return SubdivisionValueKey[subdivision];
};

/**
 *
 * @param key
 * @returns <DropdownOption>
 *
 * Accepts a key like 'base', 'duplet', 'triplet', etc
 * And returns the subdivisionData entry that maps to <DropdownOption>.
 */
export const getSubdivisionData = (
  key: SubdivisionName | null,
): DropdownOptions<SubdivisionName, string> => {
  return (
    subdivisionData.find((option) => option.value === key) ?? subdivisionData[0]
  );
};

/**
 *
 * @param beats number of beats
 * @param previousSubs: current subdivisions
 * @param defaultSub: the
 * @returns <number[]>
 *
 * Used primarily for trimming/extending the subdivision array
 * when a beat count changes for an active rhythm.
 * Ex:
 *  sub = [1, 1, 0.5, 1];
 *  beats = 3
 *  result = [1, 1, 0.5]
 * Or...
 *  sub = [1, 0.5]
 *  beats = 5
 *  result = [1, 0.5, 1, 1, 1]
 *
 */
export const buildSubdivision = (
  beats: number,
  previousSubs?: number[],
  defaultSub = SubdivisionKeyValue.base,
): number[] => {
  const subs: number[] = [];
  if (!previousSubs) return subs;

  for (let i = 0; i < beats; i++) {
    const sub = previousSubs[i];
    if (sub) {
      subs.push(sub);
    } else {
      subs.push(defaultSub);
    }
  }

  return subs;
};

export const calculateTotalBeats = (subs: number[]): number => {
  return subs.reduce((acc, cur) => {
    return (acc += 1 / cur);
  }, 0);
};

/**
 * Every beat starts on, as a fresh BeatState of all 1s.
 */
export const buildDefaultBeatState = (subs: number[]): BeatState[] => {
  return new Array(calculateTotalBeats(subs)).fill(1);
};

/**
 * Single entry point for subdivisions coming from outside the app
 * (API, IndexedDB, share urls). Prefers the per-beat `subdivisions` array and
 * falls back to the legacy single `subdivision` applied to every beat.
 * Always returns exactly `beats` entries.
 */
export const resolveSubdivisions = (
  subdivisions: (SubdivisionName | number)[] | null | undefined,
  legacySubdivision: string | null | undefined,
  beats: number,
): number[] => {
  if (subdivisions?.length) {
    const subs = subdivisions.map((sub) =>
      typeof sub === 'number' ? sub : getSubdivision(sub),
    );
    return buildSubdivision(beats, subs);
  }

  const legacy =
    SubdivisionKeyValue[legacySubdivision as SubdivisionName] ??
    SubdivisionKeyValue.base;
  return new Array(beats).fill(legacy);
};

/**
 * Wire format for the API: subdivision names rather than floats.
 */
export const toSubdivisionNames = (subs: number[]): SubdivisionName[] => {
  return subs.map(getSubdivisionName);
};

/**
 * The dropdown option for the selected beat. For 'all', the shared
 * subdivision if every beat matches, otherwise the empty '--' option.
 */
export const getSubdivisionPerBeat = (
  selectedBeat: DropdownOptions,
  subs?: number[],
): SubdivisionDropdownOptionsWithEmpty => {
  const emptySub = subdivisionDataWithEmpty.find((sub) => sub.value === '')!;
  if (!subs?.length) return emptySub;

  const beat = parseInt(selectedBeat.value);
  if (isNaN(beat)) {
    const identicalSubs = subs.every((sub) => sub === subs[0]);
    if (!identicalSubs) return emptySub;
    return (
      subdivisionDataWithEmpty.find(
        (sub) => sub.value === getSubdivisionName(subs[0]),
      ) ?? emptySub
    );
  }

  return (
    subdivisionDataWithEmpty.find(
      (sub) => sub.value === getSubdivisionName(subs[beat - 1]),
    ) ?? emptySub
  );
};

/**
 * Icon for a whole rhythm: the shared subdivision's note when every beat
 * matches, otherwise the '--' label.
 */
export const getSubdivisionIcon = (subs: number[]): ReactNode => {
  const option = getSubdivisionPerBeat({ label: 'all', value: 'all' }, subs);
  return option.icon ?? option.label;
};
