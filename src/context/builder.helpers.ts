import { type DropdownOptions } from '../components/Dropdown';
import type {
  SaveWorkflowBody,
  WorkflowResponse,
} from '../services/api/types/workflow.types';
import {
  createRhythmPayload,
  generateUUID,
  rhythmToSlim,
} from '../services/rhythm.services';
import { resolveSubdivisions } from '../services/subdivision';
import {
  DefaultSection,
  type RhythmBlock,
  type Section,
} from './BuilderContext.types';
import { type RhythmBlockStore } from './IndexedDB.types';

/** A block as saved in IndexedDB before the per-beat subdivision migration. */
type LegacyRhythmBlock = Omit<
  RhythmBlock,
  'subdivisions' | 'polySubdivisions'
> &
  Partial<Pick<RhythmBlock, 'subdivisions' | 'polySubdivisions'>> & {
    subdivision?: DropdownOptions;
    polySubdivision?: DropdownOptions;
  };

/**
 * Workflows saved before the per-beat subdivision migration only carry the
 * single `subdivision`/`polySubdivision` option. Resolve them to arrays and
 * drop the legacy keys so they are not written back.
 */
export const withSubdivisions = (stored: RhythmBlock): RhythmBlock => {
  const { subdivision, polySubdivision, ...block } =
    stored as LegacyRhythmBlock;

  return {
    ...block,
    subdivisions: resolveSubdivisions(
      block.subdivisions,
      subdivision?.value,
      Number(block.beats.value),
    ),
    polySubdivisions: resolveSubdivisions(
      block.polySubdivisions,
      polySubdivision?.value,
      Number(block.polyBeats.value),
    ),
  };
};

export const totalMeasures = (blocks: RhythmBlock[]): number => {
  return blocks
    .map((b) => b.measures)
    .reduce((a, b) => {
      return a + b;
    });
};

export const averageTempo = (blocks: RhythmBlock[]): number => {
  const tempos = blocks.map((b) => b.bpm);
  return Math.floor(tempos.reduce((a, b) => a + b) / tempos.length);
};

export const totalTime = (blocks: RhythmBlock[]): number => {
  const minutes = blocks.map((block) => {
    return (Number(block.beats.value) / block.bpm) * block.measures;
  });

  return minutes.reduce((a, b) => {
    return a + b;
  });
};

/** Builds the create/update body. Server rhythm ids are sent for saved blocks only. */
export const toWorkflowBody = (
  workflow: RhythmBlockStore,
): SaveWorkflowBody => {
  const sections = workflow.sections.filter((s) => s.label !== 'None');
  const sectionIds = new Set(sections.map((s) => s.value));

  return {
    name: workflow.name.trim() || 'Untitled workflow',
    sections: sections.map((s) => ({
      sectionId: s.value,
      name: s.label,
      color: s.color ?? '',
    })),
    blocks: workflow.blocks.map((block, i) => ({
      ...createRhythmPayload(block, {
        // the api requires a rhythm name; mirrors copyBlock's naming
        title: block.name || `Block ${i + 1}`,
        description: block.description ?? '',
      }),
      id: block.rhythmId ?? null,
      // "None" and deleted sections are sent as no section
      section: sectionIds.has(block.section.value) ? block.section.value : null,
    })),
  };
};

/** Maps a loaded workflow into builder state. Not used after saves, see saveWorkflow. */
export const fromWorkflowResponse = (
  workflow: WorkflowResponse,
): RhythmBlockStore => {
  const sections: Section[] = [
    DefaultSection,
    ...workflow.sections.map((s, i) => ({
      id: i + 1,
      label: s.name,
      value: s.sectionId,
      color: s.color,
    })),
  ];

  return {
    id: workflow.workflowId,
    name: workflow.name,
    createdAt: Date.parse(workflow.createdAt),
    updatedAt: Date.parse(workflow.updatedAt),
    sections,
    blocks: workflow.rhythms.map((rhythm) => ({
      ...rhythmToSlim(rhythm),
      id: generateUUID(),
      rhythmId: rhythm.id,
      section:
        sections.find((s) => s.value === rhythm.section) ?? DefaultSection,
    })),
  };
};
