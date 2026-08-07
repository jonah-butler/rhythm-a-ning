import { createContext } from 'react';
import type { MetronomeContextType } from './MetronomeContext.types';

export const MetronomeBuilderContext =
  createContext<MetronomeContextType | null>(null);
