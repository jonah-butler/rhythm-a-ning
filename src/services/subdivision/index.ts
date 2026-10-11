import { type DropdownOptions } from '../../components/Dropdown';
import { subdivisionData } from './data';
import {
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
