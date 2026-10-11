import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ContextMenuProps = {
  children: ReactNode;
};

export default function ContextMenu({ children }: ContextMenuProps) {
  const PORTAL_ROOT = document.body;

  if (!PORTAL_ROOT) return null;

  return (
    <>
      {
        (createPortal(
          <div
            ref={ref}
            className="subdivision-modal"
            style={{
              visibility: isVisible ? 'visible' : 'hidden',
              top: `${coordinates.y}px`,
              left: `${coordinates.x}px`,
            }}
            onBlur={(e) => {
              if (!ref.current?.contains(e.relatedTarget as Node)) {
                handleBlur();
              }
            }}
            tabIndex={-1}
          >
            {children}
          </div>,
        ),
        PORTAL_ROOT)
      }
    </>
  );
}

export type ContextMenuBodyProps = {
  children: ReactNode;
};

function Body({ children }) {
  return { children };
}

ContextMenu.Body = Body;
