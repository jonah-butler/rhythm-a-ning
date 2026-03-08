import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import DragIcon from '../../assets/icons/drag.svg?react';
import PauseIcon from '../../assets/icons/pause.svg?react';
import PlayIcon from '../../assets/icons/play.svg?react';
import TrashIcon from '../../assets/icons/trash.svg?react';
import { type RhythmBlock } from '../../context/BuilderContext.types';
import { useRhythmBuilderContext } from '../../context/useBuilderContext';
import '../../css/RhythmBuilderCard.css';
import { beatCountData, subdivisionData } from '../../data';
import { getBeatState, sanitizeOption } from '../../services/rhythm.services';
import { Conductor } from '../../timing_engine/conductor';
import Dropdown from '../Dropdown';
import NumberInput from '../NumberInput';
import RhythmState from '../RhythmState';
import Toggle from '../Toggle';

type RhythmBuilderCardProps = {
  block: RhythmBlock;
  showDelete?: boolean;
  index: number;
  cardAudioId: string | null;
  onChange: () => void;
  onTogglePlayback: (id: string, isPlaying: boolean) => void;
};

export default function RhythmBuilderCard({
  block,
  showDelete = true,
  index,
  onChange,
  onTogglePlayback,
  cardAudioId,
}: RhythmBuilderCardProps) {
  const { updateBlock, deleteBlock } = useRhythmBuilderContext();
  const [showBeatState, setBeatState] = useState(false);
  const [showPolyBeatState, setPolyBeatState] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (cardAudioId !== block.id) {
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
    width: 180,
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

  const updateSubdivision = (newSubdivision: string, isPoly = false): void => {
    const subdivision = subdivisionData.find(
      (sub) => sub.value === newSubdivision,
    );

    if (isPoly) {
      if (subdivision) {
        const newState = getBeatState(
          Number(block.polyBeats.value),
          subdivision.value,
        );

        updateBlock(block.id, {
          polySubdivision: sanitizeOption(subdivision),
          polyState: newState,
        });
      }
    } else {
      if (subdivision) {
        const newState = getBeatState(
          Number(block.beats.value),
          subdivision.value,
        );
        updateBlock(block.id, {
          subdivision: sanitizeOption(subdivision),
          state: newState,
        });
      }
    }

    onChange();
  };

  const updateBeats = (newBeats: string, isPoly = false): void => {
    const beats = beatCountData.find((beat) => beat.value === newBeats);

    if (isPoly) {
      const polyState = getBeatState(
        Number(beats?.value),
        block.polySubdivision.value,
      );
      updateBlock(block.id, { polyBeats: beats, polyState });
    } else {
      const state = getBeatState(Number(beats?.value), block.subdivision.value);
      updateBlock(block.id, { beats, state });
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
    } else {
      const audioCtx = new AudioContext();
      conductor.current = new Conductor({
        audioCtx,
        bpm: block.bpm,
        workflow: [block],
      });

      conductor.current.initialize();
      conductor.current.start();
    }

    onTogglePlayback(block.id, !isPlaying);
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={cardStyle}
      className="rhythm-builder-card"
    >
      <section className="flex action-row">
        <div className="drag-container">
          <DragIcon
            {...listeners}
            className="drag-icon"
            style={{ width: '18px', marginRight: '0.25rem' }}
          />
          <span>Block {index + 1}</span>
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
        {showDelete ? (
          <div>
            <TrashIcon
              onClick={() => deleteCardBlock()}
              className="trash-icon"
              style={{ width: '16px' }}
            />
          </div>
        ) : null}
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
          <div className="flex flex-1">
            <Dropdown
              variant="full"
              data={subdivisionData}
              currentValue={block.subdivision}
              onChange={updateSubdivision}
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
          <section className="flex flex-col width-100 space-between align-center mb-2 f-gap4">
            <RhythmState
              onUpdate={(state) => updateBlock(block.id, { state })}
              beats={block.beats}
              subdivision={block.subdivision}
              disabled={false}
            />
          </section>
        ) : null}

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
              onChange={(usePoly) => updateBlock(block.id, { usePoly })}
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
          <div className="flex flex-1">
            <Dropdown
              variant="full"
              data={subdivisionData}
              currentValue={block.polySubdivision}
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
              beats={block.polyBeats}
              subdivision={block.polySubdivision}
              disabled={!block.usePoly}
            />
          </section>
        ) : null}
      </section>
    </div>
  );
}
