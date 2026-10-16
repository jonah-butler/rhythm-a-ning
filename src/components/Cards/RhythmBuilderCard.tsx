import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState } from 'react';
import CopyIcon from '../../assets/icons/copy.svg?react';
import DragIcon from '../../assets/icons/drag.svg?react';
import ExpandIcon from '../../assets/icons/expand.svg?react';
import PauseIcon from '../../assets/icons/pause.svg?react';
import PlayIcon from '../../assets/icons/play.svg?react';
import TrashIcon from '../../assets/icons/trash.svg?react';
import { type RhythmBlock } from '../../context/BuilderContext.types';
import { useRhythmBuilderContext } from '../../context/useBuilderContext';
import '../../css/RhythmBuilderCard.css';
import { beatCountData } from '../../data';
import {
  buildBeatState,
  generateUUID,
  getBeatSoundState,
} from '../../services/rhythm.services';
import {
  buildDefaultBeatState,
  buildSubdivision,
  calculateTotalBeats,
  getSubdivision,
  getSubdivisionPerBeat,
} from '../../services/subdivision';
import { subdivisionDataWithEmpty } from '../../services/subdivision/data';
import {
  SubdivisionKeyValue,
  type SubdivisionName,
} from '../../services/subdivision/types';
import { Conductor } from '../../timing_engine/conductor';
import { Sound } from '../../timing_engine/oscillator.types';
import Dropdown, { type DropdownOptions } from '../Dropdown';
import NumberInput from '../NumberInput';
import RhythmState from '../RhythmState';
import Toggle from '../Toggle';

type RhythmBuilderCardProps = {
  block: RhythmBlock;
  showDelete?: boolean;
  index: number;
  cardAudioId: string | null;
  audioCtx: AudioContext | null;
  onChange: () => void;
  onTogglePlayback: (id: string, isPlaying: boolean) => void;
};

const buildBeatOptions = (beats: number): DropdownOptions[] => {
  const options: DropdownOptions[] = [{ label: 'all', value: 'all' }];
  for (let i = 1; i <= beats; i++) {
    options.push({ label: `${i}`, value: `${i}` });
  }
  return options;
};

export default function RhythmBuilderCard({
  block,
  showDelete = true,
  index,
  onChange,
  onTogglePlayback,
  audioCtx,
  cardAudioId,
}: RhythmBuilderCardProps) {
  const { updateBlock, deleteBlock, addBlock, sections } =
    useRhythmBuilderContext();
  const [showBeatState, setBeatState] = useState(false);
  const [showPolyBeatState, setPolyBeatState] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const beatOptions = useMemo(
    () => buildBeatOptions(Number(block.beats.value)),
    [block.beats],
  );
  const polyBeatOptions = useMemo(
    () => buildBeatOptions(Number(block.polyBeats.value)),
    [block.polyBeats],
  );

  const [selectedBeat, setSelectedBeat] = useState(beatOptions[1]);
  const [polySelectedBeat, setPolySelectedBeat] = useState(polyBeatOptions[1]);

  const subdivisionPerBeat = useMemo(
    () => getSubdivisionPerBeat(selectedBeat, block.subdivisions),
    [selectedBeat, block.subdivisions],
  );
  const polySubdivisionPerBeat = useMemo(
    () => getSubdivisionPerBeat(polySelectedBeat, block.polySubdivisions),
    [polySelectedBeat, block.polySubdivisions],
  );

  useEffect(() => {
    if (cardAudioId !== block.id && isPlaying) {
      if (conductor.current) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
      }
      setIsPlaying(false);
    }
  }, [cardAudioId]);

  const id = block.id;

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const cardStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: isDragging ? 'rgba(9, 9, 9, 0.4)' : 'rgba(9, 9, 9, 1)',
    flex: '0 0 auto',
  };

  const deleteCardBlock = (): void => {
    if (isPlaying) {
      if (conductor.current) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
      }
    }
    onTogglePlayback(block.id, !isPlaying);
    deleteBlock(block.id);
  };

  const updateSubdivision = (
    sub: SubdivisionName | '',
    isPoly = false,
  ): void => {
    const currentSubs = isPoly ? block.polySubdivisions : block.subdivisions;
    if (sub === '') return;

    const beat = isPoly ? polySelectedBeat : selectedBeat;
    const newSubdivision = getSubdivision(sub);

    let updatedSubdivisions = [...currentSubs];
    if (beat.value === 'all') {
      updatedSubdivisions = updatedSubdivisions.map(() => newSubdivision);
    } else {
      updatedSubdivisions[parseInt(beat.value) - 1] = newSubdivision;
    }

    const newState = buildDefaultBeatState(updatedSubdivisions);

    if (isPoly) {
      const polySounds = getBeatSoundState(
        newState.length,
        block.polySounds,
        Sound.Oscillator,
      );

      updateBlock(block.id, {
        polyState: newState,
        polySounds,
        polySubdivisions: updatedSubdivisions,
      });
    } else {
      const sounds = getBeatSoundState(
        newState.length,
        block.sounds,
        Sound.Oscillator,
      );

      updateBlock(block.id, {
        state: newState,
        sounds,
        subdivisions: updatedSubdivisions,
      });
    }

    onChange();
  };

  const updateBeats = (newBeats: string, isPoly = false): void => {
    const beats = beatCountData.find((beat) => beat.value === newBeats);
    const beatCount = Number(beats?.value);

    if (isPoly) {
      let defaultSub = SubdivisionKeyValue.base;
      if (polySelectedBeat.value === 'all' && polySubdivisionPerBeat.value) {
        defaultSub = getSubdivision(polySubdivisionPerBeat.value);
      }
      if (parseInt(polySelectedBeat.value) > beatCount) {
        setPolySelectedBeat(polyBeatOptions[1]);
      }

      const polySubdivisions = buildSubdivision(
        beatCount,
        block.polySubdivisions,
        defaultSub,
      );
      const polyState = buildBeatState(
        calculateTotalBeats(polySubdivisions),
        block.polyState,
      );
      const polySounds = getBeatSoundState(
        polyState.length,
        block.polySounds,
        Sound.Oscillator,
      );
      updateBlock(block.id, {
        polyBeats: beats,
        polyState,
        polySounds,
        polySubdivisions,
      });
    } else {
      let defaultSub = SubdivisionKeyValue.base;
      if (selectedBeat.value === 'all' && subdivisionPerBeat.value) {
        defaultSub = getSubdivision(subdivisionPerBeat.value);
      }
      if (parseInt(selectedBeat.value) > beatCount) {
        setSelectedBeat(beatOptions[1]);
      }

      const subdivisions = buildSubdivision(
        beatCount,
        block.subdivisions,
        defaultSub,
      );
      const state = buildBeatState(
        calculateTotalBeats(subdivisions),
        block.state,
      );
      const sounds = getBeatSoundState(state.length, block.sounds);

      updateBlock(block.id, { beats, state, sounds, subdivisions });
    }

    onChange();
  };

  const handleSoundChange = (
    sound: Sound,
    index: number,
    isPoly = false,
  ): void => {
    let updatedSounds: Sound[][] = [] as Sound[][];
    if (isPoly) {
      updatedSounds = block.polySounds.map((s, i) => {
        if (i !== index) return s;
        return s.includes(sound) ? s.filter((v) => v !== sound) : [...s, sound];
      });
    } else {
      updatedSounds = block.sounds.map((s, i) => {
        if (i !== index) return s;
        return s.includes(sound) ? s.filter((v) => v !== sound) : [...s, sound];
      });
    }
    if (updatedSounds[index].length === 0) updatedSounds[index].push(sound);

    if (isPoly) {
      updateBlock(block.id, { polySounds: updatedSounds });
    } else {
      updateBlock(block.id, { sounds: updatedSounds });
    }

    onChange();
  };

  const conductor = useRef<Conductor | null>(null);

  const togglePlayback = () => {
    if (isPlaying) {
      if (conductor.current) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
      }

      onTogglePlayback(block.id, !isPlaying);
    } else {
      if (!audioCtx) return;
      onTogglePlayback(block.id, !isPlaying);

      conductor.current = new Conductor({
        audioCtx,
        bpm: block.bpm,
        workflow: [block],
      });

      conductor.current.initialize();
      conductor.current.start();
    }

    setIsPlaying(!isPlaying);
  };

  const copyBlock = (): void => {
    const name = block.name ? `${block.name} copy` : `Block ${index + 1} copy`;
    addBlock({ ...block, id: generateUUID(), name });
  };

  const updateSection = (value: string): void => {
    const section = sections.find((s) => s.value === value);
    updateBlock(block.id, { section });
  };

  const updateBlockName = (name: string): void => {
    updateBlock(block.id, { name });
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={cardStyle}
      className={`rhythm-builder-card ${isPlaying ? 'active' : ''} ${expanded ? 'expanded' : ''}`}
    >
      <section className="flex action-row">
        <div className="drag-container mr-4">
          <DragIcon
            {...listeners}
            className="drag-icon"
            style={{ width: '18px', marginRight: '0.25rem' }}
          />
          <span>
            <input
              placeholder={`Block ${index + 1}`}
              className="input-text"
              value={block.name}
              onChange={(e) => updateBlockName(e.target.value)}
            ></input>
          </span>
          <div className="audio-controls-container">
            {isPlaying ? (
              <button onClick={togglePlayback} className="sm-padding">
                <PauseIcon style={{ width: '15px' }} />
              </button>
            ) : (
              <button onClick={togglePlayback} className="sm-padding">
                <PlayIcon style={{ width: '15px' }} />
              </button>
            )}
          </div>
        </div>
        <section className="flex align-center f-gap4">
          <div>
            <CopyIcon
              onClick={copyBlock}
              className="hover-icon"
              style={{ width: '16px' }}
            />
          </div>
          <div>
            <ExpandIcon
              onClick={() => setExpanded(!expanded)}
              className="hover-icon"
              style={{ width: '16px' }}
            />
          </div>
          {showDelete ? (
            <div>
              <TrashIcon
                onClick={() => deleteCardBlock()}
                className="hover-icon"
                style={{ width: '16px' }}
              />
            </div>
          ) : null}
        </section>
      </section>

      <section>
        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1">BPM</div>
          <div className="flex flex-1">
            <NumberInput
              number={block.bpm}
              onClick={(number) => updateBlock(block.id, { bpm: number })}
              min={20}
              max={250}
            />
          </div>
        </section>

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1">
            measures
          </div>
          <div className="flex flex-1">
            <NumberInput
              number={block.measures}
              onClick={(number) => updateBlock(block.id, { measures: number })}
            />
          </div>
        </section>

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1">
            subdivision
          </div>
          <div className="flex flex-1 f-gap4">
            <Dropdown
              variant="small"
              data={beatOptions}
              currentValue={selectedBeat}
              onChange={(value) => {
                const option = beatOptions.find(
                  (option) => option.value === value,
                );
                if (option) {
                  setSelectedBeat(option);
                }
              }}
            />
            <Dropdown
              variant="small"
              data={subdivisionDataWithEmpty}
              currentValue={subdivisionPerBeat}
              onChange={(value) => updateSubdivision(value)}
            />
          </div>
        </section>

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1">beats</div>
          <div className="flex flex-1">
            <Dropdown
              variant="full"
              data={beatCountData}
              currentValue={block.beats}
              onChange={updateBeats}
            />
          </div>
        </section>

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1">
            beat state
          </div>
          <div className="flex flex-1">
            <button
              onClick={() => setBeatState(!showBeatState)}
              className="filled small full"
            >
              {showBeatState ? 'close' : 'modify'}
            </button>
          </div>
        </section>

        {showBeatState ? (
          <section
            className={`state-container flex flex-col width-100 space-between align-center mb-2 f-gap4 ${expanded ? 'expanded' : ''}`}
          >
            <RhythmState
              onUpdate={(state) => updateBlock(block.id, { state })}
              subdivisions={block.subdivisions}
              disabled={false}
              state={block.state}
              size="sm"
              sounds={block.sounds}
              onSoundChange={(s, i) => handleSoundChange(s, i)}
            />
          </section>
        ) : null}

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1">
            section
          </div>
          <div className="flex flex-1">
            <Dropdown
              variant="full"
              data={sections}
              currentValue={block.section}
              onChange={updateSection}
            />
          </div>
        </section>

        <section className="flex width-100 space-between align-center mb-2">
          <div className="flex flex-col text-left">
            <div className="text-light font-size-13 text-left flex-1">
              polyrhythm
            </div>
          </div>
          <div className="flex">
            <Toggle
              label=""
              variant="small"
              isChecked={block.usePoly}
              onChange={(usePoly) => {
                updateBlock(block.id, { usePoly });
                onChange();
              }}
            />
          </div>
        </section>

        <hr />

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1 color-pink-purple">
            beats
          </div>
          <div className="flex flex-1">
            <Dropdown
              variant="full"
              data={beatCountData}
              currentValue={block.polyBeats}
              onChange={(value) => updateBeats(value, true)}
              disabled={!block.usePoly}
            />
          </div>
        </section>

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 color-pink-purple text-left flex-1">
            subdivision
          </div>
          <div className="flex flex-1 f-gap4">
            <Dropdown
              variant="small"
              data={polyBeatOptions}
              currentValue={polySelectedBeat}
              onChange={(value) => {
                const option = polyBeatOptions.find(
                  (option) => option.value === value,
                );
                if (option) {
                  setPolySelectedBeat(option);
                }
              }}
              disabled={!block.usePoly}
            />
            <Dropdown
              variant="small"
              data={subdivisionDataWithEmpty}
              currentValue={polySubdivisionPerBeat}
              onChange={(value) => updateSubdivision(value, true)}
              disabled={!block.usePoly}
            />
          </div>
        </section>

        <section className="flex width-100 space-between align-center mb-2">
          <div className="text-light font-size-13 text-left flex-1">
            poly state
          </div>
          <div className="flex flex-1">
            <button
              disabled={!block.usePoly}
              onClick={() => setPolyBeatState(!showPolyBeatState)}
              className="filled small full"
            >
              {showPolyBeatState ? 'close' : 'modify'}
            </button>
          </div>
        </section>

        {showPolyBeatState ? (
          <section className="flex flex-col width-100 space-between align-center mb-2 f-gap4">
            <RhythmState
              onUpdate={(state) => updateBlock(block.id, { polyState: state })}
              subdivisions={block.polySubdivisions}
              disabled={!block.usePoly}
              state={block.polyState}
              size="sm"
              sounds={block.polySounds}
              onSoundChange={(s, i) => handleSoundChange(s, i, true)}
            />
          </section>
        ) : null}
      </section>
    </div>
  );
}
