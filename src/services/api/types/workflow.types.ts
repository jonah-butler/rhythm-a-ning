import type { CreateRhythmBody, RhythmResponse } from './rhythm.types';

// Request bodies
export type WorkflowSectionBody = {
  /** client generated uuid */
  sectionId: string;
  name: string;
  color: string;
  description?: string | null;
};

export type WorkflowBlockBody = CreateRhythmBody & {
  /** server rhythm id; null inserts a new rhythm */
  id: string | null;
  /** sectionId, null when not in a section */
  section: string | null;
};

/** shared by create and update; block ids are always null on create */
export type SaveWorkflowBody = {
  name: string;
  description?: string | null;
  sections: WorkflowSectionBody[];
  blocks: WorkflowBlockBody[];
};

// Responses
export type WorkflowRhythmResponse = RhythmResponse & {
  section: string | null;
  position: number;
};

export type WorkflowSectionResponse = {
  sectionId: string;
  workflowId: string;
  color: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowSummary = {
  workflowId: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowResponse = WorkflowSummary & {
  rhythms: WorkflowRhythmResponse[];
  sections: WorkflowSectionResponse[];
};

export type WorkflowListItem = WorkflowSummary & {
  blockCount: number;
  totalMeasures: number;
  averageTempo: number;
  totalMinutes: number;
};

export type GetWorkflowsResponse = {
  workflows: WorkflowListItem[];
  total: number;
};
