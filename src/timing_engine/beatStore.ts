type BeatListener = (beat: number) => void;

/**
 * Holds the current beat outside of React state so audio ticks can drive
 * the UI without re-rendering the component tree on every subdivision.
 */
class BeatStore {
  private beat = 1;
  private listeners = new Set<BeatListener>();

  subscribe(listener: BeatListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  set(beat: number): void {
    if (beat === this.beat) return;
    this.beat = beat;
    for (const listener of this.listeners) listener(beat);
  }

  get(): number {
    return this.beat;
  }
}

export type { BeatStore };

export const baseBeatStore = new BeatStore();
export const polyBeatStore = new BeatStore();
