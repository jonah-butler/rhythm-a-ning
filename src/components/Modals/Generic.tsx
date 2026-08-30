import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../../css/ModalGeneric.css';

type ModalProps = {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  close: () => void;
};

export default function Modal({ children, size, close }: ModalProps) {
  const portalRoot = document.body;

  if (!portalRoot) {
    return null;
  }

  const closeBackdrop = (): void => {
    close();
  };

  return (
    <div>
      {createPortal(
        <div className={`modal ${size ? size : ''}`}>{children}</div>,
        portalRoot,
      )}
      {createPortal(
        <div className="modal-backdrop" onClick={closeBackdrop}></div>,
        portalRoot,
      )}
    </div>
  );
}

type ModalBodyProps = {
  children: ReactNode;
  subheader?: string;
  onClose?: () => void;
};

Modal.Header = function Header({
  children,
  onClose,
  subheader,
}: ModalBodyProps) {
  return (
    <section className="modal-header mb-8">
      <div onClick={onClose} className="modal-close">
        &times;
      </div>
      <h2>{children}</h2>
      <p className="color-secondary font-size-14">{subheader}</p>
    </section>
  );
};

Modal.SubHeader = function Header({ children }: ModalBodyProps) {
  return (
    <section className="modal-subheader">
      <div className="text-light font-size-13">{children}</div>
    </section>
  );
};

Modal.Body = function Body({ children }: ModalBodyProps) {
  return <section className="modal-body">{children}</section>;
};

Modal.Footer = function Body({ children }: ModalBodyProps) {
  return <section className="modal-footer">{children}</section>;
};
