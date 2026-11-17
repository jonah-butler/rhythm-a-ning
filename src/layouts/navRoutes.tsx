import type { ReactNode } from 'react';
import BuilderIcon from '../assets/icons/builder.svg?react';
import MetronomeIcon from '../assets/icons/metronome.svg?react';

export type NavRoute = {
  label: string;
  /** shorter label for tight spaces like the mobile tab bar */
  shortLabel: string;
  link: string;
  icon: ReactNode;
};

export const practiceRoutes: { title: string; subRoutes: NavRoute[] } = {
  title: 'Practice',
  subRoutes: [
    {
      label: 'Metronome',
      shortLabel: 'Metronome',
      link: 'metronome',
      icon: <MetronomeIcon style={{ width: '17px' }} />,
    },
    {
      label: 'Rhythm Builder',
      shortLabel: 'Builder',
      link: 'builder',
      icon: <BuilderIcon style={{ width: '17px' }} />,
    },
  ],
};
