import Button from '@/shared/components/ui/Button/Button.jsx'
import Input from '@/shared/components/ui/Input/Input.jsx'
import PasswordInput from '@/shared/components/ui/PasswordInput/PasswordInput.jsx'

const specialities = [
  { value: 'nutritionist', label: 'Nutricionista' },
  { value: 'trainer', label: 'Treinador' },
]

export default function RegisterStep2({ form, errors = {}, onChange, onBack, onNext }) {
  const hasSelectedSpeciality = Boolean(form.speciality)
  const registrationLabel = !hasSelectedSpeciality ? 'CR-' : form.speciality === 'nutritionist' ? 'CRN' : 'CREF'
  const registrationPlaceholder = !hasSelectedSpeciality ? 'Selecione uma especialidade primeiro' : form.speciality === 'nutritionist' ? 'CRN-12345/SP' : 'CREF-123456-G/SP'
  const registrationPrefix = form.speciality === 'nutritionist' ? 'CRN-' : form.speciality === 'trainer' ? 'CREF-' : ''

  return (
    <div>
      <h2 className="register-step-title">Seus dados</h2>
      <p className="register-step-copy">Preencha suas informações pessoais e profissionais.</p>

      <div className="register-field-stack">
        <Input label="Nome completo" placeholder="Seu nome" error={errors.name} value={form.name} onChange={(name) => onChange({ name })} />
        <Input label="E-mail" type="email" placeholder="exemplo@email.com" error={errors.email} value={form.email} onChange={(email) => onChange({ email })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Telefone" placeholder="(00) 00000-0000" error={errors.phone} value={formatPhone(form.phone)} onChange={(phone) => onChange({ phone: onlyDigits(phone).slice(0, 11) })} />
          <Input label="CPF" placeholder="000.000.000-00" error={errors.cpf} value={formatCpf(form.cpf)} onChange={(cpf) => onChange({ cpf: onlyDigits(cpf).slice(0, 11) })} />
        </div>

        <div>
          <label className="form-label">Especialidade</label>
          <select className={`input-field rounded-lg px-4 py-3 text-sm ${errors.speciality ? 'is-invalid' : ''}`} value={form.speciality} onChange={(event) => onChange({ speciality: event.target.value, registration: '' })}>
            <option value="" disabled>
              Selecione sua especialidade
            </option>
            {specialities.map((speciality) => (
              <option key={speciality.value} value={speciality.value}>
                {speciality.label}
              </option>
            ))}
          </select>
          {errors.speciality ? <p className="field-error">{errors.speciality}</p> : null}
        </div>

        <Input label={registrationLabel} placeholder={registrationPlaceholder} disabled={!hasSelectedSpeciality} error={errors.registration} value={form.registration} onChange={(registration) => onChange({ registration: formatRegistration(registration, registrationPrefix) })} />
        <PasswordInput label="Senha" placeholder="Sua senha" showForgot={false} error={errors.password} value={form.password} onChange={(password) => onChange({ password })} />
        <PasswordInput
          label="Confirmar senha"
          placeholder="Confirme sua senha"
          showForgot={false}
          error={errors.password_confirmation}
          value={form.password_confirmation}
          onChange={(password_confirmation) => onChange({ password_confirmation })}
        />
      </div>

      <div className={`register-actions ${onBack ? '' : 'register-actions-end'}`}>
        {onBack ? (
          <button type="button" className="register-back-button" onClick={onBack} aria-label="Voltar">
            <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
        ) : null}
        <Button placeholder="Continuar" className="register-action-button" onClick={onNext} />
      </div>
    </div>
  )
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function formatCpf(value = '') {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhone(value = '') {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatRegistration(value = '', prefix = '') {
  if (!prefix) return value

  const withoutPrefix = String(value)
    .toUpperCase()
    .replace(/^CRN-?/i, '')
    .replace(/^CREF-?/i, '')
    .replace(/[^A-Z0-9/-]/g, '')

  return `${prefix}${withoutPrefix}`.slice(0, 255)
}
