import { type DropdownOptions } from '../../components/Dropdown';
import {
  type SubdivisionDropdownOptionsWithEmpty,
  SubdivisionName,
} from './types';

// import Decuplet from '../../assets/notation/decuplet.svg?react';
import Eighth from '../../assets/notation/eighth.svg?react';
import Nonuplet from '../../assets/notation/nonuplet.svg?react';
import Quarter from '../../assets/notation/quarter.svg?react';
import Quintuplet from '../../assets/notation/quintuplet.svg?react';
import Septuplet from '../../assets/notation/septuplet.svg?react';
import Sextuplet from '../../assets/notation/sextuplet.svg?react';
import Sixteenth from '../../assets/notation/sixteenth.svg?react';
import ThirtySecond from '../../assets/notation/thirty-second.svg?react';
import Triplet from '../../assets/notation/triplet.svg?react';

export const subdivisionData: DropdownOptions<SubdivisionName, string>[] = [
  {
    label: 'quarter',
    value: SubdivisionName.Base,
    icon: <Quarter className="note-svg" />,
  },
  {
    label: 'eighth',
    value: SubdivisionName.Duplet,
    icon: <Eighth className="note-svg" />,
  },
  {
    label: 'triplet',
    value: SubdivisionName.Triplet,
    icon: <Triplet className="note-svg" />,
  },
  {
    label: 'sixteenth',
    value: SubdivisionName.Quadruplet,
    icon: <Sixteenth className="note-svg" />,
  },
  {
    label: 'quintuplet',
    value: SubdivisionName.Quintuplet,
    icon: <Quintuplet className="note-svg" />,
  },
  {
    label: 'sextuplet',
    value: SubdivisionName.Sextuplet,
    icon: <Sextuplet className="note-svg" />,
  },
  {
    label: 'septuplet',
    value: SubdivisionName.Septuplet,
    icon: <Septuplet className="note-svg" />,
  },
  {
    label: 'octuplet',
    value: SubdivisionName.Octuplet,
    icon: <ThirtySecond className="note-svg" />,
  },
  {
    label: 'nonuplet',
    value: SubdivisionName.Nonuplet,
    icon: <Nonuplet className="note-svg" />,
  },
  // {
  //   label: 'decuplet',
  //   value: SubdivisionName.Decuplet,
  //   icon: <Decuplet className="note-svg" />,
  // },
];

export const subdivisionDataWithEmpty: SubdivisionDropdownOptionsWithEmpty[] = [
  ...subdivisionData,
  { label: '--', value: '' },
];
