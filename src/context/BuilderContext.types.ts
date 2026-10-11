import { type DropdownOptions } from '../components/Dropdown';
import { beatCountData } from '../data';
import { generateUUID, getBeatSoundState } from '../services/rhythm.services';
import { buildDefaultBeatState } from '../services/subdivision';
import { SubdivisionKeyValue } from '../services/subdivision/types';
import { Sound } from '../timing_engine/oscillator.types';
import { type BeatState } from '../timing_engine/rhythm.types';
import type { RhythmBlockStore } from './IndexedDB.types';

export type RhythmBlock = {
  id: string;
  bpm: number;
  measures: number;
  /** One subdivision per beat, e.g. [1, 1/3, 1, 1]. */
  subdivisions: number[];
  beats: DropdownOptions;
  usePoly: boolean;
  state: BeatState[];
  sounds: Sound[][];
  polyBeats: DropdownOptions;
  polySubdivisions: number[];
  polyState: BeatState[];
  polySounds: Sound[][];
  section: Section;
  name: string;
  description?: string;
};

export type Section = DropdownOptions & {
  id: number;
  color?: string;
};

export type PolyState = {
  beats: DropdownOptions;
  subdivisions: number[];
  state: BeatState[];
};

export const DefaultSection: Section = {
  id: Date.now(),
  label: 'None',
  value: `${Date.now()}`,
  color: undefined,
};

const defaultSubdivisions = new Array(4).fill(SubdivisionKeyValue.base);
const defaultPolySubdivisions = new Array(3).fill(SubdivisionKeyValue.base);

export const DefaultRhythmBlock: RhythmBlock = {
  id: generateUUID(),
  bpm: 100,
  measures: 1,
  subdivisions: defaultSubdivisions,
  beats: beatCountData[3],
  usePoly: false,
  state: buildDefaultBeatState(defaultSubdivisions),
  sounds: getBeatSoundState(4, [], Sound.Oscillator),
  polyBeats: beatCountData[2],
  polySubdivisions: defaultPolySubdivisions,
  polyState: buildDefaultBeatState(defaultPolySubdivisions),
  polySounds: getBeatSoundState(3, [], Sound.Oscillator),
  section: DefaultSection,
  name: '',
};

export const DefaultRhythmWorkflow: RhythmBlockStore = {
  name: '',
  id: generateUUID(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  sections: [DefaultSection],
  blocks: [DefaultRhythmBlock],
};

export const DefaultRhythmWorkflowFactory = (): RhythmBlockStore => {
  return {
    name: '',
    id: generateUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sections: [DefaultSection],
    blocks: [DefaultRhythmBlock],
  };
};
