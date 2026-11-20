export default function DateField({ label, value, onChange, max, min, type = 'date', step }) {
  return <label className="date-field"><span>{label}</span><input type={type} value={value} max={max} min={min} step={step} onChange={event=>onChange(event.target.value)}/></label>;
}
