import { useCallback, useEffect, useState } from 'react';
import { api, send } from '../api';
import CustomSelect from '../components/CustomSelect';

const nextStatus = { UNASSIGNED: 'ASSIGNED', ASSIGNED: 'PICKED_UP', PICKED_UP: 'ON_THE_WAY', ON_THE_WAY: 'DELIVERED', FAILED: 'ASSIGNED' };
const deliveryStages = ['UNASSIGNED', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];

export default function DeliveryScreen({ token, revision }) {
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const load = useCallback(() => Promise.all([
    api('/admin/delivery', { token }),
    api('/admin/staff', { token })
  ]).then(([orders, team]) => {
    setRows(orders);
    setStaff(team.filter(member => member.role === 'DELIVERY' && member.isActive));
    setError('');
  }).catch(e => setError(e.message)), [token]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 20000);
    return () => window.clearInterval(timer);
  }, [load, revision]);

  async function update(order, status, staffId) {
    setBusyId(order.id);
    setError('');
    try {
      await api(`/admin/delivery/${order.id}`, {
        token,
        ...send('PATCH', { status, ...(staffId ? { staffId: Number(staffId) } : {}) })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function progress(order) {
    const status = nextStatus[order.deliveryStatus];
    if (!status || (status === 'PICKED_UP' && order.status !== 'READY')) return;
    await update(order, status, order.staffId);
  }

  return (
    <div className="screen-stack">
      <div className="screen-heading"><div><span className="micro-label">HOME DELIVERY OPERATIONS</span><h1>On the <em>road.</em></h1><p>Assign a courier and advance each delivery as it moves.</p></div><span className="live-badge"><i/> LIVE</span></div>
      {error && <div className="notice error">{error}</div>}
      {!staff.length && <div className="notice">No active delivery staff. Add a delivery staff account in Settings before assigning orders.</div>}
      <section className="delivery-grid">
        {rows.length ? rows.map(order => {
          const next = nextStatus[order.deliveryStatus];
          const needsCourier = ['UNASSIGNED', 'FAILED'].includes(order.deliveryStatus);
          const canProgress = next && (!needsCourier || Boolean(order.staffId)) && (next !== 'PICKED_UP' || order.status === 'READY');
          return (
            <article className="panel delivery-card" key={order.id}>
              <div className="panel-title"><div><b>{order.orderNumber}</b><span className={`status-pill ${String(order.deliveryStatus).toLowerCase()}`}>{order.deliveryStatus}</span></div><span className={`status-pill ${String(order.status).toLowerCase()}`}>{order.status}</span></div>
              <address>{order.address?.recipientName && <>{order.address.recipientName}<br/></>}{order.address?.line1}<br/>{order.address?.city}, {order.address?.postalCode}</address>
              <small>Placed {new Date(order.placedAt).toLocaleString()}</small>
              <label className="delivery-assign">ASSIGN COURIER
                <CustomSelect
                  value={String(order.staffId || '')}
                  onChange={staffId => {
                    if (!staffId && !order.staffId) return;
                    update(order, staffId ? 'ASSIGNED' : 'UNASSIGNED', staffId);
                  }}
                  disabled={busyId === order.id || !staff.length || !['UNASSIGNED', 'ASSIGNED', 'FAILED'].includes(order.deliveryStatus)}
                  placeholder={order.staffName || 'Choose active delivery staff'}
                  options={[...(order.staffId ? [{ value: '', label: 'Unassign courier' }] : []), ...staff.map(member => ({ value: String(member.id), label: `${member.name} · ${member.phone}` }))]}
                />
              </label>
              <div className="delivery-steps" aria-label="Delivery progress">
                {deliveryStages.map((stage, index) => <span className={`step ${order.deliveryStatus === stage ? 'current' : index < deliveryStages.indexOf(order.deliveryStatus) ? 'complete' : ''}`} key={stage}>{stage.replaceAll('_', ' ')}</span>)}
              </div>
              {order.deliveryStatus === 'ASSIGNED' && order.status !== 'READY' && <small className="delivery-hint">The kitchen must mark this order ready before courier pickup.</small>}
              {next && <button className="primary-button delivery-progress-button" type="button" disabled={!canProgress || busyId === order.id} onClick={() => progress(order)}>{busyId === order.id ? 'SAVING…' : `MARK ${next.replaceAll('_', ' ')}`}<span>→</span></button>}
              {!next && <small className="delivery-hint">Delivery complete.</small>}
            </article>
          );
        }) : <div className="panel empty-state">No home delivery orders yet.</div>}
      </section>
    </div>
  );
}
