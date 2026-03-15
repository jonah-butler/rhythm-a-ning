type QueryValidation = {
  bpm: number;
  baseCount: number | null;
  baseSubdivion: number | null;
  usePoly: boolean;
  polyCount: number | null;
  polySubdivision: number | null;
};

export const parseMetronomeQueryParams = (query: string): QueryValidation => {
  const validation = {
    bpm: 60,
    usePoly: false,
  } as QueryValidation;

  if (query === '') {
    return validation;
  }

  const params = new URLSearchParams(query);

  const bpm = params.get('bpm');
  if (bpm && Number.isInteger(+bpm)) {
    validation.bpm = Math.min(Math.max(+bpm, 20), 250);
  }

  const baseCount = params.get('bc');
  if (baseCount && Number.isInteger(+baseCount)) {
    validation.baseCount = +baseCount > 10 ? 3 : +baseCount;
  }

  const baseSubdivision = params.get('bs');
  if (baseSubdivision && Number.isInteger(+baseSubdivision)) {
    validation.baseSubdivion = +baseSubdivision > 8 ? 0 : +baseSubdivision;
  }

  const usePoly = params.get('p');
  if (usePoly && Number.isInteger(+usePoly) && +usePoly === 1) {
    validation.usePoly = true;
  }

  const polyCount = params.get('pc');
  if (polyCount && Number.isInteger(+polyCount)) {
    validation.polyCount = +polyCount > 10 ? 2 : +polyCount;
  }

  const polySubdivision = params.get('ps');
  if (polySubdivision && Number.isInteger(+polySubdivision)) {
    validation.polySubdivision = +polySubdivision > 8 ? 0 : +polySubdivision;
  }

  return validation;
};
