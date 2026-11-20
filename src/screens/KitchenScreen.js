import { useCallback, useEffect, useState } from 'react';
import { api, send } from '../api';

function optionLabels(options) {
  if (!options || typeof options !== 'object') return [];
  return Object.entries(options).flatMap(([key, value]) => {
    if (key === 'addons' && Array.isArray(value)) return value;
    return typeof value === 'string' && value ? [value] : [];
  });
}

export default function KitchenScreen({ token, stationId, stationName, revision, connected, onLogout }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const load = useCallback(() => {
    if (!stationId) return Promise.resolve();
    return api(`/staff/stations/${stationId}/queue`, { token })
      .then(setRows)
      .catch(e => setError(e.message));
  }, [stationId, token]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load, revision]);

  async function advance(item) {
    const status = item.status === 'NEW' ? 'PREPARING' : item.status === 'PREPARING' ? 'READY' : null;
    if (!status) return;
    setBusyId(item.id);
    setError('');
    try {
      await api(`/staff/order-items/${item.id}/status`, { token, ...send('PATCH', { status }) });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="kitchen-workspace">
      <header className="kitchen-topbar">
        <div>
          <span className="micro-label">KITCHEN DISPLAY</span>
          <h1>Station <em>{stationName || stationId || 'not assigned'}</em></h1>
          <span className="live-badge"><i />{connected ? 'LIVE UPDATES ON' : 'RECONNECTING'}</span>
        </div>
        <button className="quiet-button" type="button" onClick={onLogout}>SIGN OUT</button>
      </header>
      {error && <div className="notice error">{error}</div>}
      {!stationId ? (
        <div className="panel empty-state">Ask your manager to create a kitchen station and assign it to your staff account.</div>
      ) : rows.length ? (
        <section className="kitchen-ticket-grid" aria-label="Kitchen order queue">
          {rows.map(item => {
            const options = optionLabels(item.options);
            const nextStatus = item.status === 'NEW' ? 'PREPARING' : item.status === 'PREPARING' ? 'READY' : null;
            return (
              <article className={`panel kitchen-ticket ${item.status.toLowerCase()}`} key={item.id}>
                <div className="kitchen-ticket-heading">
                  <div><span className="micro-label">{item.orderType === 'DELIVERY' ? 'DELIVERY' : `TABLE ${item.tableNumber || '—'}`}</span><h2>{item.orderNumber}</h2></div>
                  <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
                <div className="kitchen-ticket-item"><strong>{item.quantity} × {item.name}</strong>{options.length > 0 && <span>{options.join(' · ')}</span>}</div>
                {item.note && <p className="kitchen-ticket-note">Kitchen note: {item.note}</p>}
                <footer>
                  <small>{new Date(item.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  {nextStatus
                    ? <button className="primary-button" type="button" disabled={busyId === item.id} onClick={() => advance(item)}>{busyId === item.id ? 'SAVING…' : `MARK ${nextStatus}`}<span>→</span></button>
                    : <span className="kitchen-ready">Ready for service</span>}
                </footer>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="panel empty-state">No accepted order items are waiting. Confirm the order is accepted and its menu items are assigned to this station.</div>
      )}
    </div>
  );
}
