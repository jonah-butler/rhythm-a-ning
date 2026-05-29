import { type ReactNode } from 'react';
import CowbellIcon from '../../assets/icons/cowbell.svg?react';
import HiHatIcon from '../../assets/icons/hihat.svg?react';
import KickIcon from '../../assets/icons/kick.svg?react';
import OscillatorIcon from '../../assets/icons/oscillator.svg?react';
import SnareIcon from '../../assets/icons/snare.svg?react';
import '../../css/SoundMenu.css';
import { Sound } from '../../timing_engine/oscillator.types';

type SoundSelection = {
  id: string;
  label: ReactNode;
  value: Sound;
};

const SOUNDS: SoundSelection[] = [
  { id: 'kick', label: <KickIcon />, value: Sound.Kick },
  { id: 'snare', label: <SnareIcon />, value: Sound.Snare },
  { id: 'cowbell', label: <CowbellIcon />, value: Sound.Cowbell },
  { id: 'hihat', label: <HiHatIcon />, value: Sound.HiHat },
  { id: 'oscillator', label: <OscillatorIcon />, value: Sound.Oscillator },
];

interface SoundMenuProps {
  isOpen: boolean;
  activeSound: Sound;
  rotateMenu?: boolean;
  onKeepOpen: () => void;
  onRequestClose: () => void;
  onClick: (sound: Sound) => void;
}

function SoundMenu({
  isOpen,
  onKeepOpen,
  onRequestClose,
  activeSound,
  onClick,
  rotateMenu = false,
}: SoundMenuProps) {
  return (
    <div className={`sound-menu${isOpen ? ' open' : ''}`}>
      {SOUNDS.map((sound, i) => (
        <button
          key={sound.id}
          className={`sound-menu__item${sound.value === activeSound ? ' active' : ''} ${rotateMenu ? ' rotate' : ''}`}
          style={
            {
              '--angle': `${(360 / SOUNDS.length) * i - 90}deg`,
              '--i': i,
            } as React.CSSProperties
          }
          onMouseEnter={onKeepOpen}
          onMouseLeave={onRequestClose}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => {
            e.stopPropagation();
            onClick(sound.value);
          }}
        >
          {sound.label}
        </button>
      ))}
    </div>
  );
}

export default SoundMenu;
