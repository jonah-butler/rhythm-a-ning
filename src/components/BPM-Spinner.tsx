import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as PE,
  type ReactNode,
} from 'react';
import PowerButton from '../assets/power-button.svg?react';
import '../css/BPM-Spinner.css';

interface BPMSpinnerProps {
  bpm: number;
  isRunning: boolean;
  usePolyrhythm: boolean;
  subdivisionIcon: ReactNode;
  polySubdivisionIcon: ReactNode;
  // currentBeat: number;
  updateBPM: (value: number) => void;
  togglePlayback: () => void;
}

function BPMSpinner({
  bpm,
  isRunning,
  updateBPM,
  togglePlayback,
  usePolyrhythm,
  subdivisionIcon,
  polySubdivisionIcon,
}: BPMSpinnerProps) {
  const [rotation, setRotation] = useState(0);
  const [count, setCount] = useState(bpm);
  const [styleCount, setStyleCount] = useState(bpm);
  const countRef = useRef(count);
  const bpmSpinnerRef = useRef<HTMLDivElement | null>(null);

  let startAngle = 0;

  // const buttonRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   const el = buttonRef.current;
  //   if (!el || !isRunning || !Number.isInteger(currentBeat)) return;

  //   el.style.animation = 'none';
  //   el.getBoundingClientRect();
  //   el.style.animation = '';
  // }, [currentBeat]);

  useEffect(() => {
    setCount(bpm);
    countRef.current = bpm;
    setStyleCount(bpm);
  }, [bpm]);

  function getAngleFromCenter(x: number, y: number) {
    if (!bpmSpinnerRef.current) return 0;
    const rect = bpmSpinnerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    return (angle + 360) % 360;
  }

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function onPointerDown(e: PE<HTMLDivElement>) {
    e.preventDefault();
    startAngle = getAngleFromCenter(e.clientX, e.clientY);

    let accumulatedDelta = 0;

    const handleMove = (ev: PointerEvent) => {
      const newAngle = getAngleFromCenter(ev.clientX, ev.clientY);
      let delta = newAngle - startAngle;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      setRotation((prev) => {
        const next = prev + delta;
        return ((next % 360) + 360) % 360;
      });

      accumulatedDelta += delta * 0.09;

      if (Math.abs(accumulatedDelta) >= 1) {
        const change = Math.round(accumulatedDelta);
        setCount((prev) => {
          const next = clamp(prev + change, 20, 250);
          countRef.current = next;
          return next;
        });

        accumulatedDelta -= change;
      }
      startAngle = newAngle;
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      updateBPM(countRef.current);
      setStyleCount(countRef.current);

      lastTap.current = 0;
      intervals.current = [];
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  const lastTap = useRef(0);
  const intervals = useRef<number[]>([]);

  const TAP_SECONDS_INTERVAL = 4000;

  function tapTempo(e: MouseEvent<HTMLDivElement>): void {
    e.preventDefault();

    const now = performance.now();

    if (lastTap.current && now - lastTap.current > TAP_SECONDS_INTERVAL) {
      intervals.current = [];
    }

    if (lastTap.current !== 0) {
      const interval = now - lastTap.current;
      intervals.current.push(interval);

      if (intervals.current.length > 5) {
        intervals.current.shift();
      }

      const sorted = [...intervals.current].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];

      const min = Math.round(60 / (median / 1000));
      const minClamped = min < 20 ? 20 : min;
      const bpm = Math.min(minClamped, 250);

      countRef.current = bpm;
      setCount(bpm);
      updateBPM(bpm);
    }

    lastTap.current = now;
  }
  return (
    <div className="bpm-spinner">
      <section
        ref={bpmSpinnerRef}
        onPointerDown={onPointerDown}
        className={`bpm-spinner__rotary${usePolyrhythm ? ' small' : ''}`}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className={`circle${usePolyrhythm ? ' small' : ''}`}>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <div>
                          <div>
                            <div>
                              <div>
                                <div>
                                  <div>
                                    <div>
                                      <div>
                                        <div>
                                          <div>
                                            <div>
                                              <div>
                                                <div></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div
        onClick={tapTempo}
        className={`${isRunning ? 'running ' : ''}${usePolyrhythm ? 'small ' : ''}bpm-spinner__button`}
        style={
          {
            '--tempo': `${(60 / styleCount / 2).toFixed(3)}s`,
          } as React.CSSProperties
        }
      >
        <span className="tap-indicator">tap</span>
        <div className="note-container">
          <span>{subdivisionIcon}</span>
          {usePolyrhythm && <span>{polySubdivisionIcon}</span>}
        </div>
        <div className="display-container">
          <h4>{count}</h4>
          <h5>BPM</h5>
        </div>
      </div>

      <div className="play-button__container">
        <button onClick={togglePlayback} className="play-button">
          <PowerButton />
        </button>
      </div>
    </div>
  );
}

export default BPMSpinner;
