import type { Active, Over } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useMemo, useState, type ReactNode } from 'react';
import { RhythmBuilderContext } from './BuilderContext';
import {
  DefaultRhythmBlock,
  DefaultRhythmWorkflowFactory,
  type PolyState,
  type RhythmBlock,
  type Section,
} from './BuilderContext.types';
import { type RhythmBlockStore } from './IndexedDB.types';
import { averageTempo, totalMeasures, totalTime } from './builder.helpers';

export function RhythmBuilderProvider({ children }: { children: ReactNode }) {
  const [rhythmWorkflow, setRhythmWorkflow] = useState<RhythmBlockStore>({
    ...DefaultRhythmWorkflowFactory(),
  });

  const setActiveBlocks = (workflow: RhythmBlockStore): void => {
    setRhythmWorkflow(workflow);
  };

  const updateBlock = (id: string, patch: Partial<RhythmBlock | PolyState>) => {
    const blocks = rhythmWorkflow.blocks.map((block) =>
      block.id === id ? { ...block, ...patch } : block,
    );
    setRhythmWorkflow((prev) => (prev ? { ...prev, blocks } : prev));
  };

  const updateWorkflowName = (name: string) => {
    setRhythmWorkflow((prev) => ({ ...prev, name }));
  };

  const addBlock = (block: RhythmBlock): void => {
    const updated = [...rhythmWorkflow.blocks, block];
    setRhythmWorkflow((prev) => ({ ...prev, blocks: updated }));
  };

  const resetBlocks = (): void => {
    setRhythmWorkflow((prev) => ({ ...prev, blocks: [DefaultRhythmBlock] }));
  };

  const resetWorkflow = (): void => {
    setRhythmWorkflow(DefaultRhythmWorkflowFactory());
  };

  const updateBlockOrder = (active: Active, over: Over): void => {
    const oldIndex = rhythmWorkflow.blocks.findIndex((x) => x.id === active.id);
    const newIndex = rhythmWorkflow.blocks.findIndex((x) => x.id === over.id);
    const updatedBlocks = arrayMove(rhythmWorkflow.blocks, oldIndex, newIndex);
    setRhythmWorkflow((prev) => ({ ...prev, blocks: updatedBlocks }));
  };

  const getTotalMeasures = (): number => {
    return totalMeasures(rhythmWorkflow.blocks);
  };

  const getAverageTempo = (): number => {
    return averageTempo(rhythmWorkflow.blocks);
  };

  const getWorkflowTime = (): string => {
    return totalTime(rhythmWorkflow.blocks);
  };

  const deleteBlock = (id: string) => {
    const filtered = rhythmWorkflow.blocks.filter((block) => block.id !== id);
    setRhythmWorkflow((prev) => ({ ...prev, blocks: filtered }));
  };

  const addSection = (section: Section): void => {
    setRhythmWorkflow((prev) => ({
      ...prev,
      sections: [...prev.sections, section],
    }));
  };

  const deleteSection = (id: number): void => {
    const sections = rhythmWorkflow.sections.filter(
      (section) => section.id !== id,
    );
    setRhythmWorkflow((prev) => ({
      ...prev,
      sections,
    }));
  };

  const updateSection = (section: Section): void => {
    setRhythmWorkflow((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === section.id ? section : s)),
      blocks: prev.blocks.map((block) =>
        block.section.id === section.id ? { ...block, section } : block,
      ),
    }));
  };

  const value = useMemo(
    () => ({
      rhythmWorkflow,
      updateBlock,
      addBlock,
      updateBlockOrder,
      getTotalMeasures,
      getAverageTempo,
      getWorkflowTime,
      deleteBlock,
      resetBlocks,
      setActiveBlocks,
      updateWorkflowName,
      resetWorkflow,
      addSection,
      sections: rhythmWorkflow.sections,
      deleteSection,
      updateSection,
    }),
    [rhythmWorkflow],
  );

  return (
    <RhythmBuilderContext.Provider value={value}>
      {children}
    </RhythmBuilderContext.Provider>
  );
}
