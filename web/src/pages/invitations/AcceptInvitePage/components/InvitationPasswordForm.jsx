import { Link } from 'react-router-dom'
import Button from '@/shared/components/ui/Button/Button.jsx'
import PasswordInput from '@/shared/components/ui/PasswordInput/PasswordInput.jsx'

export default function InvitationPasswordForm({ errors, form, requiresPassword, saving, onChange, onSubmit }) {
  if (!requiresPassword) {
    return (
      <div className="accept-password-fields">
        <Button loading={saving} placeholder="Aceitar convite" onClick={onSubmit} />
        <Link to="/login" className="accept-login-link">Entrar com minha conta</Link>
      </div>
    )
  }

  return (
    <div className="accept-password-fields">
      <PasswordInput label="Senha" placeholder="Crie sua senha" showForgot={false} error={errors.password} value={form.password} onChange={(password) => onChange({ password })} />
      <PasswordInput
        label="Confirmar senha"
        placeholder="Confirme sua senha"
        showForgot={false}
        error={errors.password_confirmation}
        value={form.password_confirmation}
        onChange={(password_confirmation) => onChange({ password_confirmation })}
      />
      <Button loading={saving} placeholder="Criar senha" onClick={onSubmit} />
    </div>
  )
}
