import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.jsx'
import { API_URL } from '@/config/api.js'
import Button from '@/shared/components/ui/Button/Button.jsx'
import Input from '@/shared/components/ui/Input/Input.jsx'
import PasswordInput from '@/shared/components/ui/PasswordInput/PasswordInput.jsx'

export default function LoginForm() {
  const navigate = useNavigate()
  const toast = useToast()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSignIn() {
    if (!form.email || !form.password) {
      toast.warning('Preencha todos os campos obrigatorios.')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/login`, form, {
        headers: { Accept: 'application/json' },
      })

      await login(response.data.token)
      toast.success('Login realizado com sucesso!')
      window.setTimeout(() => navigate('/dashboard'), 500)
    } catch (error) {
      toast.warning(resolveLoginErrorMessage(error))
      console.error('Erro ao fazer login:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={(event) => { event.preventDefault(); handleSignIn() }}>
      <header className="login-form-header">
        <h2>Bem-vindo de volta</h2>
        <p>Acesse sua conta para continuar</p>
      </header>

      <div className="login-fields">
        <Input label="E-mail" type="email" placeholder="seu@email.com" icon="mail" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} />
        <PasswordInput label="Senha" placeholder="********" value={form.password} onChange={(password) => setForm((current) => ({ ...current, password }))} />
        <Button loading={loading} placeholder="Entrar" onClick={handleSignIn} />
        <p className="login-register-copy">
          Primeiro acesso?
          <Link to="/register">
            Cadastre-se como profissional
          </Link>
        </p>
      </div>
    </form>
  )
}

function resolveLoginErrorMessage(error) {
  const apiMessage = error?.response?.data?.message

  if (apiMessage === 'Email is not verified') {
    return 'Verifique seu e-mail antes de entrar.'
  }

  if (apiMessage === 'Invalid Authentication') {
    return 'E-mail ou senha incorretos.'
  }

  return apiMessage || 'Nao foi possivel fazer login agora.'
}
