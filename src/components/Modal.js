import { useEffect, useRef } from 'react';

export default function Modal({ title, description, onClose, children, actions, size = 'medium' }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') closeRef.current?.();
    }
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, []);

  return <div className="dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose?.()}>
    <section className={`dialog-panel dialog-${size}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header className="dialog-header">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        <span className="micro-label">RESTAURANT WORKSPACE</span>
        <h2 id="dialog-title">{title}</h2>
        {description&&<p className="dialog-description">{description}</p>}
      </header>
      <div className="dialog-content">{children}</div>
      {actions&&<footer className="dialog-actions">{actions}</footer>}
    </section>
  </div>;
}
