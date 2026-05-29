import bellSample from '../assets/sounds/cowbell.wav';
import hihatSample from '../assets/sounds/hihat.wav';
import kickSample from '../assets/sounds/kick.wav';
import snareSample from '../assets/sounds/snare.wav';
import { Sound, type SoundMap } from '../timing_engine/oscillator.types';

const samples = [kickSample, snareSample, bellSample, hihatSample];

const cache: SoundMap = {} as SoundMap;

function isLoaded(): boolean {
  return (
    Object.keys(cache).length === samples.length &&
    Object.values(cache).every((b) => b != null)
  );
}

export async function loadSounds(audioCtx: AudioContext): Promise<void> {
  if (isLoaded()) return;
  for (let i = 0; i < samples.length; i++) {
    const buf = await fetch(samples[i]).then((r) => r.arrayBuffer());
    cache[i as Sound] = await audioCtx.decodeAudioData(buf);
  }
}

export function getSoundMap(): SoundMap {
  return cache;
}
