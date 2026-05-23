import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../composables/useToast.jsx'
import { API_URL } from '../../config/api.js'
import RegisterStep2 from './RegisterStep2.jsx'
import RegisterStep3Prof from './RegisterStep3Prof.jsx'
import RegisterSteps from './RegisterSteps.jsx'

const emptyForm = {
  name: '',
  email: '',
  speciality: '',
  registration: '',
  avatar: '',
  avatar_file: null,
  bio: '',
  phone: '',
  cpf: '',
  password: '',
  password_confirmation: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterForm() {
  const toast = useToast()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      Object.keys(patch).forEach((key) => delete next[key])
      return next
    })
  }

  function validateRegistrationFields(values) {
    const nextErrors = {}
    const textFields = ['name', 'email', 'phone', 'cpf', 'password', 'speciality', 'registration']

    textFields.forEach((field) => {
      if (values[field] && typeof values[field] !== 'string') {
        nextErrors[field] = 'Este campo deve ser um texto valido.'
      }
    })

    if (values.name?.length > 255) nextErrors.name = 'O nome não pode ultrapassar 255 caracteres.'
    if (!values.email) nextErrors.email = 'O e-mail e obrigatorio.'
    else if (!emailPattern.test(values.email)) nextErrors.email = 'Informe um e-mail valido.'
    else if (values.email.length > 255) nextErrors.email = 'O e-mail não pode ultrapassar 255 caracteres.'

    if (values.phone?.length > 255) nextErrors.phone = 'O telefone não pode ultrapassar 255 caracteres.'

    if (!values.cpf) nextErrors.cpf = 'O CPF e obrigatorio.'
    else if (values.cpf.length !== 11) nextErrors.cpf = 'O CPF deve ter exatamente 11 caracteres.'

    if (!values.password) nextErrors.password = 'A senha e obrigatoria.'
    else if (values.password.length < 6) nextErrors.password = 'A senha deve ter no minimo 6 caracteres.'

    if (!values.password_confirmation) nextErrors.password_confirmation = 'Confirme sua senha.'
    else if (values.password !== values.password_confirmation) nextErrors.password_confirmation = 'As senhas não conferem.'

    if (values.speciality?.length > 255) nextErrors.speciality = 'A especialidade não pode ultrapassar 255 caracteres.'
    if (values.registration?.length > 255) nextErrors.registration = 'O registro não pode ultrapassar 255 caracteres.'

    return nextErrors
  }

  function validateAndGoNext() {
    const nextErrors = validateRegistrationFields(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.warning('Revise os campos destacados.')
      return
    }

    setCurrentStep(2)
  }

  function apiErrorsToFormErrors(error) {
    const apiErrors = error?.response?.data?.errors
    if (!apiErrors) return {}

    return Object.entries(apiErrors).reduce((carry, [field, messages]) => {
      carry[field] = Array.isArray(messages) ? messages[0] : String(messages)
      return carry
    }, {})
  }

  async function handleSubmit() {
    const nextErrors = validateRegistrationFields(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setCurrentStep(1)
      toast.warning('Revise os campos destacados.')
      return
    }

    try {
      setLoading(true)
      const payload = new FormData()
      Object.entries({ ...form, role: 'professional' }).forEach(([key, value]) => {
        if (key === 'password_confirmation') return
        if (key === 'avatar') return
        if (key === 'avatar_file') {
          if (value) payload.append('avatar_file', value)
          return
        }
        if (value !== null && value !== undefined && value !== '') payload.append(key, value)
      })

      await axios.post(`${API_URL}/user/register`, payload)
      toast.success('Usuario cadastrado com sucesso!')
      window.setTimeout(() => navigate('/login'), 500)
    } catch (error) {
      const apiErrors = apiErrorsToFormErrors(error)
      setErrors(apiErrors)

      if (Object.keys(apiErrors).length > 0) {
        setCurrentStep(apiErrors.avatar_file || apiErrors.avatar || apiErrors.bio ? 2 : 1)
        toast.warning(Object.values(apiErrors)[0])
      } else {
        toast.warning('Campos invalidos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-form">
      <header className="login-form-header register-form-header">
        <h2>Crie sua conta</h2>
        <p>Cadastro exclusivo para profissionais</p>
      </header>

      <RegisterSteps current={currentStep} total={2} />

      {currentStep === 1 ? <RegisterStep2 form={form} errors={errors} onChange={updateForm} onNext={validateAndGoNext} /> : null}
      {currentStep === 2 ? <RegisterStep3Prof form={form} errors={errors} loading={loading} onChange={updateForm} onBack={() => setCurrentStep(1)} onSubmit={handleSubmit} /> : null}

      <p className="login-register-copy register-login-copy">
        Ja tem uma conta?
        <Link to="/login">
          Entrar
        </Link>
      </p>
    </div>
  )
}
