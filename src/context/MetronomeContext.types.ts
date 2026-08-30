import type { RhythmBlock } from './BuilderContext.types';

export type RhythmSlim = Omit<RhythmBlock, 'section'> & {
  createdAt: string | null;
  updatedAt: string | null;
};

export type MetronomeContextType = {
  rhythm: RhythmSlim;
  /**
   * Bumps every time the whole rhythm is replaced via `setRhythm`. Consumers
   * that mirror the rhythm outside of React (the audio engine) watch this to
   * know a rebuild is required, rather than diffing individual fields.
   */
  loadToken: number;
  /**
   * True when the rhythm's *audible* settings differ from the last saved or
   * loaded baseline. Ignores id/name/description/timestamps.
   */
  settingsChanged: boolean;
  /** Replaces the entire rhythm. Rebuilds the audio engine. */
  setRhythm: (rhythm: RhythmSlim) => void;
  /** Patches fields whose engine side-effects the caller has already applied. */
  updateRhythm: (patch: Partial<RhythmSlim>) => void;
  /** Re-baselines `settingsChanged` after a successful save or update. */
  markRhythmSaved: () => void;
  isSavedRhythm: () => boolean;
  generateDefaultMetronome: () => RhythmSlim;
};
