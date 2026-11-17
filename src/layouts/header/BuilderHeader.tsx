import { useState } from 'react';
import { toast } from 'react-toastify';
import BuilderIcon from '../../assets/icons/builder.svg?react';
import FolderIcon from '../../assets/icons/folder.svg?react';
import PlusIcon from '../../assets/icons/plus.svg?react';
import ResetIcon from '../../assets/icons/reset.svg?react';
import SectionsIcon from '../../assets/icons/sections.svg?react';
import TrashIcon from '../../assets/icons/trash.svg?react';
import Modal from '../../components/Modals/Generic';
import { fromWorkflowResponse } from '../../context/builder.helpers';
import type { Section } from '../../context/BuilderContext.types';
import { useAuthContext } from '../../context/useAuthContext';
import { useRhythmBuilderContext } from '../../context/useBuilderContext';
import type { WorkflowListItem } from '../../services/api/types/workflow.types';
import WorkflowApi from '../../services/api/workflow';
import { generateUUID } from '../../services/rhythm.services';

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'unknown error';

export default function BuilderHeader() {
  const [newWorkflowModalOpen, setNewWorkflowModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sectionsModalOpen, setSectionsModalOpen] = useState(false);
  const [sectionColor, setSectionColor] = useState('#f821ad');
  const [sectionName, setSectionName] = useState('');

  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);

  const {
    rhythmWorkflow,
    resetBlocks,
    setActiveBlocks,
    resetWorkflow,
    addSection,
    deleteSection,
    updateSection,
    saveWorkflow,
  } = useRhythmBuilderContext();

  const { isAuthenticated } = useAuthContext();

  const reset = () => {
    resetBlocks();
    closeResetModal();
  };

  const openNewWorkflowModal = () => {
    setNewWorkflowModalOpen(true);
  };

  const openSectionsModal = () => {
    setSectionsModalOpen(true);
  };

  const createNewWorkflow = async () => {
    if (isAuthenticated) {
      try {
        await saveWorkflow();
      } catch (err) {
        toast(`failed to save workflow: ${errorMessage(err)}`, {
          type: 'error',
        });
        return;
      }
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

  // first page only for now
  const fetchWorkflows = async (): Promise<void> => {
    try {
      const { workflows } = await WorkflowApi.getWorkflows(0);
      setWorkflows(workflows);
    } catch (err) {
      toast(`failed to get workflows: ${errorMessage(err)}`, { type: 'error' });
    }
  };

  const openLoadModal = async (): Promise<void> => {
    setLoadModalOpen(true);
    await fetchWorkflows();
  };

  const getWorkflowTime = (totalMinutes: number): string => {
    return totalMinutes.toFixed(2).replace('.', ':');
  };

  const selectWorkflow = async (id: string): Promise<void> => {
    try {
      const workflow = await WorkflowApi.getWorkflowById(id);
      setActiveBlocks(fromWorkflowResponse(workflow));
      setLoadModalOpen(false);
    } catch (err) {
      toast(`failed to load workflow: ${errorMessage(err)}`, { type: 'error' });
    }
  };

  const handleMobileActionMenu = (fn: () => void): void => {
    fn();
    setMobileMenuOpen(false);
  };

  const handleAddSection = (): void => {
    const section: Section = {
      id: Date.now(),
      color: sectionColor,
      label: sectionName,
      value: generateUUID(), // sent to the api as sectionId
    };

    addSection(section);
    // setSectionColor('#f821ad');
    setSectionName('');
  };

  const deleteWorkflow = async (id: string): Promise<void> => {
    try {
      await WorkflowApi.deleteWorkflow(id);
    } catch (err) {
      toast(`failed to delete workflow: ${errorMessage(err)}`, {
        type: 'error',
      });
      return;
    }

    // the open workflow no longer exists; a later save would PUT to a 404
    if (id === rhythmWorkflow.id) {
      resetWorkflow();
    }

    toast('workflow deleted');
    await fetchWorkflows();
  };

  return (
    <section className="flex f-gap1">
      <button
        className="mobile-menu-button color-white"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        ☰
      </button>
      <div className={`builder-actions ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          className="color-white font-size-13"
          onClick={() => handleMobileActionMenu(() => openSectionsModal())}
        >
          <SectionsIcon style={{ width: '18px' }} /> Sections
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

        {isAuthenticated ? (
          <button
            className="color-white font-size-13"
            onClick={() => handleMobileActionMenu(() => openLoadModal())}
          >
            <FolderIcon style={{ width: '18px' }} /> Load
          </button>
        ) : null}
      </div>

      {sectionsModalOpen ? (
        <Modal close={() => setSectionsModalOpen(false)}>
          <Modal.Header onClose={() => setSectionsModalOpen(false)}>
            Add a Section
          </Modal.Header>
          <Modal.Body>
            <section>
              {rhythmWorkflow.sections.length ? (
                <table>
                  <thead>
                    <tr className="text-light">
                      <th>Color</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rhythmWorkflow.sections
                      .filter((section) => section.label !== 'None')
                      .map((section, i) => {
                        return (
                          <tr key={i}>
                            <td>
                              {section.color ? (
                                <input
                                  disabled={section.label === 'None'}
                                  type="color"
                                  value={`${section.color}`}
                                  onChange={(e) =>
                                    updateSection({
                                      ...section,
                                      color: e.target.value,
                                    })
                                  }
                                ></input>
                              ) : (
                                '--'
                              )}
                            </td>
                            <td>
                              <input
                                disabled={section.label === 'None'}
                                type="text"
                                value={section.label}
                                onChange={(e) =>
                                  updateSection({
                                    ...section,
                                    label: e.target.value,
                                  })
                                }
                              ></input>
                            </td>
                            <td>
                              {' '}
                              <button
                                className="color-white"
                                onClick={() => deleteSection(section.id)}
                              >
                                <TrashIcon style={{ width: '12px' }} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    <tr>
                      <td>
                        <input
                          onChange={(e) => setSectionColor(e.target.value)}
                          type="color"
                          value={sectionColor}
                        ></input>
                      </td>
                      <td>
                        <input
                          onChange={(e) => setSectionName(e.target.value)}
                          type="text"
                          value={sectionName}
                        ></input>
                      </td>
                      <td>
                        {' '}
                        <button
                          disabled={!sectionName}
                          className="color-white"
                          onClick={handleAddSection}
                        >
                          <PlusIcon style={{ width: '12px' }} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : null}
            </section>
          </Modal.Body>
          <Modal.Footer>
            <section className="flex f-gap2 justify-end">
              <button
                onClick={() => setSectionsModalOpen(false)}
                className="small outline color-white"
              >
                cancel
              </button>
            </section>
          </Modal.Footer>
        </Modal>
      ) : null}

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
                          key={workflow.workflowId}
                          onClick={() => selectWorkflow(workflow.workflowId)}
                        >
                          <td>{workflow.name}</td>
                          <td>{workflow.blockCount}</td>
                          <td>{workflow.totalMeasures}</td>
                          <td>{workflow.averageTempo}</td>
                          <td>{getWorkflowTime(workflow.totalMinutes)}</td>
                          <td>
                            {' '}
                            <button
                              className="color-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWorkflow(workflow.workflowId);
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
