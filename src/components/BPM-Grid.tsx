import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import '../css/BPM-Grid.css';
import { isMobileUserAgent } from '../helpers/metronome.helpers';
import { getBeatState } from '../services/rhythm.services';
import type { SubdivisionName } from '../services/subdivision/types';
import type { BeatStore } from '../timing_engine/beatStore';
import { Sound } from '../timing_engine/oscillator.types';
import type { BeatState } from '../timing_engine/rhythm.types';
import SoundMenu from './Menus/SoundMenu';
import { SubdivisionModal } from './Modals/Subdivision-Modal';

interface BPMGridProps {
  beats: number;
  beatStore: BeatStore;
  smallVersion?: boolean;
  subdivision: number;
  totalBeats: BeatState[];
  beatCountGhost: number | null;
  beatSounds: Sound[][];
  subdivisionNew: number[];
  handleBeatClick: (index: number) => void;
  handleSoundSelection: (sound: Sound, index: number) => void;
  handleSubdivisionUpdate: (subdivision: SubdivisionName, beat: number) => void;
}

function BPMGrid({
  beats,
  beatStore,
  smallVersion,
  subdivision,
  handleBeatClick,
  totalBeats,
  beatCountGhost,
  beatSounds,
  handleSoundSelection,
  subdivisionNew,
  handleSubdivisionUpdate,
}: BPMGridProps) {
  function isSubdividedNote(
    beats: number,
    beat: number,
    subdivision: number,
  ): boolean {
    return !Number.isInteger((beats / (beats / subdivision)) * beat);
  }

  const PRESS_THRESHOLD = 1000;

  const pressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const subdivisionBeatRef = useRef(0);
  const [longPress, setLongPress] = useState(false);
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

  const subdivisionModalRef = useRef<HTMLDivElement | null>(null);

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
      if (isSubdividedNote(beats, beat, subdivision)) return;

      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }

      pressTimer.current = setTimeout(() => {
        if (!isSubdividedNote(beats, beat, subdivision)) {
          if (!subdivisionModalRef.current) return;
          setLongPress(true);
          setMenuOpenDot(null);

          subdivisionBeatRef.current = beat;

          let offset = 0;
          const dot = event.target as HTMLDivElement;
          const dotCoordinates = dot.getBoundingClientRect();
          const { bottom, left } = dotCoordinates;
          const distanceFromRightEdge = window.innerWidth - left;
          const { clientWidth: modalWidth } = subdivisionModalRef.current;

          if (distanceFromRightEdge < modalWidth) {
            offset =
              subdivisionModalRef.current!.clientWidth -
              (window.innerWidth - left);
          }

          setCoordinates({
            x: left - offset,
            y: bottom + window.scrollY,
          });
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

  const dots = useMemo(() => {
    const dots: JSX.Element[] = [];
    let index = 0;
    for (let i = 0; i < beats; i++) {
      const currentSubdivision = subdivisionNew[i];

      const count = Math.round(1 / currentSubdivision);
      for (let j = 0; j < count; j++) {
        const accumulator = j * currentSubdivision;
        const dotIndex = index++;
        const isSubdivided = j !== 0;
        const key = i + accumulator;

        dots.push(
          <div
            className={`dot ${isSubdivided ? 'subdivision' : ''} ${totalBeats[dotIndex] === 0 ? 'off' : ''} ${menuOpenDot === key ? 'menu-open' : ''}`}
            key={key}
            ref={(el) => {
              dotRefs.current[dotIndex] = el;
            }}
            style={{ '--i': i + accumulator } as React.CSSProperties}
            onMouseDown={(event) => handleMouseDown(key, event)}
            onMouseUp={() => handleMouseUp(dotIndex)}
            onMouseEnter={() => handleDotMouseEnter(key)}
            onMouseLeave={handleDotMouseLeave}
          >
            {!isMobileUserAgent() ? (
              <SoundMenu
                isOpen={menuOpenDot === key}
                onKeepOpen={cancelMenuClose}
                onRequestClose={scheduleMenuClose}
                activeSounds={beatSounds[dotIndex]}
                rotateMenu={true}
                onClick={(sound) => handleSoundSelection(sound, dotIndex)}
              />
            ) : null}
          </div>,
        );
      }
    }

    return dots;
  }, [
    beats,
    menuOpenDot,
    beatSounds,
    handleMouseDown,
    handleMouseUp,
    handleDotMouseEnter,
    handleDotMouseLeave,
    cancelMenuClose,
    scheduleMenuClose,
    handleSoundSelection,
    subdivisionNew,
  ]);

  const handleSubdivisionChange = (subdivision: SubdivisionName): void => {
    handleSubdivisionUpdate(subdivision, subdivisionBeatRef.current);
  };

  const cleanFloat = (value: number, threshold = 1e-12): number => {
    const rounded = Math.round(value);
    return Math.abs(rounded - value) < threshold ? rounded : value;
  };

  const buildTickGrid = (subdivisions: number[]): number[] => {
    const grid: number[] = [];
    subdivisions.forEach((sub, beatIndex) => {
      const ticks = Math.round(1 / sub);
      for (let i = 0; i < ticks; i++) {
        grid.push(cleanFloat(beatIndex + 1 + i * sub));
      }
    });
    return grid;
  };

  // Drives the active-beat highlight straight from the audio clock. Beat
  // ticks mutate classList instead of setting state, so they cost zero
  // renders. Re-runs when `dots` changes because React rewrites the
  // className attribute on those nodes, clearing the class we set here.
  useEffect(() => {
    const applyActiveBeat = (beat: number): void => {
      const grid = buildTickGrid(subdivisionNew);

      const nextIndex = grid.findIndex((b) => {
        return b === beat;
      });
      const prevIndex = activeIndexRef.current;

      if (prevIndex !== -1 && prevIndex !== nextIndex) {
        dotRefs.current[prevIndex]?.classList.remove('active');
      }
      if (nextIndex !== -1) {
        dotRefs.current[nextIndex]?.classList.add('active');
      }
      activeIndexRef.current = nextIndex;
    };

    applyActiveBeat(beatStore.get());

    return beatStore.subscribe(applyActiveBeat);
  }, [beatStore, totalBeats, subdivision, dots]);

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
            onChange={(subdivision) => handleSubdivisionChange(subdivision)}
            ref={subdivisionModalRef}
          />,
          document.body,
        )}
      </div>
    </>
  );
}

export default BPMGrid;
