import { useState, type MouseEventHandler } from 'react';
import { createPortal } from 'react-dom';
import PlayIcon from '../../assets/icons/play.svg?react';
import TrashIcon from '../../assets/icons/trash.svg?react';
import '../../css/RhythmCardHorizontal.css';
import { type RhythmResponse } from '../../services/api/types/rhythm.types';
import { getSubdivisionData } from '../../services/rhythm.services';
import { Popover } from '../Popover';

type RhythmCardHorizontalProps = {
  rhythm: RhythmResponse;
  isDeleting: boolean;
  handleDeleteRhythm: (uuid: string) => void;
  handleLoad: (uuid: string) => void;
};

export default function RhythmCardHorizontal({
  rhythm,
  isDeleting,
  handleDeleteRhythm,
  handleLoad,
}: RhythmCardHorizontalProps) {
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [coordinates, setCoordinates] = useState({
    x: 0,
    y: 0,
  });

  const handleDelete: MouseEventHandler<HTMLButtonElement> = (event) => {
    const target = event.currentTarget;

    if (!target) return;

    const { left, bottom } = target.getBoundingClientRect();

    setCoordinates(() => {
      setDeleteVisible(true);
      return { x: left, y: bottom };
    });
    setDeleteVisible(true);
  };

  return (
    <section className="rhythm-card__horizontal">
      <div className="bpm-container">
        <section className="bpm">{rhythm.bpm}</section>
      </div>
      <div className="details-container">
        <section className="details">
          <div className="title">{rhythm.name}</div>
          <div className="description color-secondary">
            {rhythm.description}
          </div>
          <div className="settings">
            <span>
              {rhythm.beats} x{' '}
              <span className="note">
                {getSubdivisionData(rhythm.subdivision).label}
              </span>
            </span>
            {rhythm.isPoly ? (
              <span>
                {'\u00a0 - \u00a0'}
                <span>
                  {rhythm.polyBeats} x{' '}
                  <span className="note">
                    {getSubdivisionData(rhythm.polySubdivision).label}
                  </span>
                </span>
              </span>
            ) : null}
          </div>
        </section>
      </div>
      <div className="actions-container">
        {deleteVisible
          ? createPortal(
              <Popover
                isVisible={deleteVisible}
                handleBlur={() => setDeleteVisible(false)}
                coordinates={coordinates}
              >
                <button
                  onClick={() => {
                    setDeleteVisible(false);
                    handleDeleteRhythm(rhythm.id);
                  }}
                  disabled={isDeleting}
                  className="filled small"
                >
                  Yes, Delete
                </button>
              </Popover>,
              document.body,
            )
          : null}
        <section className="actions">
          <button onClick={(e) => handleDelete(e)} disabled={isDeleting}>
            <TrashIcon style={{ width: '14px' }} />
          </button>

          <button
            onClick={() => handleLoad(rhythm.id)}
            className="filled"
            disabled={isDeleting}
          >
            <PlayIcon style={{ width: '14px' }} /> Load
          </button>
        </section>
      </div>
    </section>
  );
}
