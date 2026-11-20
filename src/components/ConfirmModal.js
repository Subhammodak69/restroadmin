import Modal from './Modal';

export default function ConfirmModal({ title, description, confirmText = 'CONFIRM', danger = false, busy = false, onConfirm, onCancel }) {
  return <Modal title={title} description={description} onClose={onCancel} size="small" actions={<>
    <button className="dialog-secondary" type="button" onClick={onCancel} disabled={busy}>CANCEL</button>
    <button className={danger?'dialog-primary danger':'dialog-primary'} type="button" onClick={onConfirm} disabled={busy}>{busy?'PLEASE WAIT…':confirmText}</button>
  </>} />;
}
