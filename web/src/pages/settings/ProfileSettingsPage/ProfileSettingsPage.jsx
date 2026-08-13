import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.jsx'
import ProfileSettingsField from './components/ProfileSettingsField.jsx'
import { profileToForm } from './utils/profileSettingsForm.js'
import { updateMyProfile } from '@/services/profile.js'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import './ProfileSettingsPage.css'

export default function ProfileSettingsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user, fetchMe, logout } = useAuth()
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [form, setForm] = useState(() => profileToForm(user))
  const role = user?.role
  const avatarUrl = avatarPreview || normalizeAvatarUrl(user?.avatar)
  const title = role === 'client' ? 'Meu Perfil' : 'Perfil Profissional'
  const subtitle = role === 'client'
    ? 'Atualize seus dados pessoais e informações físicas.'
    : 'Atualize seus dados, registro e apresentacao profissional.'

  useEffect(() => {
    setForm(profileToForm(user))
    setAvatarPreview('')
  }, [user])

  const initials = useMemo(() => {
    const parts = form.name.trim().split(/\s+/).filter(Boolean)
    return parts.length ? `${parts[0]?.[0] || ''}${parts.at(-1)?.[0] || ''}`.toUpperCase() : 'NT'
  }, [form.name])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleAvatar(event) {
    const file = event.target.files?.[0]
    update('avatar_file', file || null)
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setSaving(true)
      await updateMyProfile({ ...form, role })
      await fetchMe()
      toast.success('Perfil atualizado com sucesso.')
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="settings-page">
      <header className="professional-page-header">
        <div className="settings-title-icon" aria-hidden="true"><UserIcon /></div>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>

      <form className="settings-shell" onSubmit={handleSubmit}>
        <section className="settings-avatar-card">
          <div className="settings-avatar-preview" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
          </div>
          <div>
            <h2>Foto de perfil</h2>
            <p>Essa imagem aparece nas tabelas, conversas e paginas de perfil.</p>
            <label className="settings-avatar-button">
              Selecionar imagem
              <input type="file" accept="image/*" hidden onChange={handleAvatar} />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h2>Dados pessoais</h2>
          <div className="settings-grid">
            <ProfileSettingsField label="Nome" value={form.name} onChange={(value) => update('name', value)} required />
            <ProfileSettingsField label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
            <ProfileSettingsField label="Telefone" value={form.phone} onChange={(value) => update('phone', value)} />
            <ProfileSettingsField label="CPF" value={form.cpf} onChange={(value) => update('cpf', value)} />
          </div>
        </section>

        {role === 'professional' ? (
          <section className="settings-section">
            <h2>Dados profissionais</h2>
            <div className="settings-grid">
              <label>
                <span>Especialidade</span>
                <select value={form.speciality} onChange={(event) => update('speciality', event.target.value)} required>
                  <option value="">Selecione</option>
                  <option value="nutritionist">Nutricionista</option>
                  <option value="trainer">Treinador</option>
                </select>
              </label>
              <ProfileSettingsField label="Registro profissional" value={form.registration} onChange={(value) => update('registration', value)} required />
              <label className="settings-wide">
                <span>Bio</span>
                <textarea value={form.bio} onChange={(event) => update('bio', event.target.value)} rows="5" placeholder="Conte sobre sua abordagem, experiencia e especialidades." />
              </label>
            </div>
          </section>
        ) : null}

        {role === 'client' ? (
          <section className="settings-section">
            <h2>Dados de acompanhamento</h2>
            <div className="settings-grid">
              <label>
                <span>Gênero</span>
                <select value={form.gender} onChange={(event) => update('gender', event.target.value)}>
                  <option value="">Selecione</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </label>
              <ProfileSettingsField label="Nascimento" type="date" value={form.birth_date} onChange={(value) => update('birth_date', value)} />
              <ProfileSettingsField label="Altura (cm)" value={form.height} onChange={(value) => update('height', value)} />
              <ProfileSettingsField label="Peso (kg)" value={form.weight} onChange={(value) => update('weight', value)} />
            </div>
          </section>
        ) : null}

        <footer className="settings-actions">
          <button type="button" className="settings-logout-button" onClick={handleLogout}>Sair da conta</button>
          <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alteracoes'}</button>
        </footer>
      </form>
    </div>
  )
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
