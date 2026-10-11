import { type DropdownOptions } from '../../components/Dropdown';

export enum SubdivisionName {
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

export const SubdivisionKeyValue: Record<SubdivisionName, number> = {
  base: 1,
  duplet: 1 / 2,
  triplet: 1 / 3,
  quadruplet: 1 / 4,
  quintuplet: 1 / 5,
  sextuplet: 1 / 6,
  septuplet: 1 / 7,
  octuplet: 1 / 8,
  nonuplet: 1 / 9,
  decuplet: 1 / 10,
};

export type SubdivisionKeyValue = typeof SubdivisionKeyValue;

export const SubdivisionValueKey = (() => {
  const record: Record<number, SubdivisionName> = {};
  Object.keys(SubdivisionKeyValue).forEach((key) => {
    const value = SubdivisionKeyValue[key as SubdivisionName];
    record[value] = key as SubdivisionName;
  });

  return record;
})();

export type SubdivisionValueKey = typeof SubdivisionValueKey;

export type SubdivisionDropdownOptionsWithEmpty = DropdownOptions<
  SubdivisionName | ''
>;
