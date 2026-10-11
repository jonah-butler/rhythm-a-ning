import { useRef, useState } from 'react';

export type Coordinates = {
  x: number;
  y: number;
};

export const useContextMenu = () => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState(0);

  return { coordinates };
};
