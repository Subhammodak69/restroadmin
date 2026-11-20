import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const parseDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const dateValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function DateField({ label, value, onChange, max, min }) {
  const id = useId();
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const selectedDate = parseDate(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState(value || dateValue(new Date()));
  const [month, setMonth] = useState(() => {
    const initial = parseDate(value) || new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [position, setPosition] = useState(null);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const placePopup = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 304;
    const height = Math.min(366, window.innerHeight - 16);
    const gap = 8;
    const below = window.innerHeight - rect.bottom - gap;
    const above = rect.top - gap;
    const opensUp = below < height && above > below;
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: opensUp ? Math.max(8, rect.top - height - gap) : Math.min(rect.bottom + gap, window.innerHeight - height - 8),
      opensUp
    });
  }, []);

  useLayoutEffect(() => { if (open) placePopup(); }, [open, placePopup]);
  useEffect(() => {
    if (open && focusedDate) popupRef.current?.querySelector(`[data-date="${focusedDate}"]`)?.focus();
  }, [focusedDate, month, open]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = event => {
      if (!triggerRef.current?.contains(event.target) && !popupRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', placePopup);
    window.addEventListener('scroll', placePopup, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', placePopup);
      window.removeEventListener('scroll', placePopup, true);
    };
  }, [open, placePopup]);

  function isAllowed(date) {
    const value = dateValue(date);
    return (!min || value >= min) && (!max || value <= max);
  }
  function selectDate(date) {
    if (!isAllowed(date)) return;
    onChange(dateValue(date));
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setOpen(false);
    triggerRef.current?.focus();
  }
  function changeMonth(amount) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }
  function moveFocus(date) {
    let next = date;
    if (min && dateValue(next) < min) next = minDate;
    if (max && dateValue(next) > max) next = maxDate;
    setFocusedDate(dateValue(next));
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }
  function onDayKeyDown(event, date) {
    let next = null;
    if (event.key === 'ArrowLeft') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    if (event.key === 'ArrowRight') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    if (event.key === 'ArrowUp') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
    if (event.key === 'ArrowDown') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
    if (event.key === 'Home') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    if (event.key === 'End') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      const offset = event.key === 'PageUp' ? -1 : 1;
      const year = date.getFullYear();
      const targetMonth = date.getMonth() + offset;
      const lastDay = new Date(year, targetMonth + 1, 0).getDate();
      next = new Date(year, targetMonth, Math.min(date.getDate(), lastDay));
    }
    if (next) { event.preventDefault(); moveFocus(next); }
  }

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = new Date(month.getFullYear(), month.getMonth(), 1 - monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index));
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);
  const displayValue = selectedDate ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate) : 'Choose date';
  const portalRoot = document.querySelector('.admin-app') || document.body;

  return <div className="date-field">
    <span className="date-field-label">{label}</span>
    <button ref={triggerRef} type="button" className={`date-trigger ${open ? 'is-open' : ''}`} aria-label={`${label}: ${displayValue}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={`calendar-${id}`} onClick={() => {
      if (!open) {
        const initial = selectedDate || new Date();
        setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
        setFocusedDate(dateValue(initial));
        setOpen(true);
      } else setOpen(false);
    }}>
      <span>{displayValue}</span><span className="date-trigger-icon" aria-hidden="true">▦</span>
    </button>
    {open && position && createPortal(<div ref={popupRef} id={`calendar-${id}`} role="dialog" aria-label={`${label} date picker`} className={`calendar-popover ${position.opensUp ? 'opens-up' : ''}`} style={{ left: position.left, top: position.top }}>
      <div className="calendar-heading"><strong>{monthLabel}</strong><div><button type="button" className="calendar-nav-button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button><button type="button" className="calendar-nav-button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button></div></div>
      <div className="calendar-grid" role="grid" aria-label={monthLabel}>
        {WEEKDAYS.map(day => <span className="calendar-weekday" role="columnheader" key={day}>{day}</span>)}
        {days.map(day => {
          const inMonth = day.getMonth() === month.getMonth();
          const selected = selectedDate && sameDay(day, selectedDate);
          const isToday = sameDay(day, today);
          const allowed = isAllowed(day);
          const isoDate = dateValue(day);
          return <button type="button" role="gridcell" data-date={isoDate} tabIndex={focusedDate === isoDate ? 0 : -1} aria-label={new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(day)} aria-selected={Boolean(selected)} aria-current={isToday ? 'date' : undefined} disabled={!allowed} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${selected ? 'selected' : ''} ${isToday ? 'today' : ''}`} key={isoDate} onKeyDown={event => onDayKeyDown(event, day)} onClick={() => selectDate(day)}>{day.getDate()}</button>;
        })}
      </div>
      <div className="calendar-footer"><button type="button" className="calendar-clear" onClick={() => { onChange(''); setOpen(false); }}>Clear</button><button type="button" className="calendar-today" disabled={!isAllowed(today)} onClick={() => selectDate(today)}>Today</button></div>
    </div>, portalRoot)}
  </div>;
}
