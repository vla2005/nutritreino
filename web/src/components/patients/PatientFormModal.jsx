import Button from '@/shared/components/ui/Button/Button.jsx'

export default function PatientFormModal({ open, form, errors = {}, loading = false, onClose, onSave, onChange }) {
  if (!open) return null

  function updateField(field, value) {
    onChange({ ...form, [field]: value })
  }

  return (
    <div className="patient-modal-root">
      <button className="patient-modal-backdrop" type="button" aria-label="Fechar modal" onClick={onClose} />

      <section className="patient-modal" aria-label="Cadastrar paciente">
        <header className="patient-modal-header">
          <div>
            <h2>Novo paciente</h2>
            <p>Cadastre os dados e envie o convite de acesso.</p>
          </div>
          <button className="patient-modal-close" type="button" onClick={onClose} aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>

        <div className="patient-modal-body">
          <div className="patient-field-grid">
            <Field label="Nome completo" value={form.name} error={errors.name} placeholder="Ana Lima" onChange={(value) => updateField('name', value)} />
            <Field label="E-mail" type="email" value={form.email} error={errors.email} placeholder="ana@email.com" onChange={(value) => updateField('email', value)} />
            <Field label="Telefone" value={formatPhone(form.phone)} error={errors.phone} placeholder="(11) 99999-9999" onChange={(value) => updateField('phone', normalizePhone(value))} />
            <Field label="CPF" value={formatCpf(form.cpf)} error={errors.cpf} placeholder="000.000.000-00" onChange={(value) => updateField('cpf', normalizeCpf(value))} />

            <div>
              <label className="patient-modal-label">Gênero</label>
              <select value={form.gender || ''} className={`patient-modal-input ${errors.gender ? 'is-invalid' : ''}`} onChange={(event) => updateField('gender', event.target.value)}>
                <option value="">Não informar</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
              {errors.gender ? <p className="field-error">{errors.gender}</p> : null}
            </div>

            <Field label="Data de nascimento" type="date" value={form.birth_date || ''} error={errors.birth_date} onChange={(value) => updateField('birth_date', value)} />
            <Field label="Altura" value={form.height || ''} error={errors.height} placeholder="170" maxLength={3} onChange={(value) => updateField('height', onlyDigits(value).slice(0, 3))} />
            <Field label="Peso" value={form.weight || ''} error={errors.weight} placeholder="68" maxLength={3} onChange={(value) => updateField('weight', onlyDigits(value).slice(0, 3))} />
          </div>
        </div>

        <footer className="patient-modal-footer">
          <button className="patient-cancel-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <Button className="!w-auto px-5 py-2" loading={loading} placeholder="Enviar convite" onClick={onSave} />
        </footer>
      </section>
    </div>
  )
}

function Field({ label, value, type = 'text', placeholder = '', maxLength, error, onChange }) {
  return (
    <div>
      <label className="patient-modal-label">{label}</label>
      <input
        type={type}
        value={value || ''}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`patient-modal-input ${error ? 'is-invalid' : ''}`}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

function normalizePhone(value) {
  return onlyDigits(value).slice(0, 11)
}

function normalizeCpf(value) {
  return onlyDigits(value).slice(0, 11)
}

function onlyDigits(value = '') {
  return value.replace(/\D/g, '')
}

function formatPhone(value = '') {
  const digits = normalizePhone(value)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCpf(value = '') {
  const digits = normalizeCpf(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function CloseIcon() {
  return <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
}
