import { useCallback, useEffect, useState } from 'react';
import { api, send } from '../api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const blankItem = { name: '', description: '', imageUrl: '', price: '', categoryId: '', stationId: '', prepMinutes: 15, sortOrder: 0, isVegetarian: true, isSpicy: false, isAvailable: true };
const blankOption = () => ({ type: 'SIZE', label: '', priceDelta: '0', isActive: true });

export default function CatalogScreen({ token, revision }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState(blankItem);
  const [editing, setEditing] = useState(null);
  const [itemModal, setItemModal] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [optionsItem, setOptionsItem] = useState(null);
  const [optionRows, setOptionRows] = useState([]);
  const [dialogError, setDialogError] = useState('');
  const [pendingToggle, setPendingToggle] = useState(null);
  const [savingToggle, setSavingToggle] = useState(false);

  const load = useCallback(() => Promise.all([
    api('/admin/menu', { token }), api('/admin/categories', { token }), api('/admin/stations', { token })
  ]).then(([menu, categoryRows, stationRows]) => {
    setItems(menu); setCategories(categoryRows); setStations(stationRows);
  }).catch(requestError => setError(requestError.message)), [token]);
  useEffect(() => { load(); }, [load, revision]);

  function openCreate() {
    setEditing(null);
    setForm({ ...blankItem, categoryId: String(categories[0]?.id || ''), stationId: String(stations[0]?.id || '') });
    setError(''); setItemModal(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ ...blankItem, ...item, price: String(item.price), categoryId: String(item.categoryId), stationId: String(item.stationId || ''), prepMinutes: item.prepMinutes || 15, sortOrder: item.sortOrder || 0 });
    setError(''); setItemModal(true);
  }
  async function saveItem(event) {
    event.preventDefault(); setBusy(true); setError('');
    const payload = { ...form, price: Number(form.price), categoryId: Number(form.categoryId), stationId: form.stationId ? Number(form.stationId) : null, prepMinutes: Number(form.prepMinutes), sortOrder: Number(form.sortOrder), isVegetarian: Boolean(form.isVegetarian), isSpicy: Boolean(form.isSpicy), isAvailable: Boolean(form.isAvailable) };
    try {
      if (editing) await api(`/admin/menu/${editing.id}`, { token, ...send('PATCH', payload) });
      else await api('/admin/menu', { token, ...send('POST', payload) });
      setItemModal(false); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }
  async function toggleAvailability() {
    if (!pendingToggle) return;
    setSavingToggle(true);
    try {
      const item = pendingToggle;
      await api(`/admin/menu/${item.id}`, { token, ...send('PATCH', { isAvailable: !item.isAvailable, stationId: item.stationId }) });
      setItems(list => list.map(row => row.id === item.id ? { ...row, isAvailable: !item.isAvailable } : row));
      setPendingToggle(null);
    } catch (requestError) { setError(requestError.message); }
    finally { setSavingToggle(false); }
  }
  function editOptions(item) {
    setOptionsItem(item);
    setOptionRows((item.options || []).map(option => ({ type: option.type || 'SIZE', label: option.label || '', priceDelta: String(option.priceDelta ?? 0), isActive: option.isActive !== false })));
    setDialogError('');
  }
  function updateOption(index, key, value) {
    setOptionRows(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }
  async function saveOptions(event) {
    event.preventDefault();
    const options = optionRows.map(option => ({ ...option, label: option.label.trim(), priceDelta: Number(option.priceDelta) }));
    if (options.some(option => !option.label || !Number.isFinite(option.priceDelta))) { setDialogError('Add a label and valid price adjustment for each option.'); return; }
    setBusy(true); setDialogError('');
    try {
      const updated = await api(`/admin/menu/${optionsItem.id}/options`, { token, ...send('PUT', { options }) });
      setItems(rows => rows.map(item => item.id === optionsItem.id ? { ...item, options: updated } : item));
      setOptionsItem(null);
    } catch (requestError) { setDialogError(requestError.message); }
    finally { setBusy(false); }
  }

  return <div className="screen-stack">
    <div className="screen-heading"><div><span className="micro-label">MENU AND FOOD CATALOG</span><h1>Made to <em>order.</em></h1><p>Manage dishes, pricing, options and availability.</p></div><div className="catalog-heading-actions"><span className="count-chip">{items.length} dishes</span><button className="primary-button" type="button" onClick={openCreate}>ADD DISH <span>＋</span></button></div></div>
    {error && <div className="notice">{error}<button type="button" className="notice-dismiss" onClick={() => setError('')}>×</button></div>}
    <section className="panel"><div className="panel-title"><div><span className="micro-label">CURRENT MENU</span><h2>Food catalog</h2></div></div>
      {items.length ? <div className="catalog-list">{items.map(item => <article className="catalog-row" key={item.id}>
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name}/> : <div className="catalog-image-empty">NO IMAGE</div>}
        <div className="catalog-name"><b>{item.name}</b><small>{item.categoryName} · {item.station || 'Unassigned'} · {item.prepMinutes} min</small><span>{item.description}</span></div>
        <strong>{money(item.price)}</strong><span className={item.isAvailable ? 'availability available' : 'availability'}>{item.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}</span>
        <button className="quiet-button" onClick={() => openEdit(item)}>EDIT</button>
        <button className="quiet-button" onClick={() => editOptions(item)}>OPTIONS ({(item.options || []).length})</button>
        <button className="quiet-button" onClick={() => setPendingToggle(item)}>{item.isAvailable ? 'MARK OUT' : 'RESTOCK'}</button>
      </article>)}</div> : <div className="empty-state">No dishes yet. Add the first item above.</div>}
    </section>

    {itemModal && <Modal title={editing ? `Edit · ${editing.name}` : 'Add a menu dish'} description="Dish details shown on your customer menu." onClose={() => setItemModal(false)} size="large" actions={<><button className="dialog-secondary" type="button" onClick={() => setItemModal(false)}>CANCEL</button><button className="dialog-primary" type="submit" form="menu-item-form" disabled={busy}>{busy ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'ADD DISH'}</button></>}>
      <form id="menu-item-form" className="item-editor-grid" onSubmit={saveItem}>
        <label>DISH NAME<input required maxLength="120" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
        <label>PRICE<input type="number" min="0" step="0.01" required value={form.price} onChange={event => setForm({ ...form, price: event.target.value })}/></label>
        <label>CATEGORY<CustomSelect value={form.categoryId} onChange={categoryId => setForm({ ...form, categoryId })} placeholder="Select category" options={categories.map(category => ({ value: String(category.id), label: category.name }))}/></label>
        <label>KITCHEN STATION<CustomSelect value={form.stationId} onChange={stationId => setForm({ ...form, stationId })} placeholder="None" options={[{ value: '', label: 'None' }, ...stations.map(station => ({ value: String(station.id), label: station.name }))]}/></label>
        <label className="item-editor-wide">DISH IMAGE URL<input type="url" maxLength="500" value={form.imageUrl} onChange={event => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://…"/><small>Customers see this saved menu image.</small></label>
        <label className="item-editor-wide">DESCRIPTION<textarea rows="3" maxLength="500" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></label>
        <label>PREPARATION · MIN<input type="number" min="1" max="32767" value={form.prepMinutes} onChange={event => setForm({ ...form, prepMinutes: event.target.value })}/></label>
        <label>MENU POSITION<input type="number" min="0" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })}/></label>
        <label>AVAILABILITY<CustomSelect value={String(form.isAvailable)} onChange={value => setForm({ ...form, isAvailable: value === 'true' })} options={[{ value: 'true', label: 'Available' }, { value: 'false', label: 'Unavailable' }]}/></label>
        <label className="check-label"><input type="checkbox" checked={form.isVegetarian} onChange={event => setForm({ ...form, isVegetarian: event.target.checked })}/> Vegetarian</label>
        <label className="check-label"><input type="checkbox" checked={form.isSpicy} onChange={event => setForm({ ...form, isSpicy: event.target.checked })}/> Spicy</label>
        {error && <div className="dialog-error item-editor-wide">{error}</div>}
      </form>
    </Modal>}

    {optionsItem && <Modal title={`Options · ${optionsItem.name}`} description="Add sizes, spice levels or add-ons. Inactive options stay saved but are hidden from customers." onClose={() => setOptionsItem(null)} size="large" actions={<><button className="dialog-secondary" type="button" onClick={() => setOptionsItem(null)}>CANCEL</button><button className="dialog-primary" type="submit" form="item-options-form" disabled={busy}>{busy ? 'SAVING…' : 'SAVE OPTIONS'}</button></>}>
      <form id="item-options-form" onSubmit={saveOptions} className="option-form">
        {optionRows.length > 0 && <div className="option-form-header"><span>TYPE</span><span>LABEL</span><span>PRICE ADJUSTMENT</span><span>STATUS</span><span/></div>}
        {optionRows.map((option, index) => <div className="option-form-row" key={`${option.id || 'option'}-${index}`}>
          <label><span className="sr-only">Option type</span><CustomSelect value={option.type} onChange={value => updateOption(index, 'type', value)} options={[{ value: 'SIZE', label: 'Size' }, { value: 'SPICE', label: 'Spice level' }, { value: 'ADDON', label: 'Add-on' }]}/></label>
          <label><span className="sr-only">Option label</span><input required maxLength="80" value={option.label} placeholder="e.g. Full" onChange={event => updateOption(index, 'label', event.target.value)}/></label>
          <label><span className="sr-only">Price adjustment</span><input type="number" step="0.01" min="-100000" max="100000" value={option.priceDelta} onChange={event => updateOption(index, 'priceDelta', event.target.value)}/></label>
          <label><span className="sr-only">Option status</span><CustomSelect value={String(option.isActive)} onChange={value => updateOption(index, 'isActive', value === 'true')} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}/></label>
          <button type="button" className="option-remove" aria-label="Remove option" onClick={() => setOptionRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))}>×</button>
        </div>)}
        {dialogError && <div className="dialog-error">{dialogError}</div>}
        <button type="button" className="option-add" disabled={optionRows.length >= 30} onClick={() => setOptionRows(rows => [...rows, blankOption()])}>＋ ADD OPTION</button>
      </form>
    </Modal>}
    {pendingToggle && <ConfirmModal title={pendingToggle.isAvailable ? 'Mark this dish unavailable?' : 'Put this dish back on the menu?'} description={pendingToggle.isAvailable ? `${pendingToggle.name} will be hidden from customer menus until it is restocked.` : `${pendingToggle.name} will be available for new customer orders.`} confirmText={pendingToggle.isAvailable ? 'MARK UNAVAILABLE' : 'RESTOCK DISH'} danger={pendingToggle.isAvailable} busy={savingToggle} onCancel={() => setPendingToggle(null)} onConfirm={toggleAvailability}/>}
  </div>;
}
