import {
  type MouseEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  // kept in sync below so the mouseup handler can stay referentially
  // stable (doesn't need `longPress` in its dep array)
  const longPressRef = useRef(longPress);
  longPressRef.current = longPress;

  // refs to each dot's DOM node, used to toggle the active-beat
  // highlight imperatively instead of via re-render
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(-1);

  const [menuOpenDot, setMenuOpenDot] = useState<number | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelMenuClose = useCallback(() => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
  }, []);

  const cancelMenuOpen = useCallback(() => {
    if (menuOpenTimer.current) clearTimeout(menuOpenTimer.current);
  }, []);

  const scheduleMenuClose = useCallback(() => {
    cancelMenuClose();
    menuCloseTimer.current = setTimeout(() => setMenuOpenDot(null), 350);
  }, [cancelMenuClose]);

  const handleDotMouseEnter = useCallback(
    (i: number) => {
      cancelMenuClose();
      if (menuOpenDot !== null) {
        setMenuOpenDot(i);
      } else {
        cancelMenuOpen();
        menuOpenTimer.current = setTimeout(() => setMenuOpenDot(i), 350);
      }
    },
    [menuOpenDot, cancelMenuClose, cancelMenuOpen],
  );

  const handleDotMouseLeave = useCallback(() => {
    cancelMenuOpen();
    scheduleMenuClose();
  }, [cancelMenuOpen, scheduleMenuClose]);

  // imperatively toggle the active-beat class so beat ticks never force
  // React to re-reconcile the whole dot list (see the memoized `dots`
  // list below, which intentionally excludes `currentBeat`)
  useLayoutEffect(() => {
    const newActiveIndex = totalBeats.findIndex((_, i) => isSameBeat(i));

    const prevIndex = activeIndexRef.current;
    if (prevIndex !== -1 && prevIndex !== newActiveIndex) {
      dotRefs.current[prevIndex]?.classList.remove('active');
    }
    if (newActiveIndex !== -1) {
      dotRefs.current[newActiveIndex]?.classList.add('active');
    }
    activeIndexRef.current = newActiveIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBeat, subdivision, totalBeats]);

  type ModalCoordinates = {
    x: number;
    y: number;
  };

  const [coordinates, setCoordinates] = useState<ModalCoordinates>({
    x: 0,
    y: 0,
  });

  const handleMouseDown = useCallback(
    (beat: number, event: MouseEvent<HTMLDivElement, Event>) => {
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
    },
    [beats, subdivision],
  );

  const handleMouseUp = useCallback(
    (beat: number) => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }

      if (!longPressRef.current) {
        handleBeatClick(beat);
        setLongPress(false);
      }
    },
    [handleBeatClick],
  );

  // Deliberately excludes `currentBeat`: when only the beat ticks, the
  // active-dot effect above handles the visual update via classList, and
  // React reuses this exact element array (bailing out of reconciling
  // every dot) instead of remapping ~N divs on every tick.
  const dots = useMemo(
    () =>
      totalBeats.map((beat, i) => (
        <div
          className={`dot ${isSubdividedNote(beats, i, subdivision) ? 'subdivision' : ''} ${beat === 0 ? 'off' : ''} ${menuOpenDot === i ? 'menu-open' : ''}`}
          key={i}
          ref={(el) => {
            dotRefs.current[i] = el;
          }}
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
      )),
    [
      totalBeats,
      beats,
      subdivision,
      menuOpenDot,
      beatSounds,
      handleMouseDown,
      handleMouseUp,
      handleDotMouseEnter,
      handleDotMouseLeave,
      cancelMenuClose,
      scheduleMenuClose,
      handleSoundSelection,
    ],
  );

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
        {dots}
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
