import { useEffect, useState, type RefObject } from 'react';
import '../../css/Subdivision-Modal.css';
import { subdivisionData } from '../../services/subdivision/data';
import { SubdivisionName } from '../../services/subdivision/types';
import Dropdown from '../Dropdown';

type SubdivisionModalProps = {
  coordinates: {
    x: number;
    y: number;
  };
  isVisible: boolean;
  ref: RefObject<HTMLDivElement | null>;
  handleBlur: () => void;
  onChange: (subdivision: SubdivisionName) => void;
};

export function SubdivisionModal({
  isVisible,
  handleBlur,
  coordinates,
  onChange,
  ref,
}: SubdivisionModalProps) {
  useEffect(() => {
    if (!isVisible) return;
    requestAnimationFrame(() => {
      ref.current?.focus();
    });
  }, [isVisible, ref]);

  const [selectedValue, setSelectedValue] = useState(subdivisionData[0]);

  const handleChange = (value: SubdivisionName): void => {
    handleBlur();
    const newValue = subdivisionData.find((data) => data.value === value);

    if (!newValue) return;

    setSelectedValue(newValue);
    onChange(value);
  };

  return (
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
      <Dropdown
        label=""
        data={subdivisionData}
        currentValue={selectedValue}
        onChange={handleChange}
      />
    </div>
  );
}
