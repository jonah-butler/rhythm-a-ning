import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { beatCountData, subdivisionData } from '../data';
import { parseMetronomeQueryParams } from '../helpers/metronome.helpers';
import { generateUUID } from '../services/rhythm.services';
import { Sound } from '../timing_engine/oscillator.types';
import { Subdivisions } from '../timing_engine/types';
import { DefaultSection, type RhythmBlock } from './BuilderContext.types';
import { MetronomeBuilderContext } from './MetronomeContext';

function buildInitialRhythm(search: string): RhythmBlock {
  const parsedDefaults = parseMetronomeQueryParams(search);

  const beats = parsedDefaults.baseCount
    ? beatCountData[parsedDefaults.baseCount]
    : beatCountData[3];

  console.log(beats);

  const subdivision = parsedDefaults.baseSubdivion
    ? subdivisionData[parsedDefaults.baseSubdivion]
    : subdivisionData[0];

  const state = parsedDefaults.beatState
    ? parsedDefaults.beatState
    : (new Array(
        parseInt(beats.value) /
          Subdivisions[subdivision.value as keyof typeof Subdivisions],
      ).fill(1) as RhythmBlock['state']);

  const sounds = parsedDefaults.beatSounds
    ? parsedDefaults.beatSounds
    : (new Array(state.length).fill([
        Sound.Oscillator,
      ]) as RhythmBlock['sounds']);

  const polyBeats = parsedDefaults.polyCount
    ? beatCountData[parsedDefaults.polyCount]
    : beatCountData[2];

  const polySubdivision = parsedDefaults.polySubdivision
    ? subdivisionData[parsedDefaults.polySubdivision]
    : subdivisionData[0];

  const polyState = parsedDefaults.polyBeatState
    ? parsedDefaults.polyBeatState
    : (new Array(
        parseInt(polyBeats.value) /
          Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
      ).fill(1) as RhythmBlock['polyState']);

  const polySounds = parsedDefaults.polyBeatSound
    ? parsedDefaults.polyBeatSound
    : (new Array(polyState.length).fill([
        Sound.HiHat,
      ]) as RhythmBlock['polySounds']);

  return {
    id: generateUUID(),
    bpm: parsedDefaults.bpm ? parsedDefaults.bpm : 60,
    measures: 1,
    subdivision,
    beats,
    usePoly: parsedDefaults.usePoly ? parsedDefaults.usePoly : false,
    state,
    sounds,
    polyBeats,
    polySubdivision,
    polyState,
    polySounds,
    section: DefaultSection,
    name: '',
  };
}

export function MetronomeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [rhythm, setRhythmState] = useState<RhythmBlock>(() =>
    buildInitialRhythm(location.search),
  );

  console.log('rhythm:', rhythm);

  const setRhythm = useCallback((next: RhythmBlock) => {
    setRhythmState(next);
  }, []);

  const updateRhythm = useCallback((patch: Partial<RhythmBlock>) => {
    setRhythmState((prev) => ({ ...prev, ...patch }));
  }, []);

  const isSavedRhythm = useCallback(() => rhythm.id === '', [rhythm.id]);

  const value = useMemo(
    () => ({ rhythm, setRhythm, updateRhythm, isSavedRhythm }),
    [rhythm, setRhythm, updateRhythm, isSavedRhythm],
  );

  return (
    <MetronomeBuilderContext.Provider value={value}>
      {children}
    </MetronomeBuilderContext.Provider>
  );
}
