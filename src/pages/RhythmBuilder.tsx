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
import toWav from 'audiobuffer-to-wav';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import ExportIcon from '../assets/icons/export.svg?react';
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
import { generateUUID, getBeatSoundState } from '../services/rhythm.services';
import { loadSounds } from '../services/sound.services';
import { Conductor } from '../timing_engine/conductor';
import { type WorkflowEmit } from '../timing_engine/conductor.types';
import { SoundPlayer } from '../timing_engine/oscillator';
import { PlayerType, Sound } from '../timing_engine/oscillator.types';
import { type BeatState } from '../timing_engine/rhythm.types';

export default function RhythmBuilder() {
  const {
    rhythmWorkflow,
    addBlock,
    updateBlockOrder,
    getAverageTempo,
    getTotalMeasures,
    getWorkflowTimeStr,
    getWorkflowTimeInt,
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

  const getSectionRunFlags = (i: number) => {
    const block = rhythmWorkflow.blocks[i];
    const prev = rhythmWorkflow.blocks[i - 1];
    const next = rhythmWorkflow.blocks[i + 1];
    const hasSection = block.section.label !== 'None';

    const sameAsPrev =
      hasSection && !!prev && prev.section.value === block.section.value;
    const sameAsNext =
      hasSection && !!next && next.section.value === block.section.value;

    return {
      hasSection,
      showLabel: hasSection && !sameAsPrev,
      continueLeft: sameAsPrev,
      continueRight: sameAsNext,
    };
  };

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
  const audioCtx = useRef<AudioContext | null>(null);
  const [audioCtxReady, setAudioCtxReady] = useState<AudioContext | null>(null);

  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowEmit | null>(
    null,
  );

  useEffect(() => {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
      loadSounds(audioCtx.current);
      setAudioCtxReady(audioCtx.current);
    }

    return () => {
      if (conductor.current) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
        audioCtx.current = null;
        setAudioCtxReady(null);
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
      setActiveWorkflow(null);
      setCardAudioId(null);
      if (!audioCtx.current) return;

      conductor.current = new Conductor({
        audioCtx: audioCtx.current,
        bpm: rhythmWorkflow.blocks[0].bpm,
        workflow: rhythmWorkflow.blocks,
      });

      requestAnimationFrame(() => {
        if (!conductor.current) return;
        conductor.current.initialize();
        conductor.current.start();
      });

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
    const block = rhythmWorkflow.blocks.find((block) => block.id === id);
    const index = rhythmWorkflow.blocks.findIndex((block) => block.id === id);
    // card is playing audio, so kill global audio if running
    if (isPlayingState) {
      if (conductor.current && isPlaying) {
        conductor.current.stop();
        conductor.current.removeAllListeners();
        setIsPlaying(false);
      }
      if (block) {
        // global audio is playing
        // and the card currently active
        // in global context is playing is pressed
        if (activeWorkflow?.id === id) {
          setCardAudioId(null);
          setActiveWorkflow(null);
        }

        requestAnimationFrame(() => {
          setCardAudioId(id);
          setActiveWorkflow({
            id,
            index,
            bpm: block.bpm,
            measures: block.measures,
            beats: +block.beats.value,
          });
        });
      }
    } else {
      setCardAudioId(null);
      setActiveWorkflow(null);
    }
  };

  const exportWorkflow = async (): Promise<void> => {
    setIsLoading(true);
    toast('exporting workflow to .wav');
    const sampleRate = 44100;
    const tail = 0.5;
    const leadIn = 0.01; // room for the oscillator attack ramp
    const totalSeconds = getWorkflowTimeInt() * 60; // totalTime() is in minutes
    const length = Math.ceil((leadIn + totalSeconds + tail) * sampleRate);
    const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
    const gain = offlineCtx.createGain();
    gain.connect(offlineCtx.destination);

    const osc1 = new SoundPlayer({
      audioCtx: offlineCtx,
      outputNode: gain,
      frequency: 750,
      beatOneOffset: 3,
      subdividedOffset: -3,
      gain: 0.5,
      type: PlayerType.Sound,
      sound: Sound.Kick,
    });

    const osc2 = new SoundPlayer({
      audioCtx: offlineCtx,
      outputNode: gain,
      frequency: 550,
      beatOneOffset: 3,
      subdividedOffset: -3,
      gain: 0.5,
      type: PlayerType.Sound,
      sound: Sound.Kick,
    });

    const buildTickGrid = (subs: number[]): number[] => {
      const grid: number[] = [];
      subs.forEach((sub, beatIndex) => {
        const ticks = Math.round(1 / sub);
        for (let i = 0; i < ticks; i++) {
          const value = beatIndex + 1 + i * sub;
          const rounded = Math.round(value);
          grid.push(Math.abs(rounded - value) < 1e-12 ? rounded : value);
        }
      });
      return grid;
    };

    const scheduleRhythm = (
      player: SoundPlayer,
      blockStart: number,
      measures: number,
      spb: number,
      beats: number,
      poly: number,
      subs: number[],
      state: BeatState[],
      sounds: Sound[][],
    ): void => {
      const grid = buildTickGrid(subs);
      const measureLen = beats * spb;
      const beatLen = spb * (beats / poly);

      for (let m = 0; m < measures; m++) {
        const measureStart = blockStart + m * measureLen;
        grid.forEach((beat, step) => {
          if (!state[step]) return;
          const t = measureStart + (beat - 1) * beatLen;
          player.play(t, beat === 1, !Number.isInteger(beat), sounds[step]);
        });
      }
    };

    let blockStart = leadIn;
    for (const block of rhythmWorkflow.blocks) {
      const beats = Number(block.beats.value);
      const spb = 60 / block.bpm;

      scheduleRhythm(
        osc1,
        blockStart,
        block.measures,
        spb,
        beats,
        beats,
        block.subdivisions,
        block.state,
        block.sounds,
      );

      if (block.usePoly) {
        scheduleRhythm(
          osc2,
          blockStart,
          block.measures,
          spb,
          beats,
          Number(block.polyBeats.value),
          block.polySubdivisions,
          block.polyState,
          getBeatSoundState(
            block.polyState.length,
            block.polySounds,
            Sound.Oscillator,
          ),
        );
      }

      blockStart += block.measures * beats * spb;
    }

    const rendered = await offlineCtx.startRendering();
    const blob = new Blob([toWav(rendered)], { type: 'audio/wav' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rhythmWorkflow.name || 'rhythm'}.wav`;
    a.click();
    URL.revokeObjectURL(url);
    setIsLoading(false);
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
              {getWorkflowTimeStr()} min
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

      <section className="flex justify-center align-center f-gap4">
        <TextInput
          placeholder="untitled workflow"
          text={rhythmWorkflow.name}
          onChange={(value) => updateWorkflowInput(value)}
        />
        <button
          disabled={isLoading || !hasChange}
          className="color-white outline"
          onClick={() => save()}
        >
          <SaveIcon style={{ width: '18px' }} />
        </button>

        <button
          className="color-white outline"
          onClick={() => exportWorkflow()}
          disabled={isLoading}
        >
          <ExportIcon style={{ width: '18px' }} />
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
              {rhythmWorkflow.blocks.map((block, i) => {
                const { hasSection, showLabel, continueLeft, continueRight } =
                  getSectionRunFlags(i);

                return (
                  <section key={block.id}>
                    {hasSection ? (
                      <section className="block-section">
                        <div className="block-section-label">
                          {showLabel ? block.section.label : ' '}
                        </div>
                        <div
                          style={{ backgroundColor: block.section.color }}
                          className={`block-section-bar ${continueLeft ? 'continue-left' : ''} ${continueRight ? 'continue-right' : ''}`}
                        ></div>
                      </section>
                    ) : (
                      <section className="block-section">
                        <div className="block-section-label"></div>
                        <div
                          style={{ backgroundColor: '#4d4d4d' }}
                          className={`block-section-bar`}
                        ></div>
                      </section>
                    )}

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
                      audioCtx={audioCtxReady}
                    />
                  </section>
                );
              })}
            </SortableContext>
          </DndContext>
          <AddVerticalButton ref={addBlockBtn} onClick={addNewBlock} />
        </div>
      </section>
    </>
  );
}
