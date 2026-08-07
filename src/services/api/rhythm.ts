import { BASE_URL } from './api';
import { defaultHeaders } from './api.helpers';
import type {
  CreateRhythmBody,
  SubdivisionResponse,
} from './types/rhythm.types';

const VERSION = 'v1';
const PATH = 'rhythm';

const url = `${BASE_URL}/${VERSION}/${PATH}`;

const getSubdivisions = async (): Promise<SubdivisionResponse[]> => {
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
};

const createRhythm = async (rhythm: CreateRhythmBody): Promise<void> => {
  try {
    const response = await fetch(`${url}/rhythms`, {
      method: 'POST',
      ...defaultHeaders,
      body: JSON.stringify(rhythm),
    });

    console.log(response);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('failed to create new rhythm');
  }
};

export { createRhythm, getSubdivisions };
