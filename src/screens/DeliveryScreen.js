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
      <section className="panel delivery-table-panel">
        <div className="panel-title"><div><span className="micro-label">DELIVERY QUEUE</span><h2>{rows.length} {rows.length === 1 ? 'order' : 'orders'}</h2></div><span className="live-badge"><i/> LIVE</span></div>
        {rows.length ? (
          <div className="data-table-wrap delivery-table-wrap">
            <table className="data-table delivery-table" aria-label="Delivery orders">
              <thead><tr><th>ORDER</th><th>GUEST &amp; ADDRESS</th><th>PLACED</th><th>KITCHEN</th><th>COURIER</th><th>DELIVERY PROGRESS</th><th>ACTION</th></tr></thead>
              <tbody>
                {rows.map(order => {
                  const deliveryStatus = String(order.deliveryStatus || 'UNASSIGNED').toUpperCase();
                  const next = nextStatus[deliveryStatus];
                  const stageIndex = deliveryStages.indexOf(deliveryStatus);
                  const progressIndex = Math.max(stageIndex, 0);
                  const needsCourier = ['UNASSIGNED', 'FAILED'].includes(deliveryStatus);
                  const canProgress = next && (!needsCourier || Boolean(order.staffId)) && (next !== 'PICKED_UP' || order.status === 'READY');
                  const address = [order.address?.line1, order.address?.city, order.address?.postalCode].filter(Boolean).join(', ');
                  return (
                    <tr key={order.id}>
                      <td><b>{order.orderNumber}</b><small>₹{Number(order.total || 0).toLocaleString('en-IN')}</small></td>
                      <td><strong className="delivery-guest-name">{order.address?.recipientName || 'Guest'}</strong><small className="delivery-address">{address || 'Address unavailable'}</small></td>
                      <td><time dateTime={order.placedAt}>{new Date(order.placedAt).toLocaleString()}</time></td>
                      <td><span className={`status-pill ${String(order.status).toLowerCase()}`}>{order.status}</span></td>
                      <td>
                        <div className="delivery-table-assignment">
                          <span>{order.staffName || 'Not assigned'}</span>
                          <CustomSelect
                            value={String(order.staffId || '')}
                            onChange={staffId => {
                              if (!staffId && !order.staffId) return;
                              update(order, staffId ? 'ASSIGNED' : 'UNASSIGNED', staffId);
                            }}
                            disabled={busyId === order.id || !staff.length || !['UNASSIGNED', 'ASSIGNED', 'FAILED'].includes(deliveryStatus)}
                            placeholder="Choose courier"
                            options={[...(order.staffId ? [{ value: '', label: 'Unassign courier' }] : []), ...staff.map(member => ({ value: String(member.id), label: `${member.name} · ${member.phone}` }))]}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="delivery-table-progress">
                          <span className={`status-pill ${deliveryStatus.toLowerCase()}`}>{deliveryStatus.replaceAll('_', ' ')}</span>
                          <div className="delivery-table-track" role="progressbar" aria-label={`${order.orderNumber} delivery progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progressIndex / (deliveryStages.length - 1)) * 100)}>
                            <i style={{ width: `${(progressIndex / (deliveryStages.length - 1)) * 100}%` }}/>
                          </div>
                          <small>{stageIndex < 0 ? 'Delivery issue' : `${stageIndex + 1} of ${deliveryStages.length} steps`}</small>
                        </div>
                      </td>
                      <td className="delivery-action-cell">
                        {deliveryStatus === 'ASSIGNED' && order.status !== 'READY' && <small className="delivery-hint">Kitchen must mark ready before pickup.</small>}
                        {next ? <button className="primary-button delivery-progress-button" type="button" disabled={!canProgress || busyId === order.id} onClick={() => progress(order)}>{busyId === order.id ? 'SAVING…' : `MARK ${next.replaceAll('_', ' ')}`}<span>→</span></button> : <small className="delivery-hint">Delivery complete.</small>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state">No home delivery orders yet.</div>}
      </section>
    </div>
  );
}
