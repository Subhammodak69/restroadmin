import { useState } from 'react';
import { api, send } from '../api';
import ThemeToggle from './ThemeToggle';

export default function LoginScreen({ onLogin, theme, onToggleTheme }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { const result = await api('/auth/staff/login', send('POST', { phone, password })); onLogin(result); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="login-page" data-theme={theme}><div className="login-glow"/><ThemeToggle theme={theme} onToggle={onToggleTheme}/><section className="login-story"><div className="login-story-brand"><span className="admin-mark">R<span>*</span></span><span>EMBER & SPICE<small>INDIAN KITCHEN | BENGALURU</small></span></div><div className="login-story-copy"><span className="micro-label">RESTAURANT WORKSPACE</span><h2>Good food.<br/><em>Great service.</em></h2><p>One clear view of your restaurant, your team, and every order in motion.</p></div><span className="login-story-foot">STAFF ACCESS | LIVE OPERATIONS</span></section><form className="login-card" onSubmit={submit}>
    <div className="admin-mark login-card-mark">R<span>?</span></div><div className="micro-label">BACK OF HOUSE</div><h1>Welcome <em>back.</em></h1><p>Sign in to manage your restaurant.</p>
    <label>STAFF MOBILE<input type="tel" autoComplete="username" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+91 98765 43210" required/></label>
    <label>PASSWORD / PIN<input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Your password" required/></label>
    {error&&<div className="form-error">{error}</div>}<button className="primary-button" disabled={busy}>{busy?'SIGNING IN...':'SIGN IN'} <span>-&gt;</span></button>
    <small>Restaurant staff and superadmin accounts sign in here.</small>
  </form></main>;
}
