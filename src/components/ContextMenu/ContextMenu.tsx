import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { type useContextMenu } from './useContextMenu';

export type ContextMenuProps = Pick<
  ReturnType<typeof useContextMenu>,
  'menuRef' | 'coordinates' | 'isVisible' | 'close'
> & {
  children: ReactNode;
};

export default function ContextMenu({
  menuRef,
  coordinates,
  isVisible,
  close,
  children,
}: ContextMenuProps) {
  // onBlur only fires if the menu had focus, so take it when opened
  useEffect(() => {
    if (!isVisible) return;
    requestAnimationFrame(() => {
      menuRef.current?.focus();
    });
  }, [isVisible, menuRef]);

  return createPortal(
    <div
      ref={menuRef}
      className="subdivision-modal"
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        top: `${coordinates.y}px`,
        left: `${coordinates.x}px`,
      }}
      onBlur={(e) => {
        if (!menuRef.current?.contains(e.relatedTarget as Node)) {
          close();
        }
      }}
      tabIndex={-1}
    >
      {children}
    </div>,
    document.body,
  );
}

export type ContextMenuBodyProps = {
  children: ReactNode;
};

function Body({ children }: ContextMenuBodyProps) {
  return <>{children}</>;
}

ContextMenu.Body = Body;
