export default function ThemeToggle({ theme, onToggle }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return <button className="theme-toggle" type="button" onClick={onToggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`} aria-pressed={theme === 'light'}>
    <span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span>
    <span className="theme-toggle-label">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
  </button>;
}
