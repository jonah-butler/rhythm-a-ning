import { type GenericResponse } from '../types';
import { type RhythmBlock, type Section } from './BuilderContext.types';

export const DB_VERSION = 3;
export const DB_NAME = 'metronome';

export const DB_STORES = {
  workflows: 'WORKFLOWS',
};

// Workflow Store
export type RhythmBlockStore = {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  sections: Section[];
  blocks: RhythmBlock[];
};

export type SaveWorkflowResponse = GenericResponse<null>;
