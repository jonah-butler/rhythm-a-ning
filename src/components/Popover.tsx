import { useEffect, useRef, type ReactNode } from 'react';
import '../css/Popover.css';

type SubdivisionModalProps = {
  coordinates: {
    x: number;
    y: number;
  };
  isVisible: boolean;
  children: ReactNode;
  handleBlur: () => void;
};

export function Popover({
  isVisible,
  handleBlur,
  coordinates,
  children,
}: SubdivisionModalProps) {
  const modal = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    requestAnimationFrame(() => {
      modal.current?.focus();
    });
  }, [isVisible]);

  return (
    <div
      ref={modal}
      className="popover"
      style={{
        display: isVisible ? 'block' : 'none',
        top: `${coordinates.y}px`,
        left: `${coordinates.x}px`,
      }}
      onBlur={(e) => {
        if (!modal.current?.contains(e.relatedTarget as Node)) {
          handleBlur();
        }
      }}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
