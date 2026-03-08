import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import PauseIcon from '../assets/icons/pause.svg?react';
import PlayIcon from '../assets/icons/play.svg?react';
import SaveIcon from '../assets/icons/save.svg?react';
import AddVerticalButton from '../components/Buttons/AddVertical';
import RhythmBuilderCard from '../components/Cards/RhythmBuilderCard';
import TextInput from '../components/TextInput';
import { DefaultRhythmBlock } from '../context/BuilderContext.types';
import { useRhythmBuilderContext } from '../context/useBuilderContext';
import { useIndexedDBContext } from '../context/useIndexedDBContext';
import '../css/RhythmBuilder.css';
import { generateUUID } from '../services/rhythm.services';
import { Conductor } from '../timing_engine/conductor';
import { type WorkflowEmit } from '../timing_engine/conductor.types';

export default function RhythmBuilder() {
  const {
    rhythmWorkflow,
    addBlock,
    updateBlockOrder,
    getAverageTempo,
    getTotalMeasures,
    getWorkflowTime,
    updateWorkflowName,
  } = useRhythmBuilderContext();

  const { saveWorkflow } = useIndexedDBContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardAudioId, setCardAudioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChange, setHasChange] = useState(false);
  const addBlockBtn = useRef<HTMLDivElement | null>(null);

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  const save = async (): Promise<void> => {
    setIsLoading(true);

    const response = await saveWorkflow(rhythmWorkflow);
    if (response.error) {
      console.log('got an error: ', response.error);
    }

    setIsLoading(false);
    setHasChange(false);
    toast('workflow saved');
  };

  const addNewBlock = (): void => {
    setHasChange(true);
    const newBlock = { ...DefaultRhythmBlock };
    newBlock.id = generateUUID();

    addBlock(newBlock);

    requestAnimationFrame(() => {
      if (!addBlockBtn.current) return;

      addBlockBtn.current?.scrollIntoView({
        behavior: 'smooth',
        inline: 'end',
        block: 'nearest',
      });
    });
  };

  const ids = useMemo(
    () => rhythmWorkflow.blocks.map((block) => block.id),
    [rhythmWorkflow],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    updateBlockOrder(active, over);
  };

  const conductor = useRef<Conductor | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowEmit | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (conductor.current) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
      }
    };
  }, []);

  const playWorkflow = (): void => {
    if (isPlaying) {
      if (conductor.current) {
        conductor.current.stop();
        conductor.current.removeRhythms();
        setActiveWorkflow(null);
      }
    } else {
      setCardAudioId(null);
      const audioCtx = new AudioContext();
      conductor.current = new Conductor({
        audioCtx,
        bpm: rhythmWorkflow.blocks[0].bpm,
        workflow: rhythmWorkflow.blocks,
      });

      conductor.current.initialize();
      conductor.current.start();

      conductor.current.on('workflowBlock', (workflow: WorkflowEmit) => {
        setActiveWorkflow(workflow);
      });
    }

    setIsPlaying(!isPlaying);
  };

  const updateWorkflowInput = (name: string): void => {
    setHasChange(true);
    updateWorkflowName(name);
  };

  const updateGlobalPlayback = (id: string, isPlayingState: boolean) => {
    // card is playing audio, so kill global audio if running
    if (isPlayingState) {
      if (conductor.current && isPlaying) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
        setIsPlaying(false);
        setActiveWorkflow(null);
      }
      setCardAudioId(id);
    } else {
      setCardAudioId(null);
    }
  };

  const progressBarStyles = activeWorkflow
    ? ({
        '--animationLength': `${(
          (activeWorkflow.beats * activeWorkflow.measures * 60) /
          activeWorkflow.bpm
        ).toString()}s`,
      } as React.CSSProperties)
    : undefined;
  return (
    <>
      {/* rhythm builder overview */}
      <section className="builder-header">
        <div className="builder-header__inner flex align-center f-gap4">
          <div>
            <span className="color-extra-light-gray font-size-15 font-weight-600">
              Blocks
            </span>{' '}
            <span className="font-size-16 font-weight-600">
              {rhythmWorkflow.blocks.length}
            </span>
          </div>
          <div>
            <span className="color-extra-light-gray font-size-15 font-weight-600">
              Measures
            </span>{' '}
            <span className="font-size-16 font-weight-600">
              {getTotalMeasures()}
            </span>
          </div>
          <div>
            <span className="color-extra-light-gray font-size-15 font-weight-600">
              Avg BPM
            </span>{' '}
            <span className="font-size-16 font-weight-600">
              {getAverageTempo()}
            </span>
          </div>
          <div>
            <span className="color-extra-light-gray font-size-15 font-weight-600">
              Time
            </span>{' '}
            <span className="font-size-16 font-weight-600">
              {getWorkflowTime()} min
            </span>
          </div>
          <div>
            <button onClick={() => playWorkflow()} className="small filled">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        </div>
      </section>

      {/* measure/bpm overview */}
      <section className="builder-subheader">
        <section className="sequence-bar-container">
          {rhythmWorkflow.blocks.map((block) => (
            <div
              className={`sequence-bar ${block.usePoly ? 'poly' : ''}`}
              key={block.id}
            >
              <span
                className={`${activeWorkflow?.id === block.id ? 'active ' : ''}progress`}
                style={progressBarStyles}
              ></span>
              {block.bpm}
            </div>
          ))}
        </section>
        <section className="sequence-bar-description">
          <div className="font-size-12">start</div>
          <div className="font-size-12">{getTotalMeasures()} measures</div>
          <div className="font-size-12">end</div>
        </section>
      </section>

      <section className="flex flex-1 justify-center align-center f-gap4">
        <TextInput
          placeholder="untitled workflow"
          text={rhythmWorkflow.name}
          onChange={(value) => updateWorkflowInput(value)}
        />
        <button
          disabled={isLoading || !hasChange}
          className="color-white"
          onClick={() => save()}
        >
          <SaveIcon style={{ width: '18px' }} />
        </button>
      </section>

      <section ref={scrollableContainerRef} className="builder-card-container">
        <div className="builder-card-inner-container">
          <DndContext
            sensors={sensors}
            onDragEnd={onDragEnd}
            collisionDetection={closestCenter}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          >
            <SortableContext
              items={ids}
              strategy={horizontalListSortingStrategy}
            >
              {rhythmWorkflow.blocks.map((block, i) => (
                <RhythmBuilderCard
                  onChange={() => setHasChange(true)}
                  onTogglePlayback={(id, playingState) =>
                    updateGlobalPlayback(id, playingState)
                  }
                  block={block}
                  key={block.id}
                  showDelete={i !== 0}
                  index={i}
                  cardAudioId={cardAudioId}
                />
              ))}
            </SortableContext>
          </DndContext>
          <AddVerticalButton ref={addBlockBtn} onClick={addNewBlock} />
        </div>
      </section>
    </>
  );
}
