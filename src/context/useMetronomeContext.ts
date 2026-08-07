import { useContext } from 'react';
import { MetronomeBuilderContext } from './MetronomeContext';

export function useMetronomeBuilderContext() {
  const ctx = useContext(MetronomeBuilderContext);
  if (!ctx) throw new Error('use metronome builder context is null');
  return ctx;
}
