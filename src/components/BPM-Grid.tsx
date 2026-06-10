import { type MouseEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../css/BPM-Grid.css';
import { isMobileUserAgent } from '../helpers/metronome.helpers';
import { getBeatState } from '../services/rhythm.services';
import { Sound } from '../timing_engine/oscillator.types';
import type { BeatState } from '../timing_engine/rhythm.types';
import SoundMenu from './Menus/SoundMenu';
import { SubdivisionModal } from './Modals/Subdivision-Modal';

interface BPMGridProps {
  beats: number;
  currentBeat: number;
  smallVersion?: boolean;
  subdivision: number;
  totalBeats: BeatState[];
  beatCountGhost: number | null;
  beatSounds: Sound[][];
  handleBeatClick: (index: number) => void;
  handleSoundSelection: (sound: Sound, index: number) => void;
}

function BPMGrid({
  beats,
  currentBeat,
  smallVersion,
  subdivision,
  handleBeatClick,
  totalBeats,
  beatCountGhost,
  beatSounds,
  handleSoundSelection,
}: BPMGridProps) {
  function isSubdividedNote(
    beats: number,
    beat: number,
    subdivision: number,
  ): boolean {
    return !Number.isInteger((beats / (beats / subdivision)) * beat);
  }

  function isSameBeat(i: number): boolean {
    return 1 + i * subdivision === currentBeat;
  }

  const PRESS_THRESHOLD = 1000;

  const pressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [longPress, setLongPress] = useState(false);

  const [menuOpenDot, setMenuOpenDot] = useState<number | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelMenuClose = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
  };

  const cancelMenuOpen = () => {
    if (menuOpenTimer.current) clearTimeout(menuOpenTimer.current);
  };

  const scheduleMenuClose = () => {
    cancelMenuClose();
    menuCloseTimer.current = setTimeout(() => setMenuOpenDot(null), 350);
  };

  const handleDotMouseEnter = (i: number) => {
    cancelMenuClose();
    if (menuOpenDot !== null) {
      setMenuOpenDot(i);
    } else {
      cancelMenuOpen();
      menuOpenTimer.current = setTimeout(() => setMenuOpenDot(i), 350);
    }
  };

  const handleDotMouseLeave = () => {
    cancelMenuOpen();
    scheduleMenuClose();
  };

  type ModalCoordinates = {
    x: number;
    y: number;
  };

  const [coordinates, setCoordinates] = useState<ModalCoordinates>({
    x: 0,
    y: 0,
  });

  const handleMouseDown = (
    beat: number,
    event: MouseEvent<HTMLDivElement, Event>,
  ) => {
    setCoordinates({
      x: event.clientX,
      y: event.clientY,
    });

    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }

    pressTimer.current = setTimeout(() => {
      if (!isSubdividedNote(beats, beat, subdivision)) {
        setLongPress(true);
      }
    }, PRESS_THRESHOLD);
  };

  const handleMouseUp = (beat: number) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }

    if (!longPress) {
      handleBeatClick(beat);
      setLongPress(false);
    }
  };

  return (
    <>
      {beatCountGhost ? (
        <div
          className={`grid-container ghost ${smallVersion ? 'small' : ''}`}
          style={
            {
              '--beats': beatCountGhost / subdivision,
              zIndex: menuOpenDot !== null ? '6' : '5',
            } as React.CSSProperties
          }
        >
          {getBeatState(beatCountGhost, subdivision).map((beat, i) => {
            return (
              <div
                className={`dot ${isSubdividedNote(beatCountGhost, i, subdivision) ? 'subdivision' : ''} ${beat === 0 ? 'off' : ''}`}
                key={i}
                style={{ '--i': i } as React.CSSProperties}
              ></div>
            );
          })}
        </div>
      ) : null}

      <div
        className={`grid-container ${smallVersion ? 'small' : ''}`}
        style={
          {
            '--beats': beats / subdivision,
            zIndex: menuOpenDot !== null ? '6' : '5',
          } as React.CSSProperties
        }
      >
        {totalBeats.map((beat, i) => {
          return (
            <div
              className={`dot${isSameBeat(i) ? ' active' : ''} ${isSubdividedNote(beats, i, subdivision) ? 'subdivision' : ''} ${beat === 0 ? 'off' : ''} ${menuOpenDot === i ? 'menu-open' : ''}`}
              key={i}
              style={{ '--i': i } as React.CSSProperties}
              onMouseDown={(event) => handleMouseDown(i, event)}
              onMouseUp={() => handleMouseUp(i)}
              onMouseEnter={() => handleDotMouseEnter(i)}
              onMouseLeave={handleDotMouseLeave}
            >
              {!isMobileUserAgent() ? (
                <SoundMenu
                  isOpen={menuOpenDot === i}
                  onKeepOpen={cancelMenuClose}
                  onRequestClose={scheduleMenuClose}
                  activeSounds={beatSounds[i]}
                  rotateMenu={true}
                  onClick={(sound) => handleSoundSelection(sound, i)}
                />
              ) : null}
            </div>
          );
        })}
        {createPortal(
          <SubdivisionModal
            isVisible={longPress}
            handleBlur={() => setLongPress(false)}
            coordinates={coordinates}
          />,
          document.body,
        )}
      </div>
    </>
  );
}

export default BPMGrid;
