export default function ProfileSettingsField({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  )
}
