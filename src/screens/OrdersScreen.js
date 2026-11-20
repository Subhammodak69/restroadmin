import { useCallback, useEffect, useState } from 'react';
import { api, send } from '../api';
import { OrderRows } from './DashboardScreen';
import CustomSelect from '../components/CustomSelect';

const nextStatus = { NEW: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'READY', READY: 'SERVED' };
const statusOptions = ['', 'NEW', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'SERVED', 'CANCELLED']
  .map(status => ({ value: status, label: status ? status.replaceAll('_', ' ') : 'All statuses' }));

export default function OrdersScreen({ token, revision, onManageDelivery }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState(null);
  const load = useCallback(() => {
    setError('');
    return api(`/admin/orders${filter ? `?status=${filter}` : ''}`, { token })
      .then(setRows)
      .catch(e => setError(e.message));
  }, [filter, token]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 20000);
    return () => window.clearInterval(timer);
  }, [load, revision]);

  async function advance(order) {
    const status = nextStatus[order.status];
    if (!status) return;
    setBusyId(order.id);
    setError('');
    try {
      await api(`/admin/orders/${order.id}/status`, { token, ...send('PATCH', { status }) });
      setRows(current => current.map(row => row.id === order.id ? { ...row, status } : row));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function actions(order) {
    if (order.orderType === 'DELIVERY') {
      return <button className="inline-action" type="button" onClick={onManageDelivery}>{order.status === 'DELIVERED' ? 'VIEW DELIVERY →' : 'MANAGE DELIVERY →'}</button>;
    }
    const next = nextStatus[order.status];
    return next
      ? <button className="inline-action" type="button" disabled={busyId === order.id} onClick={() => advance(order)}>{busyId === order.id ? 'SAVING…' : `MARK ${next.replaceAll('_', ' ')} →`}</button>
      : <span className="muted-caption">No action</span>;
  }

  return (
    <div className="screen-stack">
      <div className="screen-heading">
        <div><span className="micro-label">LIVE OPERATIONS</span><h1>Orders <em>in motion.</em></h1><p>Accept orders, manage kitchen progress, and assign home deliveries.</p></div>
        <CustomSelect value={filter} onChange={setFilter} options={statusOptions}/>
      </div>
      {error && <div className="notice error">{error}</div>}
      <section className="panel">
        <div className="panel-title"><div><span className="micro-label">MOST RECENT FIRST</span><h2>Order catalog</h2></div><span className="live-badge"><i/> LIVE</span></div>
        <OrderRows rows={rows} renderActions={actions}/>
      </section>
      <section className="panel">
        <div className="panel-title"><div><span className="micro-label">ITEM DETAIL</span><h2>Kitchen notes</h2></div></div>
        <div className="order-detail-grid">{rows.slice(0, 8).map(order => <article className="order-detail-card" key={order.id}><div><b>{order.orderNumber}</b><span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span></div><p>{(order.items || []).map(item => `${item.quantity} × ${item.name}${item.note ? ` — ${item.note}` : ''}`).join(' · ') || 'No items loaded'}</p></article>)}</div>
      </section>
    </div>
  );
}
