import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuilderIcon from '../../assets/icons/builder.svg?react';
import FolderIcon from '../../assets/icons/folder.svg?react';
import SaveIcon from '../../assets/icons/save.svg?react';
import Modal from '../../components/Modals/Generic';

export type SaveData = {
  title: string;
  description: string;
};

export type SaveDataKeys = keyof SaveData;

export default function MetronomeHeader() {
  const navigate = useNavigate();

  const [saveModal, setSaveModal] = useState(false);
  const [libraryModal, setLibraryModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [saveData, setSaveData] = useState<SaveData>({
    title: '',
    description: '',
  });

  const updateSaveData = <K extends keyof SaveData>(
    key: K,
    value: SaveData[K],
  ) => {
    setSaveData((prev) => ({ ...prev, [key]: value }));
  };

  const saveRhythm = async (): Promise<void> => {};

  return (
    <section className="flex f-gap1">
      <button className="color-white" onClick={() => navigate('/builder')}>
        <BuilderIcon style={{ width: '18px' }} />
      </button>
      <button className="color-white" onClick={() => setSaveModal(true)}>
        <SaveIcon style={{ width: '18px' }} />
      </button>
      <button className="color-white" onClick={() => setLibraryModal(true)}>
        <FolderIcon style={{ width: '18px' }} />
      </button>

      {saveModal ? (
        <Modal close={() => setSaveModal(false)} size="sm">
          <Modal.Header onClose={() => setSaveModal(false)}>
            <section>Save Rhythm</section>
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
                  onChange={(e) =>
                    updateSaveData('description', e.target.value)
                  }
                />
              </div>
            </section>
          </Modal.Body>
          <Modal.Footer>
            <section className="flex justify-end">
              <button
                onClick={saveRhythm}
                disabled={saveData.title === ''}
                className="small filled"
              >
                save
              </button>
            </section>
          </Modal.Footer>
        </Modal>
      ) : null}

      {libraryModal ? (
        <Modal close={() => setLibraryModal(false)}>
          <Modal.Header onClose={() => setLibraryModal(false)}>
            <section>ok</section>
          </Modal.Header>
          <Modal.Body>
            <section>okkkk</section>
          </Modal.Body>
        </Modal>
      ) : null}
    </section>
  );
}
