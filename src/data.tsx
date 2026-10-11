import { type DropdownOptions } from './components/Dropdown';

// import Decuplet from './assets/notation/decuplet.svg?react';
import Eighth from './assets/notation/eighth.svg?react';
import Nonuplet from './assets/notation/nonuplet.svg?react';
import Quarter from './assets/notation/quarter.svg?react';
import Quintuplet from './assets/notation/quintuplet.svg?react';
import Septuplet from './assets/notation/septuplet.svg?react';
import Sextuplet from './assets/notation/sextuplet.svg?react';
import Sixteenth from './assets/notation/sixteenth.svg?react';
import ThirtySecond from './assets/notation/thirty-second.svg?react';
import Triplet from './assets/notation/triplet.svg?react';

export const subdivisionData: DropdownOptions[] = [
  {
    label: 'quarter',
    value: 'base',
    icon: <Quarter className="note-svg" />,
  },
  { label: 'eighth', value: 'duplet', icon: <Eighth className="note-svg" /> },
  {
    label: 'triplet',
    value: 'triplet',
    icon: <Triplet className="note-svg" />,
  },
  {
    label: 'sixteenth',
    value: 'quadruplet',
    icon: <Sixteenth className="note-svg" />,
  },
  {
    label: 'quintuplet',
    value: 'quintuplet',
    icon: <Quintuplet className="note-svg" />,
  },
  {
    label: 'sextuplet',
    value: 'sextuplet',
    icon: <Sextuplet className="note-svg" />,
  },
  {
    label: 'septuplet',
    value: 'septuplet',
    icon: <Septuplet className="note-svg" />,
  },
  {
    label: 'octuplet',
    value: 'octuplet',
    icon: <ThirtySecond className="note-svg" />,
  },
  {
    label: 'nonuplet',
    value: 'nonuplet',
    icon: <Nonuplet className="note-svg" />,
  },
  // {
  //   label: 'decuplet',
  //   value: 'decuplet',
  //   icon: <Decuplet className="note-svg" />,
  // },
];

export const beatCountData: DropdownOptions[] = [
  {
    label: '1',
    value: '1',
  },
  {
    label: '2',
    value: '2',
  },
  {
    label: '3',
    value: '3',
  },
  {
    label: '4',
    value: '4',
  },
  {
    label: '5',
    value: '5',
  },
  {
    label: '6',
    value: '6',
  },
  {
    label: '7',
    value: '7',
  },
  {
    label: '8',
    value: '8',
  },
  {
    label: '9',
    value: '9',
  },
  {
    label: '10',
    value: '10',
  },
  // {
  //   label: '11',
  //   value: '11',
  // },
];

export const tempoData = (): DropdownOptions[] => {
  const low = 20;
  const high = 250;
  let i = low;
  const options: DropdownOptions[] = [];

  while (i <= high) {
    const label = i.toString();
    const value = i.toString();

    options.push({ label, value });

    i += 10;
  }

  return options;
};
