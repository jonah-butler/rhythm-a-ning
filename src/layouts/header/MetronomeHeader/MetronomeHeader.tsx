import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import FolderIcon from '../../../assets/icons/folder.svg?react';
import GlobeIcon from '../../../assets/icons/globe.svg?react';
import ResetIcon from '../../../assets/icons/reset.svg?react';
import SaveIcon from '../../../assets/icons/save.svg?react';
import UserIcon from '../../../assets/icons/user-avatar.svg?react';
import RhythmCardHorizontal from '../../../components/Data/RhythmCard-Horizontal';
import { Loader } from '../../../components/Loader/Loader';
import Modal from '../../../components/Modals/Generic';
import { Tabs } from '../../../components/Tabs/Tabs';
import { useAuthContext } from '../../../context/useAuthContext';
import { useMetronomeBuilderContext } from '../../../context/useMetronomeContext';
import RhythmApi from '../../../services/api/rhythm';
import { type RhythmResponse } from '../../../services/api/types/rhythm.types';
import { rhythmToSlim } from '../../../services/rhythm.services';
import ResetModal from './Modals/RestModal';
import SaveModal from './Modals/SaveModal';

export type SaveData = {
  title: string;
  description: string;
};

export type SaveDataKeys = keyof SaveData;

export default function MetronomeHeader() {
  const LIMIT = 10;

  const { setRhythm, generateDefaultMetronome, isSavedRhythm } =
    useMetronomeBuilderContext();
  const { isAuthenticated } = useAuthContext();

  const [saveModal, setSaveModal] = useState(false);
  const [libraryModal, setLibraryModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [tabIndex, setTabIndex] = useState(0);

  const [rhythms, setRhythms] = useState<RhythmResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!libraryModal) return;

    let cancelled = false;

    async function getRhythmData() {
      try {
        setLoading(true);
        const response = await RhythmApi.getRhythms(offset);
        if (cancelled) return;
        setTotal(response.total);
        setRhythms(response.rhythms ?? []);
      } catch (err) {
        if (cancelled) return;
        let message = 'failed to load rhythms';
        if (err instanceof Error) {
          message += `: ${err.message}`;
        }

        toast(message, {
          type: 'error',
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getRhythmData();

    return () => {
      cancelled = true;
    };
  }, [libraryModal, offset, refreshKey]);

  const openSaveModal = (): void => {
    setSaveModal(true);
  };

  const closeLibraryModal = (): void => {
    setRhythms([]);
    setLibraryModal(false);
  };

  const deleteRhythmClick = async (uuid: string): Promise<void> => {
    try {
      setDeletingId(uuid);
      await RhythmApi.deleteRhythm(uuid);
      // the effect owns fetching; bumping the key re-runs it with the
      // cancellation guard already in place
      setRefreshKey((key) => key + 1);
    } catch (err) {
      let message = 'failed to delete rhythm';
      if (err instanceof Error) {
        message += `: ${err.message}`;
      }

      toast(message, {
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const loadNewRhythm = (uuid: string): void => {
    const selected = rhythms.find((rhythm) => rhythm.id === uuid);
    if (!selected) return;

    setRhythm(rhythmToSlim(selected));
    closeLibraryModal();
  };

  const handleResetModalClose = (confirm: boolean): void => {
    if (confirm) {
      setRhythm(generateDefaultMetronome());
    }
    setResetModal(false);
  };

  return (
    <section className="flex f-gap1">
      <button className="color-white small" onClick={() => setResetModal(true)}>
        <ResetIcon style={{ width: '18px' }} />
      </button>
      {isAuthenticated ? (
        <button
          className={`color-white small ${isSavedRhythm() ? 'emphasis' : ''}`}
          onClick={openSaveModal}
        >
          <SaveIcon style={{ width: '18px' }} />
        </button>
      ) : null}
      {isAuthenticated ? (
        <button
          className="color-white small"
          onClick={() => setLibraryModal(true)}
        >
          <FolderIcon style={{ width: '18px' }} />
        </button>
      ) : null}

      {saveModal ? (
        <SaveModal onModalClose={() => setSaveModal(false)} />
      ) : null}

      {resetModal ? (
        <ResetModal
          onModalClose={(confirm) => handleResetModalClose(confirm)}
        />
      ) : null}

      {libraryModal ? (
        <Modal close={closeLibraryModal} size="lg">
          <Modal.Header
            onClose={() => setLibraryModal(false)}
            subheader="Browse your saved rhythms and explore other default patterns"
          >
            <section>Rhythm Library</section>
          </Modal.Header>
          <Modal.Body>
            <section>
              <Tabs
                index={tabIndex}
                updateTab={setTabIndex}
                width="full"
                sticky={true}
              >
                <Tabs.Tab
                  label={
                    <span className="flex align-center f-gap2">
                      <UserIcon /> My Rhythms
                    </span>
                  }
                >
                  <section>
                    {loading ? (
                      <section className="flex width-100 justify-center height-4 align-center">
                        <Loader />
                      </section>
                    ) : null}
                    {!loading && rhythms.length > 0 ? (
                      <section className="flex flex-col f-gap2">
                        {rhythms.map((rhythm) => (
                          <RhythmCardHorizontal
                            key={rhythm.id}
                            rhythm={rhythm}
                            isDeleting={deletingId === rhythm.id}
                            handleDeleteRhythm={(uuid: string) =>
                              deleteRhythmClick(uuid)
                            }
                            handleLoad={loadNewRhythm}
                          />
                        ))}
                      </section>
                    ) : (
                      'No saved rhythms available'
                    )}

                    {rhythms.length > 0 ? (
                      <section className="flex mt-4 space-between">
                        <button
                          onClick={() => setOffset((prev) => (prev -= 1))}
                          disabled={LIMIT * offset === 0}
                          className="outline small"
                        >
                          previous
                        </button>
                        <button
                          onClick={() => setOffset((prev) => (prev += 1))}
                          disabled={total - LIMIT * offset <= LIMIT}
                          className="outline small"
                        >
                          next
                        </button>
                      </section>
                    ) : null}
                  </section>
                </Tabs.Tab>
                <Tabs.Tab
                  label={
                    <span className="flex align-center f-gap2">
                      <GlobeIcon /> Global
                    </span>
                  }
                >
                  <section>Global rhythms coming soon</section>
                </Tabs.Tab>
              </Tabs>
            </section>
          </Modal.Body>
        </Modal>
      ) : null}
    </section>
  );
}
