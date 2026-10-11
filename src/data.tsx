import { type DropdownOptions } from './components/Dropdown';

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
