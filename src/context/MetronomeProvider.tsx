import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { beatCountData, subdivisionData } from '../data';
import { parseMetronomeQueryParams } from '../helpers/metronome.helpers';
import { rhythmFingerprint } from '../services/rhythm.services';
import { Sound } from '../timing_engine/oscillator.types';
import { Subdivisions } from '../timing_engine/types';
import { MetronomeBuilderContext } from './MetronomeContext';
import { type RhythmSlim } from './MetronomeContext.types';

function buildInitialRhythm(search: string): RhythmSlim {
  const parsedDefaults = parseMetronomeQueryParams(search);

  const beats = parsedDefaults.baseCount
    ? beatCountData[parsedDefaults.baseCount]
    : beatCountData[3];

  const subdivision = parsedDefaults.baseSubdivion
    ? subdivisionData[parsedDefaults.baseSubdivion]
    : subdivisionData[0];

  const state = parsedDefaults.beatState
    ? parsedDefaults.beatState
    : (new Array(
        parseInt(beats.value) /
          Subdivisions[subdivision.value as keyof typeof Subdivisions],
      ).fill(1) as RhythmSlim['state']);

  const sounds = parsedDefaults.beatSounds
    ? parsedDefaults.beatSounds
    : (new Array(state.length).fill([
        Sound.Oscillator,
      ]) as RhythmSlim['sounds']);

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
      ).fill(1) as RhythmSlim['polyState']);

  const polySounds = parsedDefaults.polyBeatSound
    ? parsedDefaults.polyBeatSound
    : (new Array(polyState.length).fill([
        Sound.HiHat,
      ]) as RhythmSlim['polySounds']);

  return {
    id: '',
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
    name: '',
    createdAt: null,
    updatedAt: null,
  };
}

export function MetronomeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [rhythm, setRhythmState] = useState<RhythmSlim>(() =>
    buildInitialRhythm(location.search),
  );
  // the baseline the current rhythm is compared against. state rather than a
  // ref so that flipping back to clean actually re-renders the consumers
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    rhythmFingerprint(rhythm),
  );
  const fingerprint = useMemo(() => rhythmFingerprint(rhythm), [rhythm]);
  const settingsChanged = fingerprint !== savedFingerprint;

  // a counter rather than the rhythm id: loading the same rhythm twice, or
  // reloading one the user has since edited, still has to re-apply
  const [loadToken, setLoadToken] = useState(0);

  const setRhythm = useCallback((next: RhythmSlim) => {
    setRhythmState(next);
    // a freshly loaded rhythm is clean by definition
    setSavedFingerprint(rhythmFingerprint(next));
    setLoadToken((token) => token + 1);
  }, []);

  const updateRhythm = useCallback((patch: Partial<RhythmSlim>) => {
    setRhythmState((prev) => ({ ...prev, ...patch }));
  }, []);

  /**
   * Re-baselines after a successful save. Closes over the fingerprint from the
   * render that queued the save, which is exactly the state that was sent.
   */
  const markRhythmSaved = useCallback(() => {
    setSavedFingerprint(fingerprint);
  }, [fingerprint]);

  const generateDefaultMetronome = useCallback(
    () => buildInitialRhythm(''),
    [],
  );

  const isSavedRhythm = useCallback(() => rhythm.id !== '', [rhythm.id]);

  const value = useMemo(
    () => ({
      rhythm,
      loadToken,
      settingsChanged,
      setRhythm,
      updateRhythm,
      markRhythmSaved,
      isSavedRhythm,
      generateDefaultMetronome,
    }),
    [
      rhythm,
      loadToken,
      settingsChanged,
      setRhythm,
      updateRhythm,
      markRhythmSaved,
      isSavedRhythm,
      generateDefaultMetronome,
    ],
  );

  return (
    <MetronomeBuilderContext.Provider value={value}>
      {children}
    </MetronomeBuilderContext.Provider>
  );
}
