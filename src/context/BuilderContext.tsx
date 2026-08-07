import type { Active, Over } from '@dnd-kit/core';
import { createContext } from 'react';
import {
  type PolyState,
  type RhythmBlock,
  type Section,
} from './BuilderContext.types';
import { type RhythmBlockStore } from './IndexedDB.types';

export type RhythmBuilderContextType = {
  rhythmWorkflow: RhythmBlockStore;
  sections: Section[];
  // rhythmBlocks: RhythmBlock[];
  updateBlock: (id: string, patch: Partial<RhythmBlock | PolyState>) => void;
  addBlock: (block: RhythmBlock) => void;
  updateBlockOrder: (active: Active, over: Over) => void;
  getTotalMeasures: () => number;
  getAverageTempo: () => number;
  getWorkflowTime: () => string;
  deleteBlock: (id: string) => void;
  resetBlocks: () => void;
  setActiveBlocks: (workflow: RhythmBlockStore) => void;
  updateWorkflowName: (name: string) => void;
  resetWorkflow: () => void;
  addSection: (section: Section) => void;
  deleteSection: (id: number) => void;
  updateSection: (section: Section) => void;
};

export const RhythmBuilderContext =
  createContext<RhythmBuilderContextType | null>(null);
