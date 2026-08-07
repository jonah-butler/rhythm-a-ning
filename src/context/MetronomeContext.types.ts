import type { RhythmBlock } from './BuilderContext.types';

export type MetronomeContextType = {
  rhythm: RhythmBlock;
  setRhythm: (rhythm: RhythmBlock) => void;
  updateRhythm: (patch: Partial<RhythmBlock>) => void;
  isSavedRhythm: () => boolean;
};
