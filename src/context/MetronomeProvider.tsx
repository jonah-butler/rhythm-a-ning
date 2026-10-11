import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { beatCountData } from '../data';
import { parseMetronomeQueryParams } from '../helpers/metronome.helpers';
import { rhythmFingerprint } from '../services/rhythm.services';
import {
  buildDefaultBeatState,
  resolveSubdivisions,
} from '../services/subdivision';
import { Sound } from '../timing_engine/oscillator.types';
import { MetronomeBuilderContext } from './MetronomeContext';
import { type RhythmSlim } from './MetronomeContext.types';

function buildInitialRhythm(search: string): RhythmSlim {
  const parsedDefaults = parseMetronomeQueryParams(search);

  const beats = parsedDefaults.baseCount
    ? beatCountData[parsedDefaults.baseCount]
    : beatCountData[3];

  const subdivisions = resolveSubdivisions(
    parsedDefaults.baseSubdivisions,
    null,
    parseInt(beats.value),
  );

  const state = parsedDefaults.beatState
    ? parsedDefaults.beatState
    : buildDefaultBeatState(subdivisions);

  const sounds = parsedDefaults.beatSounds
    ? parsedDefaults.beatSounds
    : (new Array(state.length).fill([
        Sound.Oscillator,
      ]) as RhythmSlim['sounds']);

  const polyBeats = parsedDefaults.polyCount
    ? beatCountData[parsedDefaults.polyCount]
    : beatCountData[2];

  const polySubdivisions = resolveSubdivisions(
    parsedDefaults.polySubdivisions,
    null,
    parseInt(polyBeats.value),
  );

  const polyState = parsedDefaults.polyBeatState
    ? parsedDefaults.polyBeatState
    : buildDefaultBeatState(polySubdivisions);

  const polySounds = parsedDefaults.polyBeatSound
    ? parsedDefaults.polyBeatSound
    : (new Array(polyState.length).fill([
        Sound.HiHat,
      ]) as RhythmSlim['polySounds']);

  return {
    id: '',
    bpm: parsedDefaults.bpm ? parsedDefaults.bpm : 60,
    measures: 1,
    subdivisions,
    beats,
    usePoly: parsedDefaults.usePoly ? parsedDefaults.usePoly : false,
    state,
    sounds,
    polyBeats,
    polySubdivisions,
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
