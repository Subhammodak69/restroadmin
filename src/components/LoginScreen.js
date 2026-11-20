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
  return <main className="login-page" data-theme={theme}><div className="login-glow"/><ThemeToggle theme={theme} onToggle={onToggleTheme}/><form className="login-card" onSubmit={submit}>
    <div className="admin-mark">R<span>✳</span></div><div className="micro-label">EMBER & SPICE · BACK OF HOUSE</div><h1>Welcome <em>back.</em></h1><p>Sign in to manage your restaurant.</p>
    <label>STAFF MOBILE<input autoComplete="username" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+91 98765 43210" required/></label>
    <label>PASSWORD / PIN<input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Your password" required/></label>
    {error&&<div className="form-error">{error}</div>}<button className="primary-button" disabled={busy}>{busy?'SIGNING IN…':'SIGN IN'} <span>→</span></button>
    <small>Restaurant staff and superadmin accounts sign in here.</small>
  </form></main>;
}
