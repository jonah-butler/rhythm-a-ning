export const MenuPage = {
  Home: 'home',
  Metronome: 'metronome',
  Builder: 'builder',
  Register: 'register',
  Features: 'features',
  VerifyAccount: 'verify-account',
  Login: 'login',
  ResetPassword: 'reset-password',
  VerifyResetPassword: 'verify-reset-password',
  PrivacyPolicy: 'privacy-policy',
  Account: 'account', // protected
} as const;

export const MenuPageDescription = {
  [MenuPage.Home]: {
    title: 'Home',
    description: '',
  },
  [MenuPage.Metronome]: {
    title: 'Metronome',
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
  [MenuPage.VerifyAccount]: {
    title: 'Verify Account',
    description: '',
  },
  [MenuPage.Login]: {
    title: 'Login',
    description: '',
  },
  [MenuPage.Account]: {
    title: 'Account',
    description: '',
  },
  [MenuPage.ResetPassword]: {
    title: 'Reset Password',
    description: '',
  },
  [MenuPage.VerifyResetPassword]: {
    title: 'Verify Password',
    description: '',
  },
  [MenuPage.PrivacyPolicy]: {
    title: 'Privacy Policy',
    description: '',
  },
};

export type MenuPageType = (typeof MenuPage)[keyof typeof MenuPage];
