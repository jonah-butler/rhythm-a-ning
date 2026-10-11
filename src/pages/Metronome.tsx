import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import '../App.css';
import GridIcon from '../assets/icons/grid.svg?react';
import ShareIcon from '../assets/icons/share.svg?react';
import SoundWaveIcon from '../assets/icons/soundwave.svg?react';
import Display from '../components/Display';
import Dropdown, { type DropdownOptions } from '../components/Dropdown';
import RhythmState from '../components/RhythmState';
import Slider from '../components/Slider';
import { Tabs } from '../components/Tabs/Tabs';
import Toggle from '../components/Toggle';
import { useMetronomeBuilderContext } from '../context/useMetronomeContext';
import { beatCountData } from '../data';
import { isMobileUserAgent } from '../helpers/metronome.helpers';
import {
  buildBeatState,
  getBeatCount,
  getBeatSoundState,
} from '../services/rhythm.services';
import { loadSounds } from '../services/sound.services';
import {
  buildSubdivision,
  calculateTotalBeats,
  getSubdivision,
  getSubdivisionName,
} from '../services/subdivision';
import {
  subdivisionData,
  subdivisionDataWithEmpty,
} from '../services/subdivision/data';
import {
  SubdivisionKeyValue,
  type SubdivisionDropdownOptionsWithEmpty,
  type SubdivisionName,
} from '../services/subdivision/types';
import { releaseWakeLock, requestWakeLock } from '../services/wakelock';
import { baseBeatStore, polyBeatStore } from '../timing_engine/beatStore';
import { Conductor } from '../timing_engine/conductor';
import { SoundPlayer } from '../timing_engine/oscillator';
import { PlayerType, Sound } from '../timing_engine/oscillator.types';
import { Rhythm } from '../timing_engine/rhythm';
import {
  type BeatState,
  type BeatUpdatePayload,
} from '../timing_engine/rhythm.types';
import { Subdivisions } from '../timing_engine/types';

export default function Metronome() {
  /**
   * ++++++++++++++++++++++++
   * Rhythm Block Context
   * (shared with MetronomeHeader)
   * ++++++++++++++++++++++++
   */
  const { rhythm, loadToken, updateRhythm } = useMetronomeBuilderContext();
  const {
    bpm,
    subdivision,
    beats: beatCount,
    state: totalBeats,
    sounds,
    usePoly: usePolyrhythm,
    polyBeats: polyBeatCount,
    polySubdivision,
    polyState: totalPolyBeats,
    polySounds,
    subNew,
    polySubNew,
  } = rhythm;

  /**
   * +++++++++++++++++++
   * Metronome Defaults
   * +++++++++++++++++++
   */
  const defaultFrequency = 750;

  /**
   * ++++++++++++++++++++
   * Conductor Reference
   * ++++++++++++++++++++
   */
  const conductor = useRef<Conductor | null>(null);

  /**
   * +++++++++++++++++
   * Conductor State
   * +++++++++++++++++
   */
  const [isRunning, setIsRunning] = useState(false);

  /**
   * +++++++++++++++++
   * Metronome State
   * +++++++++++++++++
   */
  const [frequencyData, setFrequencyData] = useState({
    frequency: defaultFrequency,
    beatOneOffset: 3,
    subdividedOffset: -3,
    gain: 0.5,
  });

  const beatCountRef = useRef(beatCount);
  const subdivisionRef = useRef(subdivision);

  //beat state
  const totalBeatsRef = useRef<BeatState[]>(totalBeats);

  //beat sound state
  const soundsRef = useRef(sounds);

  /**
   * +++++++++++++++++
   * Polyrhythm State
   * +++++++++++++++++
   */
  const [polyFrequencyData, setPolyFrequencyData] = useState({
    frequency: 550,
    beatOneOffset: 3,
    subdividedOffset: -3,
    gain: 0.5,
  });
  const polySubdivisionRef = useRef(polySubdivision);

  const totalPolyBeatsRef = useRef<BeatState[]>(totalPolyBeats);

  //beat sound state
  const polySoundsRef = useRef(polySounds);
  /**
   * ++++++++++
   * App State
   * ++++++++++
   */
  const [selectedSetting, setSelectedSetting] = useState('metronome');
  const [tab, setTab] = useState(0);
  const [primaryBeatState, setPrimaryBeatState] = useState(false);
  const [polyBeatState, setPolyBeatState] = useState(false);

  const subdivisionOptions = useMemo(() => {
    const options: DropdownOptions[] = [];
    options.push({ label: 'all', value: 'all' });
    for (let i = 1; i <= parseInt(beatCount.value); i++) {
      options.push({
        label: `${i}`,
        value: `${i}`,
      });
    }

    return options;
  }, [beatCount]);

  const polySubdivisionOptions = useMemo(() => {
    const options: DropdownOptions[] = [];
    options.push({ label: 'all', value: 'all' });
    for (let i = 1; i <= parseInt(polyBeatCount.value); i++) {
      options.push({
        label: `${i}`,
        value: `${i}`,
      });
    }

    return options;
  }, [polyBeatCount]);

  const [selectedBeat, setSelectedBeat] = useState(subdivisionOptions[1]);
  const [polySelectedBeat, setPolySelectedBeat] = useState(
    subdivisionOptions[1],
  );

  const subdivisionPerBeat = useMemo(() => {
    if (!subNew)
      return { label: '--', value: '' } as SubdivisionDropdownOptionsWithEmpty;

    const beat = parseInt(selectedBeat.value);
    if (isNaN(beat)) {
      const identicalSubs = subNew.every((sub) => sub === subNew[0]);
      if (identicalSubs) {
        const sub = subdivisionDataWithEmpty.filter(
          (sub) => sub.value === getSubdivisionName(subNew[0]),
        )[0];
        return sub;
      }

      const nullSub = subdivisionDataWithEmpty.filter(
        (sub) => sub.value === '',
      )[0];
      return nullSub;
    }

    const selectedSubIndex = subNew[beat - 1];
    const sub = subdivisionDataWithEmpty.filter(
      (sub) => sub.value === getSubdivisionName(selectedSubIndex),
    )[0];
    return sub;
  }, [selectedBeat, subNew]);

  const polySubdivisionPerBeat = useMemo(() => {
    if (!polySubNew)
      return { label: '--', value: '' } as SubdivisionDropdownOptionsWithEmpty;

    const beat = parseInt(polySelectedBeat.value);
    const sub0 = polySubNew[0];
    if (isNaN(beat)) {
      const identicalSubs = polySubNew.every((sub) => sub === sub0);
      if (identicalSubs) {
        const sub = subdivisionDataWithEmpty.filter(
          (sub) => sub.value === getSubdivisionName(sub0),
        )[0];
        return sub;
      }

      const nullSub = subdivisionDataWithEmpty.filter(
        (sub) => sub.value === '',
      )[0];
      return nullSub;
    }

    const selectedSubIndex = polySubNew[beat - 1];
    const sub = subdivisionDataWithEmpty.filter(
      (sub) => sub.value === getSubdivisionName(selectedSubIndex),
    )[0];
    return sub;
  }, [polySelectedBeat, polySubNew]);

  // rhythm event callbacks are bound once, read selection from refs
  const selectedBeatRef = useRef(selectedBeat);
  const subdivisionPerBeatRef = useRef(subdivisionPerBeat);
  const polySelectedBeatRef = useRef(polySelectedBeat);
  const polySubdivisionPerBeatRef = useRef(polySubdivisionPerBeat);
  useEffect(() => {
    selectedBeatRef.current = selectedBeat;
    subdivisionPerBeatRef.current = subdivisionPerBeat;
    polySelectedBeatRef.current = polySelectedBeat;
    polySubdivisionPerBeatRef.current = polySubdivisionPerBeat;
  }, [selectedBeat, subdivisionPerBeat, polySelectedBeat, polySubdivisionPerBeat]);

  // const polySubdivisionOptions = useMemo(() => {
  //   const options: DropdownOptions[] = [];
  //   for (let i = 1; i <= parseInt(beatCount.value); i++) {
  //     options.push({
  //       label: `${i}`,
  //       value: `${i}`,
  //     });
  //   }

  //   return options;
  // }, [beatCount]);

  // const [polyTab, setPolyTab] = useState(0);
  // const [usePolyrhythmTrainer, setUsePolyrhythmTrainer] = useState(false);

  /**
   * ++++++++++++++++
   * STATE & EFFECT
   * bpm and isRunning state shouldn't retrigger
   * additional effects, state safeguard effect
   * ++++++++++++++++
   */
  const bpmRef = useRef(bpm);
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    bpmRef.current = bpm;
    isRunningRef.current = isRunning;
  }, [bpm, isRunning]);

  /**
   * +++++++++++++++
   * EFFECT:
   * a whole rhythm was loaded (library, preset, save response). refreshes the
   * refs the engine callbacks read from, then tears the conductor down to zero
   * rhythms so the build effect below re-runs its guard and rebuilds from the
   * new context state. declared first so it commits before that rebuild.
   * +++++++++++++++
   */
  const appliedLoadToken = useRef(loadToken);
  useEffect(() => {
    if (appliedLoadToken.current === loadToken) return;
    appliedLoadToken.current = loadToken;

    if (!conductor.current) return;

    // refs first -- rhythm event callbacks read these, not render values
    beatCountRef.current = rhythm.beats;
    subdivisionRef.current = rhythm.subdivision;
    totalBeatsRef.current = rhythm.state;
    soundsRef.current = rhythm.sounds;
    polySubdivisionRef.current = rhythm.polySubdivision;
    totalPolyBeatsRef.current = rhythm.polyState;
    polySoundsRef.current = rhythm.polySounds;
    bpmRef.current = rhythm.bpm;

    setBeatCountGhost(null);
    setPolyBeatCountGhost(null);

    // stops playback, drops listeners, resets numberOfRhythms to 0
    conductor.current.removeRhythms();
    conductor.current.updateBPM(rhythm.bpm);

    releaseWakeLock();
    baseBeatStore.set(1);
    polyBeatStore.set(1);
  }, [loadToken, rhythm]);

  /**
   * +++++++++++
   * EFFECT
   * updates the bpm only without affecting the current rhythm instances
   * +++++++++++
   */
  const updateBPM = (bpm: number) => {
    if (!conductor.current) return;
    conductor.current.updateBPM(bpm);
  };

  /**
   * +++++++++++++++
   * EFFECT:
   * updates the current running conductor with new rhythm/polyrhythm parameters
   * +++++++++++++++
   */
  useEffect(() => {
    const initializeConductor = (): Conductor => {
      const audioCtx = new AudioContext();
      const conductor = new Conductor({ audioCtx, bpm: bpmRef.current });
      loadSounds(audioCtx); // load and forget

      return conductor;
    };
    // conductor event callbacks
    const updateIsRunning = (state: boolean) => setIsRunning(state);
    const updateBPM = (newBPM: number) => {
      if (newBPM !== bpmRef.current) {
        updateRhythm({ bpm: newBPM });
      }
    };

    // setup conductor if uninitialized
    if (!conductor.current) {
      conductor.current = initializeConductor();

      conductor.current.on('isRunning', updateIsRunning);
      conductor.current.on('updateBPM', updateBPM);
    }

    if (
      !conductor.current.isRunning &&
      conductor.current.numberOfRhythms === 0
    ) {
      conductor.current.removeRhythms();

      // base rhythm event callbacks
      const updateBeatChange = (beat: number) => {
        baseBeatStore.set(beat);
      };

      const updateTotalBeatChange = (
        update: BeatUpdatePayload,
      ): BeatState[] | null => {
        const { beats: totalBeats, sub } = update;
        if (totalBeats === parseInt(beatCountRef.current.value)) return null;

        const newBeatCount = getBeatCount(totalBeats);
        // const newBeatState = getBeatState(
        //   totalBeats,
        //   subdivisionRef.current.value,
        // );

        const currentSelectedBeat = selectedBeatRef.current;
        const currentSubPerBeat = subdivisionPerBeatRef.current;
        let defaultSub = SubdivisionKeyValue.base;
        if (currentSelectedBeat.value === 'all' && currentSubPerBeat.value) {
          defaultSub = getSubdivision(currentSubPerBeat.value);
        }

        // fix, move to helper, no !
        const newSubdivision = buildSubdivision(totalBeats, sub, defaultSub);
        console.log(newSubdivision);
        // const newBeatState = new Array(
        //   calculateTotalBeats(newSubdivision!),
        // ).fill(1) as BeatState[];

        const newBeatState = buildBeatState(
          calculateTotalBeats(newSubdivision),
          totalBeatsRef.current,
        );

        // update beat sounds state
        const newSounds = getBeatSoundState(
          newBeatState.length,
          soundsRef.current,
          Sound.Oscillator,
        );

        conductor.current?.getRhythm(0).updateSounds(newSounds);
        conductor.current?.getRhythm(0).setSubdivisionNew(newSubdivision);
        soundsRef.current = newSounds;

        beatCountRef.current = newBeatCount;
        totalBeatsRef.current = newBeatState;

        setBeatCountGhost(null);

        totalBeatsRef.current = newBeatState;
        updateRhythm({
          sounds: newSounds,
          beats: newBeatCount,
          state: newBeatState,
          subNew: newSubdivision,
        });

        return newBeatState;
      };

      const baseSubdivision = 1; // ignored in Rhythm - DELETE
      const baseBeatCount = parseInt(beatCount.value);
      const baseBeatState = totalBeatsRef.current;

      const baseSound = new SoundPlayer({
        audioCtx: conductor.current.audioCtx,
        outputNode: conductor.current.masterGain,
        frequency: frequencyData.frequency,
        beatOneOffset: frequencyData.beatOneOffset,
        subdividedOffset: frequencyData.subdividedOffset,
        gain: frequencyData.gain,
        type: PlayerType.Sound,
        sound: Sound.Kick,
      });

      const subdivisionNew = subNew;

      const baseRhythm = new Rhythm({
        subdivision: baseSubdivision, // just satisfying the linter
        beats: baseBeatCount,
        state: baseBeatState,
        sound: baseSound,
        sounds,
        subNew: subdivisionNew,
      });

      conductor.current.addRhythm(baseRhythm);

      baseRhythm.on('beatChange', updateBeatChange);
      baseRhythm.on('updatedBeats', (update: BeatUpdatePayload) => {
        const state = updateTotalBeatChange(update);
        if (state) {
          baseRhythm.resetState(state);
        }
      });
    }

    if (usePolyrhythm && conductor.current.numberOfRhythms !== 2) {
      // poly rhythm event callbacks
      const updateBeatChange = (beat: number) => {
        polyBeatStore.set(beat);
      };

      const updateTotalBeatChange = (
        update: BeatUpdatePayload,
      ): BeatState[] | null => {
        const { beats: totalBeats, sub } = update;

        const newBeatCount = getBeatCount(totalBeats);

        let defaultSub = SubdivisionKeyValue.base;
        const currentPolySelectedBeat = polySelectedBeatRef.current;
        const currentPolySubPerBeat = polySubdivisionPerBeatRef.current;
        if (
          currentPolySelectedBeat.value === 'all' &&
          currentPolySubPerBeat.value
        ) {
          defaultSub = getSubdivision(currentPolySubPerBeat.value);
        }

        const newSubdivision = buildSubdivision(totalBeats, sub, defaultSub);
        // const newBeatState = new Array(
        //   calculateTotalBeats(newSubdivision!),
        // ).fill(1) as BeatState[];

        const newBeatState = buildBeatState(
          calculateTotalBeats(newSubdivision),
          totalPolyBeatsRef.current,
        );

        // update beat sounds state
        const newSounds = getBeatSoundState(
          newBeatState.length,
          polySoundsRef.current,
          Sound.HiHat,
        );

        conductor.current?.getRhythm(1).updateSounds(newSounds);
        conductor.current?.getRhythm(1).setSubdivisionNew(newSubdivision);

        polySoundsRef.current = newSounds;
        totalPolyBeatsRef.current = newBeatState;

        setPolyBeatCountGhost(null);
        updateRhythm({
          polySounds: newSounds,
          polyBeats: newBeatCount,
          polyState: newBeatState,
          polySubNew: newSubdivision,
        });

        return newBeatState;
      };

      const polySound = new SoundPlayer({
        audioCtx: conductor.current.audioCtx,
        outputNode: conductor.current.masterGain,
        frequency: polyFrequencyData.frequency,
        beatOneOffset: polyFrequencyData.beatOneOffset,
        subdividedOffset: polyFrequencyData.subdividedOffset,
        gain: polyFrequencyData.gain,
        type: PlayerType.Oscillator,
        sound: null,
      });

      const polySub = 1; // ignored in Rhythm - DELETE
      const polyState = new Array(calculateTotalBeats(polySubNew ?? [])).fill(
        1,
      ) as BeatState[];

      const polyBeat = parseInt(beatCount.value);
      const polyTotalBeats = parseInt(polyBeatCount.value);

      const polySubdivisionNew = polySubNew;

      const polyRhythm = new Rhythm({
        subdivision: polySub, // just satisfying the linter
        sound: polySound,
        beats: polyBeat,
        poly: polyTotalBeats,
        state: polyState,
        sounds: polySounds,
        subNew: polySubdivisionNew,
      });

      // handle new rhythms when base rhythm
      // has a pending beat change so rhythms
      // are synced on beat 1
      const pendingBeatChange =
        conductor.current.getRhythm(0).pendingBeatChanges;

      conductor.current.addRhythm(polyRhythm);

      if (pendingBeatChange.hasUpdate) {
        polyRhythm.updateBeats(
          pendingBeatChange.base.beats,
          polyTotalBeats,
          isRunningRef.current,
        );
      }

      polyRhythm.on('beatChange', updateBeatChange);

      polyRhythm.on('updatedBeats', (update: BeatUpdatePayload) => {
        const newBeatState = updateTotalBeatChange(update);
        if (newBeatState) {
          polyRhythm.resetState(newBeatState);
        }
      });
    }
  }, [
    subdivision,
    beatCount,
    frequencyData,
    usePolyrhythm,
    polyBeatCount,
    polyFrequencyData,
    polySubdivision,
    sounds,
    polySounds,
    updateRhythm,
    loadToken,
    subNew,
  ]);

  // cleanup only
  useEffect(() => {
    return () => {
      if (conductor.current?.isRunning) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
        conductor.current = null;
      }

      releaseWakeLock();

      // stores outlive the page, so reset them or a remount restores the
      // highlight to whatever beat playback happened to stop on
      baseBeatStore.set(1);
      polyBeatStore.set(1);
    };
  }, []);

  function toggleMetronome(): void {
    if (!conductor.current) return;

    if (isRunning) {
      conductor.current.stop();
      setBeatCountGhost(null);
      setPolyBeatCountGhost(null);
      releaseWakeLock();
    } else {
      conductor.current.start();
      requestWakeLock();
    }
  }

  function updateSubdivision(sub: SubdivisionName | ''): void {
    if (!subNew || sub === '') return;

    const newSubdivision = getSubdivision(sub);
    let updatedSubdivisions = [...subNew];
    if (selectedBeat.value === 'all') {
      updatedSubdivisions = updatedSubdivisions.map(() => newSubdivision);
    } else {
      updatedSubdivisions[parseInt(selectedBeat.value) - 1] = newSubdivision;
    }

    //USE something like this...
    // MOVE TO HELPER
    const newBeatState = new Array(
      calculateTotalBeats(updatedSubdivisions),
    ).fill(1) as BeatState[];

    // const newBeatState = getBeatState(
    //   parseInt(beatCount.value),
    //   newSubdivision,
    // );

    const newSounds = getBeatSoundState(
      newBeatState.length,
      sounds,
      Sound.Oscillator,
    );

    if (conductor.current) {
      conductor.current
        .getRhythm(0)
        .updateStates(
          updatedSubdivisions,
          newBeatState,
          newSounds,
          conductor.current.bpm,
        );
    }

    totalBeatsRef.current = newBeatState; // used in useEffect

    updateRhythm({
      state: newBeatState,
      // subdivision: newSubdivision,
      sounds: newSounds,
      subNew: updatedSubdivisions,
    });

    soundsRef.current = newSounds;
    // subdivisionRef.current = newSubdivision;
  }

  function updatePolySubdivision(sub: SubdivisionName | ''): void {
    if (!polySubNew || sub === '') return;

    const newSubdivision = getSubdivision(sub);
    let updatedSubdivisions = [...polySubNew];

    if (polySelectedBeat.value === 'all') {
      updatedSubdivisions = updatedSubdivisions.map(() => newSubdivision);
    } else {
      updatedSubdivisions[parseInt(polySelectedBeat.value) - 1] =
        newSubdivision;
    }

    updatedSubdivisions[parseInt(polySelectedBeat.value) - 1] = newSubdivision;

    const newBeatState = new Array(
      calculateTotalBeats(updatedSubdivisions),
    ).fill(1) as BeatState[];

    const newSounds = getBeatSoundState(
      newBeatState.length,
      polySounds,
      Sound.HiHat,
    );

    if (conductor.current) {
      // const rhythm = conductor.current.getRhythm(1);
      // rhythm.resetState(newBeatState); // updates rhythm state
      // rhythm.setSubdivision(getSubdivision(newSubdivision.value));
      // rhythm.updateSounds(newSounds);
      conductor.current
        .getRhythm(1)
        .updateStates(
          updatedSubdivisions,
          newBeatState,
          newSounds,
          conductor.current.bpm,
        );
    }

    totalPolyBeatsRef.current = newBeatState; // used in useEffect
    updateRhythm({
      polyState: newBeatState,
      // polySubdivision: newSubdivision,
      polySubNew: updatedSubdivisions,
      polySounds: newSounds,
    });

    polySoundsRef.current = newSounds;
    // polySubdivisionRef.current = newSubdivision;
  }

  function updateFrequencyData(
    value: number,
    key: keyof typeof polyFrequencyData,
  ): void {
    if (!conductor.current) return;

    const baseRhythm = conductor.current.getRhythm(0);

    setFrequencyData((prev) => {
      const next = { ...prev, [key]: value };
      baseRhythm.updateFrequencyData(next);
      return next;
    });
  }

  function updatePolyFrequencyData(
    value: number,
    key: keyof typeof polyFrequencyData,
  ): void {
    if (!conductor.current) return;

    const baseRhythm = conductor.current.getRhythm(1);

    setPolyFrequencyData((prev) => {
      const next = { ...prev, [key]: value };
      baseRhythm.updateFrequencyData(next);
      return next;
    });
  }

  function updateBeatSounds(sound: Sound, index: number): void {
    const newSounds = sounds.map((s, i) => {
      if (i !== index) return s;
      return s.includes(sound) ? s.filter((v) => v !== sound) : [...s, sound];
    });
    // do not remove last item
    if (newSounds[index].length === 0) newSounds[index].push(sound);
    updateRhythm({ sounds: newSounds });
    conductor.current?.updateSounds(newSounds, 0);
    soundsRef.current = newSounds;
  }

  function updatePolyBeatSounds(sound: Sound, index: number): void {
    const newSounds = polySounds.map((s, i) => {
      if (i !== index) return s;
      return s.includes(sound) ? s.filter((v) => v !== sound) : [...s, sound];
    });
    // do not remove last item
    if (newSounds[index].length === 0) newSounds[index].push(sound);
    updateRhythm({ polySounds: newSounds });
    conductor.current?.updateSounds(newSounds, 1);
    polySoundsRef.current = newSounds;
  }

  /**
   * +++++++++++
   * Update Total Base Rhythm Beats
   * +++++++++++
   */
  const [beatCountGhost, setBeatCountGhost] = useState<DropdownOptions | null>(
    null,
  );

  function handleBeatCountChange(update: number): void {
    // change subdivision array here as well
    const updatedBeat = parseInt((beatCountGhost ?? beatCount).value) + update;
    if (updatedBeat < 1 || updatedBeat > 10) return;

    updateBeatCount(updatedBeat.toString());
  }

  function handlePolyBeatCountChange(update: number): void {
    const updatedBeat =
      parseInt((polyBeatCountGhost ?? polyBeatCount).value) + update;
    if (updatedBeat < 1 || updatedBeat > 10) return;

    updatePolyBeatCount(updatedBeat.toString());
  }

  function updateBeatCount(value: string): void {
    const updatedBeatCount = parseInt(value);

    let defaultSub = SubdivisionKeyValue.base;
    if (selectedBeat.value === 'all' && subdivisionPerBeat.value) {
      defaultSub = getSubdivision(subdivisionPerBeat.value);
    }

    const newSubdivision = buildSubdivision(
      updatedBeatCount,
      subNew,
      defaultSub,
    );

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);

      conductor.current.updateBeats(updatedBeatCount, null);

      const newBeatCount = getBeatCount(parseInt(value));

      // const newBeatState = getBeatState(updatedBeatCount, subdivision.value);
      const newBeatState = buildBeatState(
        calculateTotalBeats(newSubdivision),
        totalBeats,
      );

      if (!isRunning) {
        rhythm.resetState(newBeatState);
        // update beat sounds state
        const newSounds = getBeatSoundState(newBeatState.length, sounds);
        rhythm.updateSounds(newSounds);
        rhythm.setSubdivisionNew(newSubdivision);
        soundsRef.current = newSounds;

        beatCountRef.current = newBeatCount;
        totalBeatsRef.current = newBeatState;
        updateRhythm({
          sounds: newSounds,
          state: newBeatState,
          beats: newBeatCount,
          subNew: newSubdivision,
        });
      } else {
        if (value !== beatCount.value) {
          setBeatCountGhost(newBeatCount);
        } else {
          setBeatCountGhost(null);
        }
      }
    }
  }

  /**
   * +++++++++++
   * Update Total Poly Beats
   * +++++++++++
   */
  const [polyBeatCountGhost, setPolyBeatCountGhost] =
    useState<DropdownOptions | null>(null);

  function updatePolyBeatCount(value: string): void {
    const updatedBeatCount = parseInt(value);

    let defaultSub = SubdivisionKeyValue.base;
    if (polySelectedBeat.value === 'all' && polySubdivisionPerBeat.value) {
      defaultSub = getSubdivision(polySubdivisionPerBeat.value);
    }

    const newSubdivision = buildSubdivision(
      updatedBeatCount,
      polySubNew,
      defaultSub,
    );

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);

      rhythm.updateBeats(null, updatedBeatCount, isRunning);
      const newBeatCount = getBeatCount(parseInt(value));
      // const newBeatState = getBeatState(
      //   updatedBeatCount,
      //   polySubdivision.value,
      // );
      const newBeatState = buildBeatState(
        calculateTotalBeats(newSubdivision),
        totalPolyBeats,
      );
      if (!isRunning) {
        rhythm.resetState(newBeatState);

        // update poly beat sounds state
        const newSounds = getBeatSoundState(newBeatState.length, polySounds);
        rhythm.updateSounds(newSounds);
        rhythm.setSubdivisionNew(newSubdivision);
        polySoundsRef.current = newSounds;

        updateRhythm({
          polySounds: newSounds,
          polyState: newBeatState,
          polyBeats: newBeatCount,
          polySubNew: newSubdivision,
        });
      } else {
        setPolyBeatCountGhost(newBeatCount);
      }
    }
  }

  /**
   * +++++++++++
   * Poly Rhythm Toggle
   * +++++++++++
   */
  function updateUsePolyrhythm(usePoly: boolean): void {
    updateRhythm({ usePoly });

    if (!usePoly && selectedSetting === 'polyrhythm') {
      setSelectedSetting('metronome');
    }

    if (!usePoly && conductor.current) {
      conductor.current.getRhythm(1).kill();
      conductor.current.removeRhythm(1);
    }
  }

  function updateBeatState(state: BeatState[]): void {
    updateRhythm({ state });
    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);
      if (rhythm) {
        rhythm.overwriteState(state);
      }
    }
  }

  function updatePolyBeatState(state: BeatState[]): void {
    updateRhythm({ polyState: state });
    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      if (rhythm) {
        rhythm.overwriteState(state);
      }
    }
  }

  /**
   * +++++++++++
   * Fullscreen Toggle
   * +++++++++++
   */
  async function toggleFullscreen(): Promise<void> {
    if (!document.fullscreenElement) {
      try {
        document.documentElement.requestFullscreen();
      } catch (err) {
        console.log(err);
      }
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * ++++++++++++++++++++
   * Beat Sequencer Click
   * ++++++++++++++++++++
   */
  const handleBeatClick = (i: number): void => {
    console.log(totalBeats);
    const state = Math.abs(totalBeats[i] - 1) as BeatState;
    updateRhythm({
      state: totalBeats.map((value, index) => (index === i ? state : value)),
    });

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0); // base rhythm
      rhythm.updateState(i, state);
    }
  };

  /**
   * ++++++++++++++++++++++++++
   * Poly Beat Sequencer Click
   * ++++++++++++++++++++++++++
   */
  const handlePolyBeatClick = (i: number): void => {
    const state = Math.abs(totalPolyBeats[i] - 1) as BeatState;
    updateRhythm({
      polyState: totalPolyBeats.map((value, index) =>
        index === i ? state : value,
      ),
    });

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      rhythm.updateState(i, state);
    }
  };

  /**
   * ++++++++++++++++++++++++++
   * Subdivision Update New
   * ++++++++++++++++++++++++++
   */
  const updateSubdivisionNew = (sub: SubdivisionName, beat: number): void => {
    if (!subNew) return;

    // get new subdivision floating point value
    const updatedSubdivisions = [...subNew];
    updatedSubdivisions[beat] = getSubdivision(sub);

    // remap BeatState
    const updatedState = new Array(
      calculateTotalBeats(updatedSubdivisions),
    ).fill(1) as BeatState[];

    // remap SoundState
    const updatedSounds = getBeatSoundState(
      calculateTotalBeats(updatedSubdivisions),
      soundsRef.current,
      Sound.Oscillator,
    );

    // update UI state
    updateRhythm({
      subNew: updatedSubdivisions,
      state: updatedState,
      sounds: updatedSounds,
    });

    if (conductor.current) {
      // update timing engine
      conductor.current
        .getRhythm(0)
        .updateStates(
          updatedSubdivisions,
          updatedState,
          updatedSounds,
          conductor.current.bpm,
        );
    }
  };

  const updatePolySubdivisionNew = (
    sub: SubdivisionName,
    beat: number,
  ): void => {
    if (!polySubNew) return;

    // get new subdivision floating point value
    const updatedSubdivisions = [...polySubNew];
    updatedSubdivisions[beat] = getSubdivision(sub);

    // update BeatState
    const updatedState = new Array(
      calculateTotalBeats(updatedSubdivisions),
    ).fill(1) as BeatState[];

    // update SoundState
    const updatedSounds = getBeatSoundState(
      calculateTotalBeats(updatedSubdivisions),
      polySoundsRef.current,
      Sound.HiHat,
    );

    // update UI state
    updateRhythm({
      polySubNew: updatedSubdivisions,
      polyState: updatedState,
      polySounds: updatedSounds,
    });

    if (conductor.current) {
      // update timing engine
      conductor.current
        .getRhythm(1)
        .updateStates(
          updatedSubdivisions,
          updatedState,
          updatedSounds,
          conductor.current.bpm,
        );
    }
  };

  // move to hook
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') return;

      conductor.current?.stop();
      releaseWakeLock();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  /**
   * ++++++++++++++++++++++++++
   * Library Rhythms
   * ++++++++++++++++++++++++++
   */

  // const setLibraryRhythm = (preset: Rhythms): void => {
  //   const data = RhythmsData[preset];

  //   // a whole-rhythm replacement: the load effect stops playback, refreshes
  //   // the refs and rebuilds the engine, poly teardown included
  //   setRhythm({
  //     ...rhythm,
  //     bpm: data.bpm,
  //     subdivision: data.subdivision,
  //     beats: data.beats,
  //     usePoly: data.usePoly,
  //     state: data.state,
  //     sounds: getBeatSoundState(data.state.length, sounds, Sound.Oscillator),
  //   });
  // };

  const generateShareableUrl = async (): Promise<void> => {
    const url = `${window.location.origin}${window.location.pathname}?`;

    let query = `bpm=${bpm}`;

    const beats = beatCountData.findIndex(
      (data) => data.value === beatCount.value,
    );
    query += `&bc=${beats}`;

    const sub = subdivisionData.findIndex(
      (data) => data.value === subdivision.value,
    );
    query += `&bs=${sub}`;

    query += `&bst=${totalBeats.join('')}`;

    /**
     * converts: [[1,2,3], [4,5,6]]
     * to: '1,2,3-4,5,6'
     */
    query += `&bsst=${sounds.join('-')}`;

    if (usePolyrhythm) {
      query += `&p=1`;

      const beats = beatCountData.findIndex(
        (data) => data.value === polyBeatCount.value,
      );
      query += `&pc=${beats}`;

      const sub = subdivisionData.findIndex(
        (data) => data.value === polySubdivision.value,
      );
      query += `&ps=${sub}`;

      query += `&pbst=${totalPolyBeats.join('')}`;

      /**
       * converts: [[1,2,3], [4,5,6]]
       * to: '1,2,3-4,5,6'
       */
      query += `&bpsst=${polySounds.join('-')}`;
    }

    await navigator.clipboard.writeText(`${url}${btoa(query)}`);

    toast('url copied to clipboard');
  };

  return (
    <>
      <section className="metronome__outer-container">
        <Display
          isRunning={isRunning}
          bpm={bpm}
          beats={parseInt(beatCount.value)}
          polyrhythm={parseInt(polyBeatCount.value)}
          usePoly={usePolyrhythm}
          togglePlayback={toggleMetronome}
          updateBPM={updateBPM}
          subdivision={
            Subdivisions[subdivision.value as keyof typeof Subdivisions]
          }
          subdivisionNew={subNew ?? []}
          polySubdivisionNew={polySubNew ?? []}
          subdivisionIcon={subdivision.icon}
          polySubdivision={
            Subdivisions[polySubdivision.value as keyof typeof Subdivisions]
          }
          polySubdivisionIcon={polySubdivision.icon}
          handleBeatClick={handleBeatClick}
          handlePolyBeatClick={handlePolyBeatClick}
          totalBeats={totalBeats}
          totalPolyBeats={totalPolyBeats}
          beatCountGhost={
            beatCountGhost ? parseInt(beatCountGhost.value) : beatCountGhost
          }
          polyBeatCountGhost={
            polyBeatCountGhost
              ? parseInt(polyBeatCountGhost.value)
              : polyBeatCountGhost
          }
          beatSounds={sounds}
          polyBeatSounds={polySounds}
          handleSoundSelection={updateBeatSounds}
          handlePolySoundSelection={updatePolyBeatSounds}
          handleSubdivisionUpdate={updateSubdivisionNew}
          handlePolySubdivisionUpdate={updatePolySubdivisionNew}
        />
      </section>
      <section className="settings-toggle-row">
        <div className="polyrhtyhm-beatcount-container">
          <span>
            <h3>{beatCount.value}</h3>
          </span>
          {usePolyrhythm && (
            <span>
              <h3>:{polyBeatCount.value}</h3>
            </span>
          )}
        </div>
      </section>

      {/* Metronome Settings */}
      <Tabs index={tab} updateTab={setTab}>
        <Tabs.Tab label={<GridIcon />}>
          <div className="flex">
            {/* Beat Count */}
            <section className="flex width-100 space-between align-center">
              <div className="text-light font-size-13 text-left flex-1">
                beats per measure
              </div>
              <div className="flex flex-1">
                <button
                  disabled={(beatCountGhost ?? beatCount).value === '1'}
                  className="mr-2 color-white"
                  onClick={() => handleBeatCountChange(-1)}
                >
                  &#8722;
                </button>
                <Dropdown
                  variant="small"
                  data={beatCountData}
                  currentValue={beatCountGhost ?? beatCount}
                  onChange={updateBeatCount}
                />
                <button
                  disabled={(beatCountGhost ?? beatCount).value === '10'}
                  className="ml-2 color-white"
                  onClick={() => handleBeatCountChange(1)}
                >
                  &#43;
                </button>
              </div>
            </section>

            {/* Subdivision */}
            <section className="flex width-100 space-between align-center f-gap4">
              <div className="text-light font-size-13 text-left flex-1">
                subdivision
              </div>
              <div className="flex flex-1">
                <Dropdown
                  variant="full"
                  data={subdivisionOptions}
                  currentValue={selectedBeat}
                  onChange={(value) => {
                    const option = subdivisionOptions.find((option) => {
                      return option.value === value;
                    });
                    if (option) {
                      setSelectedBeat(option);
                    }
                  }}
                />
              </div>
              <div className="flex flex-1">
                <Dropdown
                  variant="full"
                  data={subdivisionDataWithEmpty}
                  currentValue={subdivisionPerBeat}
                  onChange={updateSubdivision}
                />
              </div>
            </section>

            {/* Rhythm State */}
            <section className="flex width-100 space-between align-center">
              <div className="text-light font-size-13 text-left flex-1">
                state
              </div>
              <div className="flex flex-1">
                <button
                  onClick={() => setPrimaryBeatState(!primaryBeatState)}
                  className="filled small full"
                >
                  {primaryBeatState ? 'close' : 'modify'}
                </button>
              </div>
            </section>

            {primaryBeatState ? (
              <section className="flex flex-wrap justify-center width-100 align-center mb-2 f-gap4">
                <RhythmState
                  onUpdate={(state) => updateBeatState(state)}
                  disabled={false}
                  subdivisions={subNew!}
                  size="sm"
                  state={totalBeats}
                  sounds={sounds}
                  onSoundChange={updateBeatSounds}
                />
              </section>
            ) : null}

            {/* use poly rhyhtm */}
            <section className="flex width-100 space-between align-center">
              <div className="flex flex-col text-left">
                <span className="font-size-13 font-weight-bold">
                  Polyrhythm
                </span>
                <span className="text-light font-size-12">
                  Layer a second rhythm
                </span>
              </div>
              <div className="flex">
                <Toggle
                  label=""
                  variant="small"
                  isChecked={usePolyrhythm}
                  onChange={updateUsePolyrhythm}
                />
              </div>
            </section>

            {/* polyrhythm settings */}
            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light font-size-13 text-left flex-1">
                  poly beats per measure
                </div>
                <div className="flex flex-1">
                  <button
                    disabled={
                      (polyBeatCountGhost ?? polyBeatCount).value === '1'
                    }
                    className="mr-2 color-white"
                    onClick={() => handlePolyBeatCountChange(-1)}
                  >
                    &#8722;
                  </button>
                  <Dropdown
                    variant="small"
                    data={beatCountData}
                    currentValue={polyBeatCountGhost ?? polyBeatCount}
                    onChange={updatePolyBeatCount}
                  />
                  <button
                    disabled={
                      (polyBeatCountGhost ?? polyBeatCount).value === '10'
                    }
                    className="ml-2 color-white"
                    onClick={() => handlePolyBeatCountChange(1)}
                  >
                    &#43;
                  </button>
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented f-gap4">
                <div className="text-light font-size-13 flex-1 text-left">
                  subdivision
                </div>
                <div className="flex flex-1">
                  <Dropdown
                    variant="full"
                    data={polySubdivisionOptions}
                    currentValue={polySelectedBeat}
                    onChange={(value) => {
                      const option = polySubdivisionOptions.find(
                        (option) => option.value === value,
                      );
                      if (option) {
                        setPolySelectedBeat(option);
                      }
                    }}
                  />
                </div>
                <div className="flex flex-1">
                  <Dropdown
                    variant="full"
                    data={subdivisionData}
                    currentValue={polySubdivisionPerBeat}
                    onChange={updatePolySubdivision}
                  />
                </div>
              </section>
            )}

            {/* Rhythm State */}
            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center">
                <div className="text-light font-size-13 text-left flex-1">
                  state
                </div>
                <div className="flex flex-1">
                  <button
                    onClick={() => setPolyBeatState(!polyBeatState)}
                    className="filled small full"
                  >
                    {polyBeatState ? 'close' : 'modify'}
                  </button>
                </div>
              </section>
            )}

            {usePolyrhythm && polyBeatState ? (
              <section className="flex flex-wrap justify-center width-100 align-center mb-2 f-gap4">
                <RhythmState
                  onUpdate={(state) => updatePolyBeatState(state)}
                  subdivisions={polySubNew!}
                  disabled={false}
                  size="sm"
                  sounds={polySounds}
                  state={totalPolyBeats}
                  onSoundChange={updatePolyBeatSounds}
                />
              </section>
            ) : null}
          </div>
        </Tabs.Tab>
        <Tabs.Tab label={<SoundWaveIcon />}>
          {/* Frequency Sliders */}
          <div className="flex">
            <section className="flex width-100 space-between align-center">
              <div className="text-light text-left font-size-13 flex-1">
                gain
              </div>
              <div className="flex flex-1">
                <Slider
                  min={0.1}
                  max={1.2}
                  step={0.1}
                  label=""
                  currentValue={frequencyData.gain}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'gain')
                  }
                />
              </div>
            </section>

            <section className="flex width-100 space-between align-center">
              <div className="text-light font-size-13 text-left flex-1">
                frequency
              </div>
              <div className="flex flex-1">
                <Slider
                  min={500}
                  max={1500}
                  step={10}
                  label=""
                  currentValue={frequencyData.frequency}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'frequency')
                  }
                />
              </div>
            </section>

            <section className="flex width-100 space-between align-center">
              <div className="text-light font-size-13 text-left flex-1">
                beat one pitch
              </div>
              <div className="flex flex-1">
                <Slider
                  min={1}
                  max={6}
                  step={1}
                  label=""
                  currentValue={frequencyData.beatOneOffset}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'beatOneOffset')
                  }
                />
              </div>
            </section>

            <section className="flex width-100 space-between align-center">
              <div className="text-light font-size-13 text-left flex-1">
                subdivided pitch
              </div>
              <div className="flex flex-1">
                <Slider
                  min={-5}
                  max={6}
                  step={1}
                  label=""
                  currentValue={frequencyData.subdividedOffset}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'subdividedOffset')
                  }
                />
              </div>
            </section>

            {/* use poly rhyhtm */}
            <section className="flex width-100 space-between align-center">
              <div className="flex flex-col text-left">
                <span className="font-size-13 font-weight-bold">
                  Polyrhythm
                </span>
                <span className="text-light font-size-12">
                  Layer a second rhythm
                </span>
              </div>
              <div className="flex">
                <Toggle
                  label=""
                  variant="small"
                  isChecked={usePolyrhythm}
                  onChange={updateUsePolyrhythm}
                />
              </div>
            </section>

            {/* Poly Frequency Sliders */}
            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light text-left font-size-13 flex-1">
                  gain
                </div>
                <div className="flex flex-1">
                  <Slider
                    min={0.1}
                    max={1.2}
                    step={0.1}
                    label=""
                    currentValue={polyFrequencyData.gain}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'gain')
                    }
                  />
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light text-left font-size-13 flex-1">
                  frequency
                </div>
                <div className="flex flex-1">
                  <Slider
                    min={500}
                    max={1500}
                    step={10}
                    label=""
                    currentValue={polyFrequencyData.frequency}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'frequency')
                    }
                  />
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light text-left font-size-13 flex-1">
                  beat one pitch
                </div>
                <div className="flex flex-1">
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    label=""
                    currentValue={polyFrequencyData.beatOneOffset}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'beatOneOffset')
                    }
                  />
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light text-left font-size-13 flex-1">
                  subdivided pitch
                </div>
                <div className="flex flex-1">
                  <Slider
                    min={-5}
                    max={6}
                    step={1}
                    label=""
                    currentValue={polyFrequencyData.subdividedOffset}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'subdividedOffset')
                    }
                  />
                </div>
              </section>
            )}
          </div>
        </Tabs.Tab>

        {/* <Tabs.Tab label={<LibrarySettings />}>
          {!isAuthenticated ? (
            <div className="flex">
              <section className="flex width-100 space-between align-center">
                <div className="text-light text-left font-size-13 flex-1">
                  son clave
                </div>
                <div className="flex flex-col f-gap2">
                  <div className="flex flex-1">
                    <button
                      onClick={() => setLibraryRhythm(Rhythms.SonClave23)}
                      className="filled small full"
                    >
                      2:3 son clave
                    </button>
                  </div>
                  <div className="flex flex-1">
                    <button
                      onClick={() => setLibraryRhythm(Rhythms.SonClave32)}
                      className="filled small full"
                    >
                      3:2 son clave
                    </button>
                  </div>
                </div>
              </section>

              <section className="flex width-100 space-between align-center">
                <div className="text-light text-left font-size-13 flex-1">
                  rumba clave
                </div>
                <div className="flex flex-col f-gap2">
                  <div className="flex flex-1">
                    <button
                      onClick={() => setLibraryRhythm(Rhythms.RumbaClave23)}
                      className="filled small full"
                    >
                      2:3 rumba clave
                    </button>
                  </div>
                  <div className="flex flex-1">
                    <button
                      onClick={() => setLibraryRhythm(Rhythms.RumbaClave32)}
                      className="filled small full"
                    >
                      3:2 rumba clave
                    </button>
                  </div>
                </div>
              </section>

              <section className="flex width-100 space-between align-center">
                <div className="text-light text-left font-size-13 flex-1">
                  tresillo
                </div>
                <div className="flex flex-1">
                  <button
                    onClick={() => setLibraryRhythm(Rhythms.Tresillo)}
                    className="filled small full"
                  >
                    tresillo
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex"></div>
          )}
        </Tabs.Tab> */}
      </Tabs>

      <section className="settings-row">
        <div className="flex f-gap2">
          {!isMobileUserAgent() && (
            <button onClick={toggleFullscreen}>fullscreen</button>
          )}
          <button onClick={generateShareableUrl}>
            <ShareIcon style={{ width: '18px' }} /> share
          </button>
        </div>
      </section>
    </>
  );
}
