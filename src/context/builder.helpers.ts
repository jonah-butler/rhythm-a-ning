import { type DropdownOptions } from '../components/Dropdown';
import { resolveSubdivisions } from '../services/subdivision';
import { type RhythmBlock } from './BuilderContext.types';

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
