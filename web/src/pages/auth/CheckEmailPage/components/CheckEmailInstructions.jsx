import { EnvelopeOpen, Info } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export default function CheckEmailInstructions({ email }) {
  return (
    <div className="check-email-content">
      <div className="check-email-icon" aria-hidden="true">
        <EnvelopeOpen size={38} weight="duotone" />
      </div>

      <header className="login-form-header check-email-header">
        <h2>Falta só confirmar seu e-mail</h2>
        <p>
          {email ? 'Sua conta foi criada. Enviamos um link de confirmação para:' : 'Para liberar seu acesso, abra o link de confirmação enviado ao e-mail informado no cadastro.'}
        </p>
        {email && <strong className="check-email-address">{email}</strong>}
      </header>

      <ol className="check-email-steps">
        <li>Abra o e-mail enviado pelo NutriTreino.</li>
        <li>Clique em <strong>Verificar e-mail</strong> para confirmar seu endereço.</li>
        <li>Depois da confirmação, entre com seu e-mail e sua senha.</li>
      </ol>

      <aside className="check-email-hint" aria-label="Dica para encontrar o e-mail">
        <Info size={20} aria-hidden="true" />
        <p>Não encontrou? Confira a caixa de spam ou lixo eletrônico. O e-mail pode levar alguns minutos para chegar.</p>
      </aside>

      <Link className="check-email-login" to="/login">Já confirmei — entrar</Link>
      <p className="check-email-footnote">O acesso será liberado após a confirmação do e-mail.</p>
    </div>
  )
}
