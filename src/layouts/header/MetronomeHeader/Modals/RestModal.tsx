import Modal from '../../../../components/Modals/Generic';
import { type ResetModalProps } from './ResetModal.types';

export default function ResetModal({ onModalClose }: ResetModalProps) {
  return (
    <Modal close={() => onModalClose(false)}>
      <Modal.Header
        onClose={() => onModalClose(false)}
        subheader="resetting the metronome will start a new session, losing any unsaved data from the current session."
      >
        <section>Reset Metronome?</section>
      </Modal.Header>
      <Modal.Footer>
        <section className="flex f-gap2 justify-end">
          <button onClick={() => onModalClose(false)}>cancel</button>
          <button className="filled" onClick={() => onModalClose(true)}>
            reset
          </button>
        </section>
      </Modal.Footer>
    </Modal>
  );
}
