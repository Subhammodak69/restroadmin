import { useCallback, useEffect, useState } from 'react';
import { api, send } from '../api';
import CustomSelect from '../components/CustomSelect';

export default function SettingsScreen({ token }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('/admin/settings', { token }).then(setForm).catch(e => setError(e.message));
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    try {
      const result = await api('/admin/settings', {
        token,
        ...send('PATCH', {
          ...form,
          taxPercent: Number(form.taxPercent),
          serviceChargePercent: Number(form.serviceChargePercent),
          deliveryFee: Number(form.deliveryFee),
          minDeliveryOrder: Number(form.minDeliveryOrder)
        })
      });
      setForm(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    }
  }

  if (!form) return <div className="empty-state">{error || 'Loading restaurant settings…'}</div>;
  return (
    <div className="screen-stack">
      <div className="screen-heading"><div><span className="micro-label">RESTAURANT CONFIGURATION</span><h1>Your house, <em>your rules.</em></h1><p>Contact, service, tax, and delivery details.</p></div></div>
      {error && <div className="notice">{error}</div>}
      <form className="panel form-panel" onSubmit={submit}>
        <div className="panel-title"><div><span className="micro-label">PUBLIC DETAILS</span><h2>Restaurant settings</h2></div></div>
        <div className="form-grid">
          <label>RESTAURANT NAME<input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
          <label>TAGLINE<input value={form.tagline || ''} onChange={e => setForm({ ...form, tagline: e.target.value })}/></label>
          <label>PHONE<input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })}/></label>
          <label>EMAIL<input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}/></label>
          <label>TAX %<input type="number" min="0" max="100" step=".01" value={form.taxPercent} onChange={e => setForm({ ...form, taxPercent: e.target.value })}/></label>
          <label>SERVICE CHARGE %<input type="number" min="0" max="100" step=".01" value={form.serviceChargePercent} onChange={e => setForm({ ...form, serviceChargePercent: e.target.value })}/></label>
          <label>DELIVERY FEE<input type="number" min="0" step=".01" value={form.deliveryFee} onChange={e => setForm({ ...form, deliveryFee: e.target.value })}/></label>
          <label>MIN DELIVERY ORDER<input type="number" min="0" step=".01" value={form.minDeliveryOrder} onChange={e => setForm({ ...form, minDeliveryOrder: e.target.value })}/></label>
          <label className="check-label"><input type="checkbox" checked={form.deliveryEnabled} onChange={e => setForm({ ...form, deliveryEnabled: e.target.checked })}/> Home delivery enabled</label>
          <label className="check-label"><input type="checkbox" checked={form.isOpen} onChange={e => setForm({ ...form, isOpen: e.target.checked })}/> Accept orders</label>
        </div>
        <button className="primary-button">{saved ? 'SAVED' : 'SAVE SETTINGS'} <span>→</span></button>
      </form>
      <ZoneManager token={token}/>
      <StationManager token={token}/>
      <StaffManager token={token}/>
    </div>
  );
}

function ZoneManager({ token }) {
  const [zones, setZones] = useState([]);
  const [postalCode, setPostal] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => api('/admin/zones', { token }).then(setZones).catch(e => setError(e.message)), [token]);
  useEffect(() => { load(); }, [load]);

  async function add(event) {
    event.preventDefault();
    try {
      await api('/admin/zones', { token, ...send('POST', { postalCode, deliveryFee: 0, minimumOrder: 0, estimatedMinutes: 45 }) });
      setPostal('');
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-title"><div><span className="micro-label">DELIVERY COVERAGE</span><h2>Postal zones</h2></div></div>
      <form className="compact-form" onSubmit={add}><label>POSTAL CODE<input value={postalCode} onChange={e => setPostal(e.target.value)} required/></label><button className="primary-button">ADD ZONE ＋</button></form>
      {error && <div className="notice">{error}</div>}
      {zones.map(zone => <div className="zone-row" key={zone.id}><b>{zone.postalCode}</b><span>Fee ₹{zone.deliveryFee} · minimum ₹{zone.minimumOrder} · {zone.estimatedMinutes} min</span></div>)}
    </section>
  );
}

function StationManager({ token }) {
  const [stations, setStations] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => api('/admin/stations', { token }).then(setStations).catch(e => setError(e.message)), [token]);
  useEffect(() => { load(); }, [load]);

  async function add(event) {
    event.preventDefault();
    try {
      await api('/admin/stations', { token, ...send('POST', { name }) });
      setName('');
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-title"><div><span className="micro-label">KITCHEN WORKFLOW</span><h2>Kitchen stations</h2></div></div>
      <form className="compact-form" onSubmit={add}><label>STATION NAME<input value={name} onChange={e => setName(e.target.value)} placeholder="Hot kitchen, grill, desserts" required/></label><button className="primary-button">ADD STATION ＋</button></form>
      {error && <div className="notice error">{error}</div>}
      {stations.map(station => <div className="zone-row" key={station.id}><b>{station.name}</b><span>{station.isActive ? 'Active station' : 'Inactive station'}</span></div>)}
      {!stations.length && !error && <div className="empty-state">Create a station, then assign it to a kitchen staff account.</div>}
    </section>
  );
}

function StaffManager({ token }) {
  const [staff, setStaff] = useState([]);
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'WAITER', stationId: '' });
  const [error, setError] = useState('');
  const load = useCallback(() => Promise.all([
    api('/admin/staff', { token }),
    api('/admin/stations', { token })
  ]).then(([team, kitchenStations]) => {
    setStaff(team);
    setStations(kitchenStations.filter(station => station.isActive));
  }).catch(e => setError(e.message)), [token]);
  useEffect(() => { load(); }, [load]);

  async function create(event) {
    event.preventDefault();
    try {
      await api('/admin/staff', { token, ...send('POST', { ...form, stationId: form.role === 'KITCHEN' ? Number(form.stationId) : null }) });
      setForm({ name: '', phone: '', password: '', role: 'WAITER', stationId: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggle(member) {
    try {
      await api(`/admin/staff/${member.id}`, { token, ...send('PATCH', { isActive: !member.isActive }) });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-title"><div><span className="micro-label">TEAM ACCESS</span><h2>Staff accounts</h2></div></div>
      {error && <div className="notice error">{error}</div>}
      <form className="compact-form" onSubmit={create}>
        <label>NAME<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <label>MOBILE<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/></label>
        <label>TEMP PASSWORD<input type="password" minLength="8" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></label>
        <label>ROLE<CustomSelect value={form.role} onChange={role => setForm({ ...form, role })} options={['WAITER', 'KITCHEN', 'DELIVERY', 'MANAGER'].map(role => ({ value: role, label: role }))}/></label>
        {form.role === 'KITCHEN' && <label>STATION<CustomSelect value={form.stationId} onChange={stationId => setForm({ ...form, stationId })} placeholder="Choose a station" options={stations.map(station => ({ value: String(station.id), label: station.name }))}/></label>}
        <button className="primary-button" disabled={form.role === 'KITCHEN' && !form.stationId}>ADD STAFF ＋</button>
      </form>
      {form.role === 'KITCHEN' && !stations.length && <div className="notice">Add an active kitchen station before creating a kitchen account.</div>}
      {staff.map(member => <div className="zone-row" key={member.id}><b>{member.name}</b><span>{member.phone} · {member.role}{member.stationName ? ` · ${member.stationName}` : ''} {member.isActive ? '· Active' : '· Disabled'}</span><button className="quiet-button" onClick={() => toggle(member)}>{member.isActive ? 'DISABLE' : 'ENABLE'}</button></div>)}
    </section>
  );
}
