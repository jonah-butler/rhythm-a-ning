export const MenuPage = {
  Home: 'home',
  Metronome: 'metronome',
  Builder: 'builder',
  Register: 'register',
  Features: 'features',
} as const;

export const MenuPageDescription = {
  [MenuPage.Home]: {
    title: 'Home',
    description: '',
  },
  [MenuPage.Metronome]: {
    title: 'Metronome Sequencer',
    description: 'build timing foundating and discover poly rhythms',
  },
  [MenuPage.Builder]: {
    title: 'Rhythm Builder',
    description: 'build training sequences',
  },
  [MenuPage.Register]: {
    title: 'Register',
    description: '',
  },
  [MenuPage.Features]: {
    title: 'Features',
    description: '',
  },
};

export type MenuPageType = (typeof MenuPage)[keyof typeof MenuPage];
