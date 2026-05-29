import { type DropdownOptions } from '../components/Dropdown';
import { beatCountData, subdivisionData } from '../data';
import {
  generateUUID,
  getBeatSoundState,
  getBeatState,
  sanitizeOption,
} from '../services/rhythm.services';
import { Sound } from '../timing_engine/oscillator.types';
import { type BeatState } from '../timing_engine/rhythm.types';
import type { RhythmBlockStore } from './IndexedDB.types';

export type RhythmBlock = {
  id: string;
  bpm: number;
  measures: number;
  subdivision: DropdownOptions;
  beats: DropdownOptions;
  usePoly: boolean;
  state: BeatState[];
  beatSounds: Sound[];
  polyBeats: DropdownOptions;
  polySubdivision: DropdownOptions;
  polyState: BeatState[];
  polyBeatSounds: Sound[];
};

export type PolyState = {
  beats: DropdownOptions;
  subdivision: DropdownOptions;
  state: BeatState[];
};

export const DefaultRhythmBlock = {
  id: generateUUID(),
  bpm: 100,
  measures: 1,
  subdivision: sanitizeOption(subdivisionData[0]),
  beats: beatCountData[3],
  usePoly: false,
  state: getBeatState(4, 'base'),
  beatSounds: getBeatSoundState(4, [], Sound.Oscillator),
  polyBeats: beatCountData[2],
  polySubdivision: sanitizeOption(subdivisionData[0]),
  polyState: getBeatState(3, 'base'),
  polyBeatSounds: getBeatSoundState(3, [], Sound.Oscillator),
};

export const DefaultRhythmWorkflow: RhythmBlockStore = {
  name: '',
  id: generateUUID(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  blocks: [DefaultRhythmBlock],
};

export const DefaultRhythmWorkflowFactory = (): RhythmBlockStore => {
  return {
    name: '',
    id: generateUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: [DefaultRhythmBlock],
  };
};
