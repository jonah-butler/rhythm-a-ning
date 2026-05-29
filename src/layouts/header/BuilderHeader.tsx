import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BuilderIcon from '../../assets/icons/builder.svg?react';
import FolderIcon from '../../assets/icons/folder.svg?react';
import NoteIcon from '../../assets/icons/note.svg?react';
import ResetIcon from '../../assets/icons/reset.svg?react';
import TrashIcon from '../../assets/icons/trash.svg?react';
import Modal from '../../components/Modals/Generic';
import {
  averageTempo,
  totalMeasures,
  totalTime,
} from '../../context/builder.helpers';
import type { RhythmBlock } from '../../context/BuilderContext.types';
import { type RhythmBlockStore } from '../../context/IndexedDB.types';
import { useRhythmBuilderContext } from '../../context/useBuilderContext';
import { useIndexedDBContext } from '../../context/useIndexedDBContext';

export default function BuilderHeader() {
  const [newWorkflowModalOpen, setNewWorkflowModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [workflows, setWorkflows] = useState<RhythmBlockStore[]>([]);

  const navigate = useNavigate();

  const { rhythmWorkflow, resetBlocks, setActiveBlocks, resetWorkflow } =
    useRhythmBuilderContext();

  const { saveWorkflow, getWorkflows, getWorkflowById, deleteWorkflowById } =
    useIndexedDBContext();

  const reset = () => {
    resetBlocks();
    closeResetModal();
  };

  const openNewWorkflowModal = () => {
    setNewWorkflowModalOpen(true);
  };

  const createNewWorkflow = async () => {
    const response = await saveWorkflow(rhythmWorkflow);
    if (response.error) {
      console.log('got an error: ', response.error);
    }

    resetWorkflow();
    setNewWorkflowModalOpen(false);
  };

  const closeModal = (): void => {
    setNewWorkflowModalOpen(false);
  };

  const closeResetModal = (): void => {
    setResetModalOpen(false);
  };

  const closeLoadModal = (): void => {
    setLoadModalOpen(false);
  };

  const openLoadModal = async (): Promise<void> => {
    setLoadModalOpen(true);
    const workflows = await getWorkflows();
    setWorkflows(workflows);
  };

  const getTotalMeasures = (workflow: RhythmBlock[]): number => {
    return totalMeasures(workflow);
  };

  const getAverageTempo = (workflow: RhythmBlock[]): number => {
    return averageTempo(workflow);
  };

  const getWorkflowTime = (workflow: RhythmBlock[]): string => {
    return totalTime(workflow);
  };

  const selectWorkflow = async (id: string): Promise<void> => {
    const workflow = await getWorkflowById(id);
    if (workflow) {
      setActiveBlocks(workflow);
    }

    setLoadModalOpen(false);
  };

  const handleMobileActionMenu = (fn: () => void): void => {
    fn();
    setMobileMenuOpen(false);
  };

  const deleteWorkflow = async (id: string): Promise<void> => {
    try {
      const didDelete = !(await deleteWorkflowById(id));
      if (!didDelete) {
        console.log('did not delete');
        return;
      }

      const workflows = await getWorkflows();
      setWorkflows(workflows);
    } catch (error) {
      console.log(error);
    } finally {
      toast('workflow deleted');
    }
  };

  return (
    <section className="flex f-gap1">
      <button
        className="mobile-menu-button color-white"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        ☰ Menu
      </button>
      <div className={`builder-actions ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          className="color-white font-size-13"
          onClick={() => handleMobileActionMenu(() => navigate('/metronome'))}
        >
          <NoteIcon style={{ width: '18px' }} /> Metronome
        </button>

        <button
          className="color-white font-size-13"
          onClick={() => handleMobileActionMenu(() => setResetModalOpen(true))}
        >
          <ResetIcon style={{ width: '18px' }} /> Reset
        </button>

        <button
          className="color-white font-size-13"
          onClick={() => handleMobileActionMenu(() => openNewWorkflowModal())}
        >
          <BuilderIcon style={{ width: '18px' }} /> New
        </button>

        <button
          className="color-white font-size-13"
          onClick={() => handleMobileActionMenu(() => openLoadModal())}
        >
          <FolderIcon style={{ width: '18px' }} /> Load
        </button>
      </div>
      {newWorkflowModalOpen ? (
        <Modal close={closeModal}>
          <Modal.Header onClose={closeModal}>Create New Workflow</Modal.Header>
          <Modal.Body>
            <section className="flex width-100 space-between align-center mb-2">
              build a new workflow from scratch
            </section>
          </Modal.Body>
          <Modal.Footer>
            <section className="flex f-gap2 justify-end">
              <button
                onClick={closeModal}
                className="small outline color-white"
              >
                cancel
              </button>
              <button
                onClick={() => createNewWorkflow()}
                className="small filled"
              >
                new workflow
              </button>
            </section>
          </Modal.Footer>
        </Modal>
      ) : null}

      {resetModalOpen ? (
        <Modal close={closeResetModal}>
          <Modal.Header onClose={closeResetModal}>Reset Workflow</Modal.Header>
          <Modal.Body>Do you really want to reset your workflow?</Modal.Body>
          <Modal.Footer>
            <section className="flex f-gap2 justify-end">
              <button onClick={() => reset()} className="small filled">
                reset
              </button>
            </section>
          </Modal.Footer>
        </Modal>
      ) : null}

      {loadModalOpen ? (
        <Modal close={closeLoadModal}>
          <Modal.Header onClose={closeLoadModal}>Saved Workflows</Modal.Header>
          <Modal.SubHeader>Load a previously saved workflow</Modal.SubHeader>
          <Modal.Body>
            <section>
              {workflows.length ? (
                <table>
                  <thead>
                    <tr className="text-light">
                      <th>Name</th>
                      <th>Blocks</th>
                      <th>Measures</th>
                      <th>Avg. Tempo</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.map((workflow) => {
                      return (
                        <tr
                          key={workflow.id}
                          onClick={() => selectWorkflow(workflow.id)}
                        >
                          <td>{workflow.name}</td>
                          <td>{workflow.blocks.length}</td>
                          <td>{getTotalMeasures(workflow.blocks)}</td>
                          <td>{getAverageTempo(workflow.blocks)}</td>
                          <td>{getWorkflowTime(workflow.blocks)}</td>
                          <td>
                            {' '}
                            <button
                              className="color-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWorkflow(workflow.id);
                              }}
                            >
                              <TrashIcon style={{ width: '12px' }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </section>
          </Modal.Body>
          <Modal.Footer>
            <section className="flex f-gap2 justify-end">
              <button
                onClick={closeLoadModal}
                className="small outline color-white"
              >
                cancel
              </button>
            </section>
          </Modal.Footer>
        </Modal>
      ) : null}
    </section>
  );
}
