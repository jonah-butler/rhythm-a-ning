import { type ReactNode } from 'react';
import '../css/Display.css';
import { Sound } from '../timing_engine/oscillator.types';
import type { BeatState } from '../timing_engine/rhythm.types';
import BPMGrid from './BPM-Grid';
import BPMSpinner from './BPM-Spinner';
import MetronomeClockArm from './Metronome-Clock-Arm';

interface DisplayProps {
  isRunning: boolean;
  bpm: number;
  beats: number;
  currentBeat: number;
  polyBeat: number;
  polyrhythm: number;
  usePoly: boolean;
  subdivision: number;
  polySubdivision: number;
  totalBeats: BeatState[];
  totalPolyBeats: BeatState[];
  subdivisionIcon: ReactNode;
  polySubdivisionIcon: ReactNode;
  beatCountGhost: number | null;
  polyBeatCountGhost: number | null;
  beatSounds: Sound[][];
  polyBeatSounds: Sound[][];
  updateBPM: (value: number) => void;
  togglePlayback: () => void;
  handleBeatClick: (i: number) => void;
  handleSoundSelection: (sound: Sound, index: number) => void;
  handlePolySoundSelection: (sound: Sound, index: number) => void;
  handlePolyBeatClick: (i: number) => void;
}

function Display({
  isRunning,
  bpm,
  beats,
  currentBeat,
  polyBeat,
  polyrhythm,
  usePoly,
  togglePlayback,
  updateBPM,
  subdivision,
  polySubdivision,
  handleBeatClick,
  handlePolyBeatClick,
  totalBeats,
  totalPolyBeats,
  subdivisionIcon,
  polySubdivisionIcon,
  beatCountGhost,
  polyBeatCountGhost,
  beatSounds,
  polyBeatSounds,
  handleSoundSelection,
  handlePolySoundSelection,
}: DisplayProps) {
  return (
    <div className="metronome">
      <section className="metronome__inner-container">
        {/* Large Outer BPM Grid */}
        <BPMGrid
          beats={beats}
          currentBeat={currentBeat}
          subdivision={subdivision}
          totalBeats={totalBeats}
          handleBeatClick={(i: number) => handleBeatClick(i)}
          beatCountGhost={beatCountGhost}
          beatSounds={beatSounds}
          handleSoundSelection={handleSoundSelection}
        />

        {/*  BPM Rotary Dial | Play/Pause | BPM Tap */}
        <BPMSpinner
          togglePlayback={togglePlayback}
          updateBPM={updateBPM}
          isRunning={isRunning}
          bpm={bpm}
          usePolyrhythm={usePoly}
          subdivisionIcon={subdivisionIcon}
          polySubdivisionIcon={polySubdivisionIcon}
        />

        {/* Small Inner BPM Grid */}
        {usePoly && (
          <BPMGrid
            beats={polyrhythm}
            currentBeat={polyBeat}
            smallVersion={true}
            subdivision={polySubdivision}
            totalBeats={totalPolyBeats}
            beatCountGhost={polyBeatCountGhost}
            beatSounds={polyBeatSounds}
            handleBeatClick={(i: number) => handlePolyBeatClick(i)}
            handleSoundSelection={handlePolySoundSelection}
          />
        )}

        {/* Rotating Clock Arm */}
        <MetronomeClockArm
          isRunning={isRunning}
          bpm={bpm}
          beats={beats}
          currentBeat={currentBeat}
        />
      </section>
    </div>
  );
}

export default Display;
