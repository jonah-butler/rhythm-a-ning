import { BASE_URL } from './api';
import { defaultHeaders } from './api.helpers';
import type {
  GetWorkflowsResponse,
  SaveWorkflowBody,
  WorkflowResponse,
} from './types/workflow.types';

const VERSION = 'v1';
const PATH = 'workflow';

const url = `${BASE_URL}/${VERSION}/${PATH}`;

/** surfaces the api's `error` message (eg validation 400s) when present */
async function toError(response: Response, fallback: string): Promise<Error> {
  const parsed = await response.json().catch(() => null);
  return new Error((parsed?.error as string | undefined) ?? fallback);
}

const WorkflowApi = {
  async createWorkflow(body: SaveWorkflowBody): Promise<WorkflowResponse> {
    const response = await fetch(`${url}/`, {
      method: 'POST',
      ...defaultHeaders(),
      body: JSON.stringify(body),
    });

    if (response.status === 200) {
      const parsed = await response.json();
      return parsed.workflow as WorkflowResponse;
    }

    throw await toError(response, 'failed to create workflow');
  },

  async updateWorkflow(
    uuid: string,
    body: SaveWorkflowBody,
  ): Promise<WorkflowResponse> {
    const response = await fetch(`${url}/${uuid}`, {
      method: 'PUT',
      ...defaultHeaders(),
      body: JSON.stringify(body),
    });

    if (response.status === 200) {
      const parsed = await response.json();
      return parsed.workflow as WorkflowResponse;
    }

    throw await toError(response, 'failed to update workflow');
  },

  async getWorkflowById(uuid: string): Promise<WorkflowResponse> {
    const response = await fetch(`${url}/${uuid}`, {
      method: 'GET',
      ...defaultHeaders(),
    });

    if (response.status === 200) {
      const parsed = await response.json();
      return parsed.workflow as WorkflowResponse;
    }

    throw await toError(response, 'failed to get workflow');
  },

  /** offset is a page index; the api returns 10 workflows per page */
  async getWorkflows(offset: number): Promise<GetWorkflowsResponse> {
    const response = await fetch(`${url}/?offset=${offset}`, {
      method: 'GET',
      ...defaultHeaders(),
    });

    if (response.status === 200) {
      return (await response.json()) as GetWorkflowsResponse;
    }

    throw await toError(response, 'failed to get workflows');
  },

  async deleteWorkflow(uuid: string): Promise<void> {
    const response = await fetch(`${url}/${uuid}`, {
      method: 'DELETE',
      ...defaultHeaders(),
    });

    // 204 has no body
    if (response.status === 204) return;

    throw await toError(response, 'failed to delete workflow');
  },
};

export default WorkflowApi;
