import '../css/Display.css';
import type { SubdivisionName } from '../services/subdivision/types';
import { baseBeatStore, polyBeatStore } from '../timing_engine/beatStore';
import { Sound } from '../timing_engine/oscillator.types';
import type { BeatState } from '../timing_engine/rhythm.types';
import BPMGrid from './BPM-Grid';
import BPMSpinner from './BPM-Spinner';
import MetronomeClockArm from './Metronome-Clock-Arm';

interface DisplayProps {
  isRunning: boolean;
  bpm: number;
  beats: number;
  polyrhythm: number;
  usePoly: boolean;
  totalBeats: BeatState[];
  totalPolyBeats: BeatState[];
  beatCountGhost: number | null;
  polyBeatCountGhost: number | null;
  beatSounds: Sound[][];
  polyBeatSounds: Sound[][];
  subdivisions: number[];
  polySubdivisions: number[];
  updateBPM: (value: number) => void;
  togglePlayback: () => void;
  handleBeatClick: (i: number) => void;
  handleSoundSelection: (sound: Sound, index: number) => void;
  handlePolySoundSelection: (sound: Sound, index: number) => void;
  handlePolyBeatClick: (i: number) => void;
  handleSubdivisionUpdate: (subdivision: SubdivisionName, beat: number) => void;
  handlePolySubdivisionUpdate: (
    subdivision: SubdivisionName,
    beat: number,
  ) => void;
}

function Display({
  isRunning,
  bpm,
  beats,
  polyrhythm,
  usePoly,
  togglePlayback,
  updateBPM,
  handleBeatClick,
  handlePolyBeatClick,
  totalBeats,
  totalPolyBeats,
  beatCountGhost,
  polyBeatCountGhost,
  beatSounds,
  polyBeatSounds,
  handleSoundSelection,
  handlePolySoundSelection,
  subdivisions,
  handleSubdivisionUpdate,
  handlePolySubdivisionUpdate,
  polySubdivisions,
}: DisplayProps) {
  return (
    <div className="metronome">
      <section className="metronome__inner-container">
        {/* Large Outer BPM Grid */}
        <BPMGrid
          beats={beats}
          beatStore={baseBeatStore}
          subdivisions={subdivisions}
          totalBeats={totalBeats}
          handleBeatClick={(i: number) => handleBeatClick(i)}
          beatCountGhost={beatCountGhost}
          beatSounds={beatSounds}
          handleSoundSelection={handleSoundSelection}
          handleSubdivisionUpdate={handleSubdivisionUpdate}
        />

        {/*  BPM Rotary Dial | Play/Pause | BPM Tap */}
        <BPMSpinner
          togglePlayback={togglePlayback}
          updateBPM={updateBPM}
          isRunning={isRunning}
          bpm={bpm}
          usePolyrhythm={usePoly}
        />

        {/* Small Inner BPM Grid */}
        {usePoly && (
          <BPMGrid
            beats={polyrhythm}
            beatStore={polyBeatStore}
            smallVersion={true}
            totalBeats={totalPolyBeats}
            beatCountGhost={polyBeatCountGhost}
            beatSounds={polyBeatSounds}
            subdivisions={polySubdivisions}
            handleBeatClick={(i: number) => handlePolyBeatClick(i)}
            handleSoundSelection={handlePolySoundSelection}
            handleSubdivisionUpdate={handlePolySubdivisionUpdate}
          />
        )}

        {/* Rotating Clock Arm */}
        <MetronomeClockArm isRunning={isRunning} bpm={bpm} beats={beats} />
      </section>
    </div>
  );
}

export default Display;
