import { Emitter } from '../services/emit';
import {
  type FrequencyData,
  type ISoundPlayer,
  Sound,
} from './oscillator.types';
import type { BeatState, RhythmEvents, RhythmParams } from './rhythm.types';

type BeatChanges = {
  hasUpdate: boolean;
  poly: {
    beats: number | null;
  };
  base: {
    beats: number | null;
  };
};

export class Rhythm extends Emitter<RhythmEvents> {
  killed = true;
  step: number = 0;
  activeOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
  pendingBeatChange: number | null = null;
  pendingPolyBeatChange: number | null = null;
  pendingBeatChangeType: 'poly' | 'base' | null = null;
  pendingBeatChanges: BeatChanges = {
    hasUpdate: false,
    poly: { beats: null },
    base: { beats: null },
  };
  private isPolyrhythm: boolean;

  poly: number; // optional poly beats defaults to [beats] value if undefined
  beats: number; // num of beats in a measure
  sound: ISoundPlayer; // instanceof NotePlayer(osciallator)
  nextNote = 0; // the look ahead in absolute time in relation to the atomic clock
  beatTrack: number; // tracks total num of beats - for UI
  state: BeatState[]; // current BeatState for determining if a note should be played or not
  sounds: Sound[][];
  private _subdivisions: number[] = [];
  // Beat position of every tick in one cycle, indexed by `step`. A triplet on
  // beat 1 of a 4-beat bar gives [1, 1.333, 1.667, 2, 3, 4]. Rebuilt whenever
  // `subdivisions` is assigned.
  private tickGrid: number[] = [];

  get subdivisions(): number[] {
    return this._subdivisions;
  }

  set subdivisions(subdivisions: number[]) {
    this._subdivisions = subdivisions;
    this.tickGrid = this.buildTickGrid();
  }

  constructor({
    beats,
    sound,
    poly,
    state,
    sounds,
    subdivisions,
  }: RhythmParams) {
    super();
    this.beats = beats;
    this.sound = sound;
    this.poly = poly ?? beats;
    this.beatTrack = 1;
    this.state = state;
    this.isPolyrhythm = this.beats !== this.poly;
    this.sounds = sounds;
    this.subdivisions = subdivisions;
  }

  private toTicksPerBeat(sub: number): number {
    return sub < 1 ? 1 / sub : sub;
  }

  private isFloat(value: number): boolean {
    return !Number.isInteger(value);
  }

  private get isSubdividedNote(): boolean {
    return this.isFloat(this.beatTrack);
  }

  get activeSubdivision(): number {
    return this.subdivisions[Math.floor(this.beatTrack - 1)];
  }

  get isPoly(): boolean {
    return this.isPolyrhythm;
  }

  cleanFloat(value: number, threshold = 1e-12): number {
    const rounded = Math.round(value);
    return Math.abs(rounded - value) < threshold ? rounded : value;
  }

  buildTickGrid(): number[] {
    const grid: number[] = [];
    this._subdivisions.forEach((sub, beatIndex) => {
      const ticks = Math.round(1 / sub);
      for (let i = 0; i < ticks; i++) {
        grid.push(this.cleanFloat(beatIndex + 1 + i * sub));
      }
    });
    console.log(grid);
    return grid;
  }

  calculateTotalBeats(): number {
    let total = 0;
    this.subdivisions.forEach((sub) => {
      total += 1 / sub;
    });
    return total;
  }

  /** Beat position of the tick at `step`, e.g. 1.333 for a triplet's 2nd note. */
  getBeatAtStep(step: number): number {
    return this.tickGrid[step];
  }

  private trackBeat(): void {
    const grid = this.tickGrid;
    this.step = (this.step + 1) % grid.length;
    this.beatTrack = grid[this.step];
  }

  private get isBeatOne(): boolean {
    return this.beatTrack === 1;
  }

  private get currentBeat(): number {
    return this.step + 1;
  }

  init(currentTime: number): void {
    this.nextNote = currentTime;
    this.killed = false;
    this.step = 0;
    this.beatTrack = 1;
  }

  advance(targetBpm: number, currentTime: number): void {
    const secondsPerBeat = 60 / targetBpm;
    const rhythmBeatScale = this.beats / this.poly;

    const tpb = this.toTicksPerBeat(this.activeSubdivision);
    const tickSeconds = (secondsPerBeat * rhythmBeatScale) / tpb;

    if (this.nextNote <= currentTime) {
      const stepsLate =
        Math.floor((currentTime - this.nextNote) / tickSeconds) + 1;
      this.nextNote += stepsLate * tickSeconds;
      for (let i = 0; i < stepsLate; i++) this.trackBeat();
    } else {
      this.nextNote += tickSeconds;
      this.trackBeat();
    }
  }

  applyTempoChange(oldBpm: number, newBpm: number, currentTime: number): void {
    if (this.nextNote <= currentTime) return;

    const oldSecondsPerBeat = 60 / oldBpm;
    const newSecondsPerBeat = 60 / newBpm;

    const rhythmBeatScale = this.beats / this.poly;
    const tpb = this.toTicksPerBeat(this.activeSubdivision);

    const oldTickSeconds = (oldSecondsPerBeat * rhythmBeatScale) / tpb;
    const newTickSeconds = (newSecondsPerBeat * rhythmBeatScale) / tpb;

    const remainingOld = this.nextNote - currentTime;
    const fractionRemaining = remainingOld / oldTickSeconds;

    const remainingNew = fractionRemaining * newTickSeconds;

    this.nextNote = currentTime + remainingNew;
  }

  play(): void {
    if (this.killed) return;
    const tempBeat = this.beatTrack;

    if (this.pendingBeatChanges.hasUpdate && tempBeat === 1) {
      this.handleBeatChange();
    }

    this.emit('scheduled', tempBeat); // use this elsewhere too

    if (this.state[this.currentBeat - 1]) {
      const osc = this.sound.play(
        this.nextNote,
        this.isBeatOne,
        this.isSubdividedNote,
        this.sounds[this.currentBeat - 1],
        // gainNode,
      );

      if (osc) {
        this.activeOscillators.push(osc); // type safety
      }

      const delay = (this.nextNote - (osc?.context?.currentTime ?? 0)) * 1000;
      setTimeout(() => {
        if (!this.killed) {
          this.emit('beatChange', tempBeat);
        }
      }, delay);

      if (!osc) return;

      osc.onended = (): void => {
        // if (!this.killed) {
        //   this.emit('beatChange', tempBeat);
        // }

        this.activeOscillators = this.activeOscillators.filter(
          (o) => o !== osc,
        );
      };
    } else {
      // this.emit('beatChange', tempBeat);
    }
  }

  kill(): void {
    this.killed = true;

    for (const osc of this.activeOscillators) {
      osc.stop();
    }

    this.beatTrack = 1;
    this.step = 0;
    this.activeOscillators = [];
    this.nextNote = 0;
    this.emit('beatChange', 1);
  }

  updateState(index: number, state: BeatState): void {
    this.state[index] = state;
  }

  overwriteState(state: BeatState[]): void {
    this.state = state;
  }

  handleBeatChange(): void {
    const pendingBeat = this.pendingBeatChanges.base.beats;
    const pendingPolyBeat = this.pendingBeatChanges.poly.beats;

    if (pendingBeat) {
      // base has matching beat counts
      if (!this.isPolyrhythm) {
        this.poly = pendingPolyBeat || pendingBeat;
      }

      this.beats = pendingBeat;

      if (this.isPoly) {
        this.emit('updatedBeats', { beats: this.poly, sub: this.subdivisions });
      } else {
        this.emit('updatedBeats', {
          beats: this.beats,
          sub: this.subdivisions,
        });
      }
    }

    if (pendingPolyBeat) {
      this.poly = pendingPolyBeat;
      this.emit('updatedBeats', { beats: this.poly, sub: this.subdivisions });
    }

    // reset defaults
    this.pendingBeatChanges.hasUpdate = false;
    this.pendingBeatChanges.base.beats = null;
    this.pendingBeatChanges.poly.beats = null;
  }

  updateBeats(
    beats: number | null,
    polyBeats: number | null,
    isRunning: boolean,
  ): void {
    this.pendingBeatChanges.hasUpdate = true;

    this.pendingBeatChanges.base.beats =
      beats ?? this.pendingBeatChanges.base.beats;
    this.pendingBeatChanges.poly.beats =
      polyBeats ?? this.pendingBeatChanges.poly.beats;

    if (!isRunning) {
      this.handleBeatChange();
    }
  }

  updateSounds(sounds: Sound[][]): void {
    this.sounds = sounds;
  }

  resetState(state: BeatState[]): void {
    this.state = state;
  }

  updateFrequency(frequency: number): void {
    this.sound.updateFrequency(frequency);
  }

  updateFrequencyData(data: FrequencyData): void {
    this.sound.updateFrequencyData(data);
  }

  setSubdivisions(subdivisions: number[]): void {
    this.subdivisions = subdivisions;
  }

  updateStates(
    subdivisions: number[],
    state: BeatState[],
    sounds: Sound[][],
    bpm: number,
  ): void {
    this.subdivisions = subdivisions;
    this.state = state;
    this.sounds = sounds;

    if (this.killed) return;

    const EPS = 1e-6;
    const grid = this.tickGrid;
    const index = grid.findIndex((beat) => beat >= this.beatTrack - EPS);

    const target = index === -1 ? subdivisions.length + 1 : grid[index];
    const deltaBeats = target - this.beatTrack;
    this.nextNote += deltaBeats * (60 / bpm) * (this.beats / this.poly);

    this.step = index === -1 ? 0 : index;
    this.beatTrack = grid[this.step];
  }
}
