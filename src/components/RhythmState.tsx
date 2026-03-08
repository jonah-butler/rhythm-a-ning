import { useEffect, useState } from 'react';
import '../css/RhythmState.css';
import { getBeatState } from '../services/rhythm.services';
import type { BeatState } from '../timing_engine/rhythm.types';
import { type DropdownOptions } from './Dropdown';

type RhythmStateProps = {
  beats: DropdownOptions;
  subdivision: DropdownOptions;
  disabled: boolean;
  onUpdate: (state: BeatState[]) => void;
};

export default function RhythmState({
  beats,
  subdivision,
  disabled = false,
  onUpdate,
}: RhythmStateProps) {
  const beatsParsed = Number(beats.value);
  const subdivisionParsed = subdivision.value;

  const [beatState, setBeatState] = useState<BeatState[]>(() =>
    getBeatState(beatsParsed, subdivisionParsed),
  );

  useEffect(() => {
    setBeatState(getBeatState(beatsParsed, subdivisionParsed));
  }, [beatsParsed, subdivisionParsed]);

  function chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  const updateState = (row: number, noteIndex: number) => {
    if (disabled) return;

    const notesPerBeat = beatState.length / beatsParsed;
    const index = row * notesPerBeat + noteIndex;

    const next = beatState.map((v, i) => (i === index ? (v === 1 ? 0 : 1) : v));

    setBeatState(next);

    onUpdate(next);
  };

  function renderBeatRows() {
    const notesPerBeat = beatState.length / beatsParsed;
    const rows = chunk(beatState, notesPerBeat);

    return rows.map((row, beatIndex) => (
      <div key={beatIndex} className="beat-row">
        {row.map((value, noteIndex) => (
          <span
            key={noteIndex}
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
        ))}
      </div>
    ));
  }

  return <>{renderBeatRows()}</>;
}
