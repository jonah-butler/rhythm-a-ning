import { useCallback, useRef, useState } from 'react';

export type Coordinates = {
  x: number;
  y: number;
};

export const useContextMenu = () => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const open = useCallback((coords: Coordinates) => {
    setCoordinates(coords);
    setIsVisible(true);
  }, []);

  const close = useCallback(() => setIsVisible(false), []);

  return { menuRef, coordinates, isVisible, open, close };
};
