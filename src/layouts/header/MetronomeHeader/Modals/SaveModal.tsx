import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../../../components/Modals/Generic';
import { useMetronomeBuilderContext } from '../../../../context/useMetronomeContext';
import RhythmApi from '../../../../services/api/rhythm';
import {
  type CreateRhythmBody,
  type RhythmResponse,
} from '../../../../services/api/types/rhythm.types';
import { createRhythmPayload } from '../../../../services/rhythm.services';
import type { LibraryModalProps, RhythmMetaData } from './SaveModal.types';

export default function SaveModal({ onModalClose }: LibraryModalProps) {
  console.log('rendering save modal...');
  const {
    rhythm,
    isSavedRhythm,
    updateRhythm,
    markRhythmSaved,
    settingsChanged,
  } = useMetronomeBuilderContext();

  const [loading, setLoading] = useState(false);

  const [saveData, setSaveData] = useState<RhythmMetaData>({
    title: rhythm.name ?? '',
    description: rhythm.description ?? '',
    age: 0,
  });

  const { name, description } = rhythm;

  const titleChanged = saveData.title !== (name ?? '');
  const descriptionChanged = saveData.description !== (description ?? '');
  const nothingToSave =
    !settingsChanged && !titleChanged && !descriptionChanged;

  useEffect(() => {
    console.log('ok');
    setSaveData({
      title: rhythm.name ?? '',
      description: rhythm.description ?? '',
      age: 0,
    });
  }, [rhythm.name, rhythm.description]);

  // dynamically sets input data
  const updateSaveData = <K extends keyof RhythmMetaData>(
    key: K,
    value: RhythmMetaData[K],
  ) => {
    setSaveData((prev) => ({ ...prev, [key]: value }));
  };

  const saveRhythm = async (): Promise<void> => {
    const payload = createRhythmPayload(rhythm, saveData);

    try {
      setLoading(true);
      let response: RhythmResponse;
      if (isSavedRhythm()) {
        response = await RhythmApi.updateRhythm(rhythm.id, payload);
      } else {
        response = await RhythmApi.createRhythm(payload as CreateRhythmBody);
      }

      if (!response?.id) {
        throw new Error('save succeeded but returned no rhythm id');
      }

      // saving only mints identity metadata; the musical params are already
      // live in the engine, so patch rather than replace and avoid a rebuild
      updateRhythm({
        id: response.id,
        name: response.name,
        description: response.description,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      });
      markRhythmSaved();
      // only on success -- closing in `finally` made a failed save look saved
      onModalClose();
    } catch (err) {
      let message = isSavedRhythm()
        ? 'failed to update rhythm'
        : 'failed to create rhythm';
      if (err instanceof Error) {
        message += `: ${err.message}`;
      }

      toast(message, {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal close={onModalClose} size="sm">
      <Modal.Header onClose={onModalClose}>
        <section>{isSavedRhythm() ? 'Update' : 'Save'} Rhythm</section>
      </Modal.Header>
      <Modal.Body>
        <section>
          {' '}
          <div className="flex flex-col text-left mb-8">
            <div className="font-size-13 font-weight-bold">Title</div>
            <input
              disabled={loading}
              value={saveData.title}
              placeholder="eg 3 / 4 Polyrhythm"
              type="text"
              onChange={(e) => updateSaveData('title', e.target.value)}
            />
          </div>
          <div className="flex flex-col text-left mb-8">
            <div className="font-size-13 font-weight-bold">Description</div>
            <textarea
              className=""
              disabled={loading}
              placeholder="optional notes for the metronome settings"
              value={saveData.description}
              onChange={(e) => updateSaveData('description', e.target.value)}
            />
          </div>
        </section>
      </Modal.Body>
      <Modal.Footer>
        <section className="flex justify-end">
          <button
            onClick={saveRhythm}
            disabled={
              loading ||
              saveData.title === '' ||
              (isSavedRhythm() && nothingToSave)
            }
            className="small filled"
          >
            {isSavedRhythm() ? 'update' : 'save'}
          </button>
        </section>
      </Modal.Footer>
    </Modal>
  );
}
