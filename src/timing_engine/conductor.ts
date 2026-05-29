import type { RhythmBlock } from '../context/BuilderContext.types';
import { Emitter } from '../services/emit';
import { getBeatSoundState, getSubdivision } from '../services/rhythm.services';
import type {
  CondcutorEvents,
  ConductorParams,
  WorkflowEmit,
} from './conductor.types';
import { Oscillator } from './oscillator';
import { PlayerType, Sound } from './oscillator.types';
import { Rhythm } from './rhythm';

// complete
export interface IConductor {
  on(event: 'workflowBlock', listener: (data: WorkflowEmit) => void): this;
}

export class Conductor extends Emitter<CondcutorEvents> {
  static LOOK_AHEAD = 0.1;

  isRunning = false;
  private rhythms: Rhythm[] = [];
  private measures = 0;
  private currentBlock = 0;

  audioCtx: AudioContext;
  bpm: number;
  workflow: RhythmBlock[] | undefined;

  constructor({ audioCtx, bpm, workflow }: ConductorParams) {
    super();
    this.audioCtx = audioCtx;
    this.bpm = bpm;
    this.workflow = workflow;
  }

  private get currentTime(): number {
    return this.audioCtx.currentTime;
  }

  private get useWorkflow(): boolean {
    return this.workflow !== undefined && this.workflow.length > 0;
  }

  get numberOfRhythms(): number {
    return this.rhythms.length;
  }

  private cleanFloat(value: number, threshold = 1e-12): number {
    const rounded = Math.round(value);
    return Math.abs(rounded - value) < threshold ? rounded : value;
  }

  private schedule(): void {
    if (!this.isRunning) return;

    for (const rhythm of this.rhythms) {
      while (rhythm.nextNote < this.currentTime + Conductor.LOOK_AHEAD) {
        rhythm.play();
        rhythm.advance(this.bpm, this.currentTime);
      }
    }

    if (this.isRunning) {
      requestAnimationFrame(() => this.schedule());
    }
  }

  getNextBlock(): RhythmBlock | null {
    if (!this.workflow) return null;
    if (this.currentBlock === this.workflow.length - 1) {
      return this.workflow[0];
    }
    return this.workflow[this.currentBlock + 1];
  }

  initialize(): void {
    if (this.workflow && this.workflow.length) {
      const block = this.workflow[0];
      console.log(block);

      const osc1 = new Oscillator({
        audioCtx: this.audioCtx,
        frequency: 750,
        beatOneOffset: 3,
        subdividedOffset: -3,
        gain: 0.5,
        type: PlayerType.Sound,
        sound: Sound.Kick,
      });

      const osc2 = new Oscillator({
        audioCtx: this.audioCtx,
        frequency: 550,
        beatOneOffset: 3,
        subdividedOffset: -3,
        gain: 0.5,
        type: PlayerType.Sound,
        sound: Sound.Kick,
      });

      const r1 = new Rhythm({
        subdivision: getSubdivision(block.subdivision.value),
        beats: Number(block.beats.value),
        state: block.state,
        sound: osc1,
        sounds: block.beatSounds,
      });

      r1.on('scheduled', (beat: number) => {
        if (beat === 1) {
          this.measures += 1;
        }

        if (!this.workflow) return;

        const workflow = this.workflow[this.currentBlock];

        if (this.measures === workflow.measures) {
          const block = this.getNextBlock();
          if (block?.beats.value !== workflow.beats.value) {
            this.updateBeats(Number(block?.beats.value), null);
          }
        }

        if (this.measures > workflow.measures) {
          const nextBlock =
            this.currentBlock === this.workflow.length - 1
              ? 0
              : this.currentBlock + 1;
          this.currentBlock = nextBlock;

          this.measures = 1;

          this.currentBlock = nextBlock;

          const newWorkflow = this.workflow[this.currentBlock];

          this.emit('workflowBlock', {
            id: newWorkflow.id,
            index: this.currentBlock,
            bpm: Number(newWorkflow.bpm),
            measures: newWorkflow.measures,
            beats: Number(newWorkflow.beats.value),
          } as WorkflowEmit);

          this.bpm = newWorkflow.bpm;

          const r1 = this.getRhythm(0);
          r1.resetState(newWorkflow.state);
          r1.setSubdivision(getSubdivision(newWorkflow.subdivision.value));
          if (newWorkflow.usePoly) {
            if (this.numberOfRhythms !== 2) {
              const r2 = new Rhythm({
                subdivision: getSubdivision(newWorkflow.polySubdivision.value),
                beats: Number(newWorkflow.beats.value),
                state: newWorkflow.polyState,
                sound: osc2,
                poly: Number(newWorkflow.polyBeats.value),
                sounds: getBeatSoundState(
                  newWorkflow.polyState.length,
                  [],
                  Sound.Oscillator,
                ),
              });

              this.addRhythm(r2);
            } else {
              const polyRhythm = this.getRhythm(1);

              polyRhythm.updateBeats(
                Number(newWorkflow.beats.value),
                Number(newWorkflow.polyBeats.value),
                true,
              );
              polyRhythm.resetState(newWorkflow.polyState);
              polyRhythm.setSubdivision(
                getSubdivision(newWorkflow.polySubdivision.value),
              );
            }
          } else {
            if (this.numberOfRhythms === 2) {
              this.removeRhythm(1);
            }
          }
        }
      });

      this.addRhythm(r1);

      if (block.usePoly) {
        const r2 = new Rhythm({
          subdivision: getSubdivision(block.polySubdivision.value),
          beats: Number(block.beats.value),
          state: block.polyState,
          sound: osc2,
          poly: Number(block.polyBeats.value),
          sounds: getBeatSoundState(
            block.polyState.length,
            [],
            Sound.Oscillator,
          ),
        });

        this.addRhythm(r2);
      }
    }
  }

  generateSubdivisionTable(r1: Rhythm, r2: Rhythm): number[] | undefined {
    const beatSpacing = this.cleanFloat(r1.beats / r2.poly);
    const subSpacing = this.cleanFloat(beatSpacing * r2.subdivision);
    const totalSteps = Math.round(r2.poly / r2.subdivision);

    const beatPositionGrid: number[] = [];
    for (let i = 0; i < totalSteps; i++) {
      beatPositionGrid.push(this.cleanFloat(1 + i * subSpacing));
    }

    return beatPositionGrid;
  }

  addRhythm(rhythm: Rhythm): void {
    const hasRhythm = this.rhythms.length === 1;
    rhythm.nextNote = 0;

    if (hasRhythm) {
      const anchor = this.rhythms[0];
      const currentBeat = anchor.beatTrack;
      const beatTable = this.generateSubdivisionTable(anchor, rhythm);
      if (!beatTable) return;

      let nextBeat = beatTable[0];
      let step = 0;

      const EPS = 1e-6;
      for (let i = 0; i < beatTable.length; i++) {
        if (beatTable[i] + EPS >= currentBeat) {
          nextBeat = beatTable[i];
          step = i;
          break;
        }
      }

      const spb = 60 / this.bpm;

      let deltaBeats = nextBeat - currentBeat;
      if (deltaBeats < 0) deltaBeats += rhythm.beats;

      const deltaSeconds = deltaBeats * spb;

      rhythm.nextNote = anchor.nextNote + deltaSeconds;

      const now = this.currentTime;
      const MIN_LEAD = 0.003; // 3ms (tweak up to 0.01 if needed)
      if (rhythm.nextNote < now + MIN_LEAD) {
        rhythm.nextNote = now + MIN_LEAD;
      }

      rhythm.step = step;
      rhythm.beatTrack = rhythm.cleanFloat(step * rhythm.subdivision + 1);

      rhythm.killed = false;
    } else {
      rhythm.init(this.currentTime);
    }

    this.rhythms = [...this.rhythms, rhythm];
  }

  updateBeats(
    updatedBeatCount: number | null,
    updatedPolyBeatCount: number | null,
  ): void {
    for (const rhythm of this.rhythms) {
      rhythm.updateBeats(
        updatedBeatCount,
        updatedPolyBeatCount,
        this.isRunning,
      );
    }
  }

  removeRhythms(): void {
    if (this.isRunning) {
      this.stop();
    }

    for (const rhythm of this.rhythms) {
      rhythm.removeAllListeners();
    }
    this.rhythms = [];
  }

  updateSounds(sounds: Sound[], index: number): void {
    if (this.rhythms[index]) {
      this.rhythms[index].sounds = sounds;
    }
  }

  removeRhythm(index: number) {
    if (this.rhythms[index]) {
      this.rhythms = [
        ...this.rhythms.slice(0, index),
        ...this.rhythms.slice(index + 1),
      ];
    }
  }

  async start(): Promise<boolean> {
    try {
      await this.audioCtx.resume();
    } catch (err) {
      console.log(this.audioCtx, err);
    }
    // await this.audioElement.play();

    for (const rhythm of this.rhythms) {
      rhythm.init(this.currentTime);
    }

    if (this.useWorkflow) {
      this.currentBlock = 0;
      if (this.workflow) {
        const workflow = this.workflow[this.currentBlock];

        this.emit('workflowBlock', {
          id: workflow.id,
          index: this.currentBlock,
          bpm: Number(workflow.bpm),
          measures: workflow.measures,
          beats: Number(workflow.beats.value),
        } as WorkflowEmit);
      }
    }

    this.isRunning = true;
    this.schedule();

    this.emit('isRunning', this.isRunning);
    return this.isRunning;
  }

  stop(): boolean {
    this.isRunning = false;
    for (const rhythm of this.rhythms) {
      rhythm.kill();
    }

    this.emit('isRunning', this.isRunning);
    return this.isRunning;
  }

  updateBPM(bpm: number): void {
    const oldBpm = this.bpm;
    this.bpm = bpm;

    const now = this.currentTime;

    for (const rhythm of this.rhythms) {
      rhythm.applyTempoChange(oldBpm, bpm, now);
    }

    this.emit('updateBPM', this.bpm);
  }

  getRhythm(index: number): Rhythm {
    return this.rhythms[index];
  }
}
