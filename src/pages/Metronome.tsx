import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../App.css';
import BeatGridSettings from '../assets/icons/beat-grid-settings.svg?react';
import LibrarySettings from '../assets/icons/folder.svg?react';
import ShareIcon from '../assets/icons/share.svg?react';
import SoundSettings from '../assets/icons/sound-settings.svg?react';
import Display from '../components/Display';
import Dropdown, { type DropdownOptions } from '../components/Dropdown';
import RhythmState from '../components/RhythmState';
import Slider from '../components/Slider';
import { Tabs } from '../components/Tabs/Tabs';
import Toggle from '../components/Toggle';
import type { RhythmBlock } from '../context/BuilderContext.types';
import { beatCountData, subdivisionData } from '../data';
import {
  isMobileUserAgent,
  parseMetronomeQueryParams,
} from '../helpers/metronome.helpers';
import {
  getBeatCount,
  getBeatSoundState,
  getBeatState,
  getSubdivision,
  Rhythms,
  RhythmsData,
} from '../services/rhythm.services';
import { loadSounds } from '../services/sound.services';
import { releaseWakeLock, requestWakeLock } from '../services/wakelock';
import { Conductor } from '../timing_engine/conductor';
import { SoundPlayer } from '../timing_engine/oscillator';
import { PlayerType, Sound } from '../timing_engine/oscillator.types';
import { Rhythm } from '../timing_engine/rhythm';
import { type BeatState } from '../timing_engine/rhythm.types';
import { Subdivisions } from '../timing_engine/types';

export default function Metronome() {
  const routes = useLocation();

  /**
   * +++++++++++++++++++
   * Metronome Defaults
   * +++++++++++++++++++
   */
  let defaultBeatCount = beatCountData[3];
  let defaultBpm = 60;
  const defaultFrequency = 750;

  const parsedDefaults = parseMetronomeQueryParams(routes.search);
  if (parsedDefaults.baseCount) {
    defaultBeatCount = beatCountData[parsedDefaults.baseCount];
  }

  if (parsedDefaults.bpm) {
    defaultBpm = parsedDefaults.bpm;
  }

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
  const [bpm, setBPM] = useState(defaultBpm);
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

  const beatCountRef = useRef(defaultBeatCount);
  const [beatCount, setBeatCount] = useState<DropdownOptions>(defaultBeatCount);
  const [subdivision, setSubdivision] = useState<DropdownOptions>(
    parsedDefaults.baseSubdivion
      ? subdivisionData[parsedDefaults.baseSubdivion]
      : subdivisionData[0],
  );
  const subdivisionRef = useRef(subdivision);
  // emitted from rhythm instance
  const [currentBeat, setCurrentBeat] = useState(1);

  const defaultBeats = parsedDefaults.beatState
    ? parsedDefaults.beatState
    : (new Array(
        parseInt(beatCount.value) /
          Subdivisions[subdivision.value as keyof typeof Subdivisions],
      ).fill(1) as BeatState[]);

  //beat state
  const [totalBeats, setTotalBeats] = useState<BeatState[]>(defaultBeats);
  const totalBeatsRef = useRef<BeatState[]>(defaultBeats);

  //beat sound state
  const defaultBeatSounds = parsedDefaults.beatSounds
    ? parsedDefaults.beatSounds
    : (new Array(defaultBeats.length).fill([Sound.Oscillator]) as Sound[][]);
  const [sounds, setSounds] = useState<Sound[][]>(defaultBeatSounds);

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
  const [polyBeatCount, setPolyBeatCount] = useState<DropdownOptions>(
    parsedDefaults.polyCount
      ? beatCountData[parsedDefaults.polyCount]
      : beatCountData[2],
  );
  const [polySubdivision, setPolySubdivision] = useState<DropdownOptions>(
    parsedDefaults.polySubdivision
      ? subdivisionData[parsedDefaults.polySubdivision]
      : subdivisionData[0],
  );
  const polySubdivisionRef = useRef(polySubdivision);
  // emitted from polyrhythm instance
  const [polyBeat, setPolyBeat] = useState(1);

  const defaultPolyBeats = parsedDefaults.polyBeatState
    ? parsedDefaults.polyBeatState
    : new Array(
        parseInt(polyBeatCount.value) /
          Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
      ).fill(1);

  const [totalPolyBeats, setTotalPolyBeats] =
    useState<BeatState[]>(defaultPolyBeats);
  const totalPolyBeatsRef = useRef<BeatState[]>(defaultPolyBeats);

  //beat sound state
  const defaultPolyBeatSounds = parsedDefaults.polyBeatSound
    ? parsedDefaults.polyBeatSound
    : (new Array(defaultPolyBeats.length).fill([Sound.HiHat]) as Sound[][]);
  const [polySounds, setPolySounds] = useState<Sound[][]>(
    defaultPolyBeatSounds,
  );
  /**
   * ++++++++++
   * App State
   * ++++++++++
   */
  const [usePolyrhythm, setUsePolyrhythm] = useState(
    parsedDefaults.usePoly ? parsedDefaults.usePoly : false,
  );
  const [selectedSetting, setSelectedSetting] = useState('metronome');
  const [tab, setTab] = useState(0);
  const [primaryBeatState, setPrimaryBeatState] = useState(false);
  const [polyBeatState, setPolyBeatState] = useState(false);

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
      const conductor = new Conductor({ audioCtx, bpm: defaultBpm });
      loadSounds(audioCtx); // load and forget

      return conductor;
    };
    // conductor event callbacks
    const updateIsRunning = (state: boolean) => setIsRunning(state);
    const updateBPM = (newBPM: number) => {
      if (newBPM !== bpmRef.current) {
        setBPM(newBPM);
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
        setCurrentBeat(beat);
      };
      const updateTotalBeatChange = (
        totalBeats: number,
      ): BeatState[] | null => {
        if (totalBeats === parseInt(beatCountRef.current.value)) return null;

        const newBeatCount = getBeatCount(totalBeats);
        const newBeatState = getBeatState(
          totalBeats,
          subdivisionRef.current.value,
        );

        beatCountRef.current = newBeatCount;
        setBeatCount(newBeatCount);
        setBeatCountGhost(null);

        totalBeatsRef.current = newBeatState;
        setTotalBeats(newBeatState);

        return newBeatState;
      };

      const baseSubdivision = getSubdivision(subdivision.value);
      const baseBeatCount = parseInt(beatCount.value);
      const baseBeatState = totalBeatsRef.current;
      const baseSound = new SoundPlayer({
        audioCtx: conductor.current.audioCtx,
        frequency: frequencyData.frequency,
        beatOneOffset: frequencyData.beatOneOffset,
        subdividedOffset: frequencyData.subdividedOffset,
        gain: frequencyData.gain,
        type: PlayerType.Sound,
        sound: Sound.Kick,
      });

      const baseRhythm = new Rhythm({
        subdivision: baseSubdivision,
        beats: baseBeatCount,
        state: baseBeatState,
        sound: baseSound,
        sounds,
      });

      // // handle new rhythms when poly rhythm
      // // has a pending beat change so rhythms
      // // are synced on beat 1
      // const pendingBeatChange =
      //   conductor.current.getRhythm(1)?.pendingBeatChange;

      conductor.current.addRhythm(baseRhythm);

      // if (pendingBeatChange) {
      //   baseRhythm.updateBeats(pendingBeatChange, isRunningRef.current, 'base');
      // }

      baseRhythm.on('beatChange', updateBeatChange);
      baseRhythm.on('updatedBeats', (updatedBeats: number) => {
        const state = updateTotalBeatChange(updatedBeats);
        if (state) {
          baseRhythm.resetState(state);
        }
      });
    }

    if (usePolyrhythm && conductor.current.numberOfRhythms !== 2) {
      // poly rhythm event callbacks
      const updateBeatChange = (beat: number) => {
        setPolyBeat(beat);
      };
      const updateTotalBeatChange = (
        totalBeats: number,
      ): BeatState[] | null => {
        const newBeatCount = getBeatCount(totalBeats);
        const newBeatState = getBeatState(
          totalBeats,
          polySubdivisionRef.current.value,
        );

        setPolyBeatCountGhost(null);
        setPolyBeatCount(newBeatCount);
        setTotalPolyBeats(newBeatState);

        return newBeatState;
      };

      const polySound = new SoundPlayer({
        audioCtx: conductor.current.audioCtx,
        frequency: polyFrequencyData.frequency,
        beatOneOffset: polyFrequencyData.beatOneOffset,
        subdividedOffset: polyFrequencyData.subdividedOffset,
        gain: polyFrequencyData.gain,
        type: PlayerType.Oscillator,
        sound: null,
      });
      const polySub = getSubdivision(polySubdivision.value);
      const polyState = totalPolyBeatsRef.current;
      const polyBeat = parseInt(beatCount.value);
      const polyTotalBeats = parseInt(polyBeatCount.value);

      const polyRhythm = new Rhythm({
        subdivision: polySub,
        sound: polySound,
        beats: polyBeat,
        poly: polyTotalBeats,
        state: polyState,
        sounds: polySounds,
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

      polyRhythm.on('updatedBeats', (updatedBeats: number) => {
        const newBeatState = updateTotalBeatChange(updatedBeats);
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
    defaultBpm,
    sounds,
    polySounds,
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

      // logging block state
      const block: RhythmBlock = {
        id: '1',
        bpm,
        measures: 1,
        subdivision,
        beats: beatCount,
        usePoly: usePolyrhythm,
        state: totalBeats,
        sounds,
        polyBeats: polyBeatCount,
        polySubdivision,
        polyState: totalPolyBeats,
        polySounds,
      };

      console.log('BLOCK: ', block);
      requestWakeLock();
    }
  }

  function updateSubdivision(value: string): void {
    const newSubdivision =
      subdivisionData.find((s) => s.value === value) || subdivisionData[0];

    const newBeatState = getBeatState(
      parseInt(beatCount.value),
      newSubdivision.value,
    );

    const newSounds = getBeatSoundState(
      newBeatState.length,
      sounds,
      Sound.Oscillator,
    );

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);
      rhythm.resetState(newBeatState); // updates rhythm state
      rhythm.setSubdivision(getSubdivision(newSubdivision.value));
      rhythm.updateSounds(newSounds);
    }

    totalBeatsRef.current = newBeatState; // used in useEffect
    setTotalBeats(newBeatState); // updates UI
    setSubdivision(newSubdivision);
    setSounds(newSounds);
    subdivisionRef.current = newSubdivision;
  }

  function updatePolySubdivision(value: string): void {
    const newSubdivision =
      subdivisionData.find((s) => s.value === value) || subdivisionData[0];

    const newBeatState = getBeatState(
      parseInt(polyBeatCount.value),
      newSubdivision.value,
    );

    const newSounds = getBeatSoundState(newBeatState.length, polySounds);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      rhythm.resetState(newBeatState); // updates rhythm state
      rhythm.setSubdivision(getSubdivision(newSubdivision.value));
      rhythm.updateSounds(newSounds);
    }

    totalPolyBeatsRef.current = newBeatState; // used in useEffect
    setTotalPolyBeats(newBeatState); // updates UI
    setPolySubdivision(newSubdivision);
    setPolySounds(newSounds);
    polySubdivisionRef.current = newSubdivision;
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
    setSounds(newSounds);
    conductor.current?.updateSounds(newSounds, 0);
  }

  function updatePolyBeatSounds(sound: Sound, index: number): void {
    const newSounds = polySounds.map((s, i) => {
      if (i !== index) return s;
      return s.includes(sound) ? s.filter((v) => v !== sound) : [...s, sound];
    });
    // do not remove last item
    if (newSounds[index].length === 0) newSounds[index].push(sound);
    setPolySounds(newSounds);
    conductor.current?.updateSounds(newSounds, 1);
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
    const updatedBeat = parseInt((beatCountGhost ?? beatCount).value) + update;
    if (updatedBeat < 1 || updatedBeat > 11) return;

    updateBeatCount(updatedBeat.toString());
  }

  function handlePolyBeatCountChange(update: number): void {
    const updatedBeat =
      parseInt((polyBeatCountGhost ?? polyBeatCount).value) + update;
    if (updatedBeat < 1 || updatedBeat > 11) return;

    updatePolyBeatCount(updatedBeat.toString());
  }

  function updateBeatCount(value: string): void {
    const updatedBeatCount = parseInt(value);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);

      conductor.current.updateBeats(updatedBeatCount, null);
      const newBeatCount = getBeatCount(parseInt(value));

      const newBeatState = getBeatState(updatedBeatCount, subdivision.value);

      if (!isRunning) {
        rhythm.resetState(newBeatState);

        beatCountRef.current = newBeatCount;
        totalBeatsRef.current = newBeatState;
        setTotalBeats(newBeatState);
        setBeatCount(newBeatCount);
      } else {
        if (value !== beatCount.value) {
          setBeatCountGhost(newBeatCount);
        }
      }
      // update beat sounds state
      const newSounds = getBeatSoundState(newBeatState.length, sounds);
      rhythm.updateSounds(newSounds);
      setSounds(newSounds);
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

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);

      rhythm.updateBeats(null, updatedBeatCount, isRunning);
      const newBeatCount = getBeatCount(parseInt(value));
      const newBeatState = getBeatState(
        updatedBeatCount,
        polySubdivision.value,
      );
      if (!isRunning) {
        rhythm.resetState(newBeatState);

        setTotalPolyBeats(newBeatState);
        setPolyBeatCount(newBeatCount);
      } else {
        setPolyBeatCountGhost(newBeatCount);
      }
      // update poly beat sounds state
      const newSounds = getBeatSoundState(newBeatState.length, polySounds);
      rhythm.updateSounds(newSounds);
      setPolySounds(newSounds);
    }
  }

  /**
   * +++++++++++
   * Poly Rhythm Toggle
   * +++++++++++
   */
  function updateUsePolyrhythm(usePoly: boolean): void {
    setUsePolyrhythm(usePoly);
    if (!usePoly && selectedSetting === 'polyrhythm') {
      setSelectedSetting('metronome');
    }

    if (!usePoly && conductor.current) {
      conductor.current.getRhythm(1).kill();
      conductor.current.removeRhythm(1);
      // setPolyBeat(1);
    }
  }

  function updateBeatState(state: BeatState[]): void {
    setTotalBeats(state);
    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);
      if (rhythm) {
        rhythm.overwriteState(state);
      }
    }
  }

  function updatePolyBeatState(state: BeatState[]): void {
    setTotalPolyBeats(state);
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
    const state = Math.abs(totalBeats[i] - 1) as BeatState;
    setTotalBeats((prev) => {
      return prev.map((value, index) => (index === i ? state : value));
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
    setTotalPolyBeats((prev) => {
      return prev.map((value, index) => (index === i ? state : value));
    });

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      rhythm.updateState(i, state);
    }
  };

  // move to hook
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      if (conductor.current) {
        conductor.current.stop();
      }
      releaseWakeLock();
    }
  });

  /**
   * ++++++++++++++++++++++++++
   * Library Rhythms
   * ++++++++++++++++++++++++++
   */

  const setLibraryRhythm = (rhythm: Rhythms): void => {
    const preset = RhythmsData[rhythm];

    if (isRunning && preset.beats !== beatCount) {
      toggleMetronome();
    }
    // beat count update
    updateBeatCount(preset.beats.value);

    // subdivision update
    updateSubdivision(preset.subdivision.value);

    // poly updates -- silence for now
    if (usePolyrhythm) {
      updateUsePolyrhythm(preset.usePoly);
    }
    // bpm updates
    bpmRef.current = preset.bpm;
    setBPM(preset.bpm);
    updateBPM(bpmRef.current);

    // state updates
    setTotalBeats(preset.state);
    totalBeatsRef.current = preset.state;
    conductor.current?.getRhythm(0).resetState(preset.state);
  };

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
          currentBeat={currentBeat}
          polyrhythm={parseInt(polyBeatCount.value)}
          polyBeat={polyBeat}
          usePoly={usePolyrhythm}
          togglePlayback={toggleMetronome}
          updateBPM={updateBPM}
          subdivision={
            Subdivisions[subdivision.value as keyof typeof Subdivisions]
          }
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
        <Tabs.Tab label={<BeatGridSettings />}>
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
                  disabled={(beatCountGhost ?? beatCount).value === '11'}
                  className="ml-2 color-white"
                  onClick={() => handleBeatCountChange(1)}
                >
                  &#43;
                </button>
              </div>
            </section>

            {/* Subdivision */}
            <section className="flex width-100 space-between align-center">
              <div className="text-light font-size-13 text-left flex-1">
                subdivision
              </div>
              <div className="flex flex-1">
                <Dropdown
                  variant="full"
                  data={subdivisionData}
                  currentValue={subdivision}
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
                  beats={beatCount}
                  disabled={false}
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
                      (polyBeatCountGhost ?? polyBeatCount).value === '11'
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
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light font-size-13 flex-1 text-left">
                  subdivision
                </div>
                <div className="flex flex-1">
                  <Dropdown
                    variant="full"
                    data={subdivisionData}
                    currentValue={polySubdivision}
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
                  beats={polyBeatCount}
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
        <Tabs.Tab label={<SoundSettings />}>
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

        <Tabs.Tab label={<LibrarySettings />}>
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
        </Tabs.Tab>
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
