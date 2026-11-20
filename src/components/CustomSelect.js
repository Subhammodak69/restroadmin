import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CustomSelect({ value, onChange, options, placeholder = 'Select an option', disabled = false, ariaLabel, className = '' }) {
  const id = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const selectedIndex = options.findIndex(option => String(option.value) === String(value));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const placeMenu = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 7;
    const below = window.innerHeight - rect.bottom - gap;
    const above = rect.top - gap;
    const desired = Math.min(280, Math.max(44, options.length * 39 + 8));
    const opensUp = below < desired && above > below;
    const available = opensUp ? above : below;
    const height = Math.max(90, Math.min(desired, available));
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
      maxHeight: height,
      top: opensUp ? Math.max(8, rect.top - height - gap) : Math.min(rect.bottom + gap, window.innerHeight - height - 8),
      opensUp
    });
  }, [options.length]);

  useLayoutEffect(() => { if (open) placeMenu(); }, [open, placeMenu]);
  useEffect(() => {
    if (open) menuRef.current?.querySelector(`[data-option-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = event => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [open, placeMenu]);

  function choose(option) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }
  function handleKeyDown(event) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) event.preventDefault();
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      setActiveIndex(Math.max(0, selectedIndex));
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') setActiveIndex(index => Math.min(options.length - 1, index + 1));
    if (event.key === 'ArrowUp') setActiveIndex(index => Math.max(0, index - 1));
    if (event.key === 'Home') setActiveIndex(0);
    if (event.key === 'End') setActiveIndex(options.length - 1);
    if (event.key === 'Enter' && open && options[activeIndex]) choose(options[activeIndex]);
  }

  return <>
    <button ref={triggerRef} type="button" className={`custom-select-trigger ${open ? 'is-open' : ''} ${className}`} disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={`select-menu-${id}`} onClick={() => { setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0); setOpen(current => !current); }} onKeyDown={handleKeyDown}>
      <span className={selected ? '' : 'custom-select-placeholder'}>{selected?.label ?? placeholder}</span><i className="custom-select-chevron" aria-hidden="true"/>
    </button>
    {open && position && createPortal(<div ref={menuRef} id={`select-menu-${id}`} role="listbox" className={`custom-select-menu ${position.opensUp ? 'opens-up' : ''}`} style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}>
      {options.map((option, index) => <button id={`select-option-${id}-${index}`} data-option-index={index} type="button" role="option" aria-selected={String(option.value) === String(value)} disabled={option.disabled} className={`custom-select-option ${String(option.value) === String(value) ? 'selected' : ''} ${activeIndex === index ? 'active' : ''}`} key={`${option.value}-${option.label}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}>{option.label}{String(option.value) === String(value) && <span>✓</span>}</button>)}
      {!options.length && <div className="custom-select-empty">No options available</div>}
    </div>, document.querySelector('.admin-app') || document.body)}
  </>;
}
