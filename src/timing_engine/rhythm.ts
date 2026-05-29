import { Emitter } from '../services/emit';
import { type FrequencyData, type NotePlayer, Sound } from './oscillator.types';
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
  pendingSubdivision: number | null = null;
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
  sound: NotePlayer; // instanceof NotePlayer(osciallator)
  nextNote = 0; // the look ahead in absolute time in relation to the atomic clock
  beatTrack: number; // tracks total num of beats - for UI
  subdivision: number; // current subdivision
  state: BeatState[]; // current BeatState for determining if a note should be played or not
  sounds: Sound[];

  constructor({
    beats,
    subdivision,
    sound,
    poly,
    state,
    sounds,
  }: RhythmParams) {
    super();
    this.beats = beats;
    this.subdivision = subdivision;
    this.sound = sound;
    this.poly = poly ?? beats;
    this.beatTrack = 1;
    this.state = state;
    this.isPolyrhythm = this.beats !== this.poly;
    this.sounds = sounds;
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

  private getNextValidBeat(beatGrid: number[]): { step: number; beat: number } {
    let validBeat = 1;
    let index = 0;
    for (const beat of beatGrid) {
      if (validBeat <= this.beatTrack) {
        validBeat = beat;
      }

      if (validBeat > this.beatTrack) {
        break;
      }

      index++;
    }

    return { step: index, beat: validBeat };
  }

  get isPoly(): boolean {
    return this.isPolyrhythm;
  }

  cleanFloat(value: number, threshold = 1e-12): number {
    const rounded = Math.round(value);
    return Math.abs(rounded - value) < threshold ? rounded : value;
  }

  generateBeatTable(subdivision: number): number[] {
    let beatIndex = 1;
    const beatGrid = [];

    const beatSource = this.beats !== this.poly ? this.poly : this.beats;
    const totalSteps = Math.round(beatSource / subdivision);

    while (beatIndex <= totalSteps) {
      let beat: number;
      if (beatGrid.length === 0) {
        beat = beatIndex;
      } else {
        beat = beatGrid[beatGrid.length - 1];
        beat = this.cleanFloat((beat += subdivision));
      }

      beatGrid.push(beat);
      beatIndex++;
    }

    return beatGrid;
  }

  private trackBeat(): void {
    const beatSource = this.beats !== this.poly ? this.poly : this.beats;
    const totalSteps = Math.round(beatSource / this.subdivision);

    if (this.pendingSubdivision) {
      const beatTable = this.generateBeatTable(this.pendingSubdivision);
      const nextBeatData = this.getNextValidBeat(beatTable);

      this.step = nextBeatData.step;
      this.subdivision = this.pendingSubdivision;
      this.beatTrack = nextBeatData.beat;

      if (!this.isPolyrhythm) {
        this.pendingSubdivision = null;
      }
      return;
    }

    this.step = (this.step + 1) % totalSteps;
    this.beatTrack = this.cleanFloat(this.step * this.subdivision + 1);
  }

  private get isBeatOne(): boolean {
    return this.beatTrack === 1;
  }

  private get currentBeat(): number {
    return Math.round((this.beatTrack - 1) / this.subdivision) + 1;
  }

  init(currentTime: number): void {
    this.nextNote = currentTime;
    this.killed = false;
    this.step = 0;
    this.beatTrack = 1;
  }

  private beatSource(): number {
    return this.beats !== this.poly ? this.poly : this.beats;
  }

  advance(targetBpm: number, currentTime: number): void {
    const secondsPerBeat = 60 / targetBpm;
    const rhythmBeatScale = this.beats / this.poly;

    if (this.pendingSubdivision) {
      const toTpb = this.toTicksPerBeat(this.pendingSubdivision);

      const phi = this.beatTrack - 1;

      const k = Math.ceil(phi * toTpb);

      const totalStepsNew = this.beatSource() * toTpb;
      this.step = k % totalStepsNew;
      this.subdivision = this.pendingSubdivision;
      this.beatTrack = this.cleanFloat(k / toTpb + 1);
      this.pendingSubdivision = null;

      const deltaBeats = k / toTpb - phi;
      const deltaTime = deltaBeats * secondsPerBeat * rhythmBeatScale;

      const anchor = Math.max(currentTime, this.nextNote);
      this.nextNote = anchor + deltaTime;
    }

    const tpb = this.toTicksPerBeat(this.subdivision);
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

  setBeatPosition(beat: number) {
    const beatSource = this.beats !== this.poly ? this.poly : this.beats;
    const totalSteps = Math.round(beatSource / this.subdivision);

    const step = Math.round((beat - 1) / this.subdivision) % totalSteps;

    this.step = step;
    this.beatTrack = this.cleanFloat(step * this.subdivision + 1);
  }

  applyTempoChange(oldBpm: number, newBpm: number, currentTime: number): void {
    if (this.nextNote <= currentTime) return;

    const oldSecondsPerBeat = 60 / oldBpm;
    const newSecondsPerBeat = 60 / newBpm;

    const rhythmBeatScale = this.beats / this.poly;
    const tpb = this.toTicksPerBeat(this.subdivision);

    const oldTickSeconds = (oldSecondsPerBeat * rhythmBeatScale) / tpb;
    const newTickSeconds = (newSecondsPerBeat * rhythmBeatScale) / tpb;

    const remainingOld = this.nextNote - currentTime;
    const fractionRemaining = remainingOld / oldTickSeconds;

    const remainingNew = fractionRemaining * newTickSeconds;

    this.nextNote = currentTime + remainingNew;
  }

  play(): void {
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
        this.emit('updatedBeats', this.poly);
      } else {
        this.emit('updatedBeats', this.beats);
      }
    }

    if (pendingPolyBeat) {
      this.poly = pendingPolyBeat;
      this.emit('updatedBeats', this.poly);
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

  updateSounds(sounds: Sound[]): void {
    this.sounds = sounds;
  }

  resetState(state: BeatState[]): void {
    this.state = state;
  }

  setSubdivision(subdivision: number): void {
    this.pendingSubdivision = subdivision;
  }

  updateFrequency(frequency: number): void {
    this.sound.updateFrequency(frequency);
  }

  updateFrequencyData(data: FrequencyData): void {
    this.sound.updateFrequencyData(data);
  }
}
