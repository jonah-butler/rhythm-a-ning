import { BASE_URL } from './api';
import { defaultHeaders } from './api.helpers';
import type {
  CreateRhythmBody,
  CreateRhythmResponse,
  GetRhythmsResponse,
  RhythmResponse,
  SubdivisionResponse,
} from './types/rhythm.types';

const VERSION = 'v1';
const PATH = 'rhythm';

const url = `${BASE_URL}/${VERSION}/${PATH}`;

const RhythmApi = {
  async getSubdivisions(): Promise<SubdivisionResponse[]> {
    try {
      const response = await fetch(`${url}/subdivisions`, {
        method: 'GET',
        ...defaultHeaders(),
      });
      const parsed = (await response.json()) as SubdivisionResponse[];

      return parsed;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('failed to GET subdiivisions');
    }
  },

  async createRhythm(rhythm: CreateRhythmBody): Promise<RhythmResponse> {
    try {
      const response = await fetch(`${url}/`, {
        method: 'POST',
        ...defaultHeaders(),
        body: JSON.stringify(rhythm),
      });

      if (response.status === 200) {
        const parsed = await response.json();
        return (parsed as CreateRhythmResponse).rhythm;
      }

      throw new Error('failed to create new rhythm');
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('failed to create new rhythm');
    }
  },

  async getRhythms(offset: number): Promise<GetRhythmsResponse> {
    try {
      const response = await fetch(`${url}/?offset=${offset}`, {
        method: 'GET',
        ...defaultHeaders(),
      });

      const parsed = await response.json();

      return parsed as GetRhythmsResponse;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }

      throw new Error('failed to get rhythms');
    }
  },

  async deleteRhythm(uuid: string): Promise<void> {
    const response = await fetch(`${url}/${uuid}`, {
      method: 'DELETE',
      ...defaultHeaders(),
    });

    // 204 has no body, so parsing it before the status check throws on success
    if (response.status === 204) return;

    const parsed = await response.json().catch(() => null);
    const message = parsed?.error as string | undefined;

    throw new Error(message ?? 'failed to delete rhythm');
  },

  async updateRhythm(
    uuid: string,
    payload: CreateRhythmBody,
  ): Promise<RhythmResponse> {
    try {
      const response = await fetch(`${url}/${uuid}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        ...defaultHeaders(),
      });

      if (response.status === 200) {
        const parsed = await response.json();
        return parsed.rhythm as RhythmResponse;
      }

      throw new Error('failed to update rhythm');
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('failed to update rhythm');
    }
  },
};

export default RhythmApi;
