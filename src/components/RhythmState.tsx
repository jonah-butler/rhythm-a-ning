import { useEffect, useRef, useState } from 'react';
import '../css/RhythmState.css';
import { Sound } from '../timing_engine/oscillator.types';
import type { BeatState } from '../timing_engine/rhythm.types';
import { type DropdownOptions } from './Dropdown';
import SoundMenu from './Menus/SoundMenu';

type RhythmStateProps = {
  beats: DropdownOptions;
  disabled: boolean;
  size?: 'sm' | 'md' | 'lg';
  sounds?: Sound[];
  state?: BeatState[];
  onUpdate: (state: BeatState[]) => void;
  onSoundChange?: (sound: Sound, index: number) => void;
};

export default function RhythmState({
  beats,
  disabled = false,
  size = 'lg',
  sounds,
  state,
  onUpdate,
  onSoundChange,
}: RhythmStateProps) {
  const beatsParsed = Number(beats.value);

  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openMenuIndex === null) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openMenuIndex]);

  function chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  const toggleMenu = (flatIndex: number) => {
    setOpenMenuIndex((prev) => (prev === flatIndex ? null : flatIndex));
  };

  const updateState = (row: number, noteIndex: number) => {
    if (disabled) return;

    const notesPerBeat = state!.length / beatsParsed;
    const index = row * notesPerBeat + noteIndex;

    const next = state!.map((v, i) => (i === index ? (v === 1 ? 0 : 1) : v));

    // setBeatState(next);
    onUpdate(next);
  };

  function renderBeatRows() {
    const notesPerBeat = state!.length / beatsParsed;
    const rows = chunk(state!, notesPerBeat);

    return rows.map((row, beatIndex) => (
      <div key={beatIndex} className={`beat-row ${size}`}>
        {row.map((value, noteIndex) => {
          const flatIndex = beatIndex * notesPerBeat + noteIndex;
          return (
            <div key={noteIndex} className="beat-note">
              <span
                onClick={() => updateState(beatIndex, noteIndex)}
                className={[
                  'beat',
                  noteIndex !== 0 && 'subdivided',
                  value === 1 && 'active',
                  disabled ? 'disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
              {sounds && onSoundChange && (
                <>
                  <button
                    className="sound-menu-trigger"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(flatIndex);
                    }}
                  />
                  <SoundMenu
                    isOpen={openMenuIndex === flatIndex}
                    activeSound={sounds[flatIndex]}
                    onKeepOpen={() => {}}
                    onRequestClose={() => {}}
                    onClick={(sound) => {
                      onSoundChange(sound, flatIndex);
                      setOpenMenuIndex(null);
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    ));
  }

  return (
    <div ref={containerRef} className="rhythm-state">
      {renderBeatRows()}
    </div>
  );
}
