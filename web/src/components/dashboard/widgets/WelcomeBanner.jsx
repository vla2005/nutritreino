import { useState } from 'react'
import { useAuth } from '../../../composables/useAuth.js'
import { normalizeAvatarUrl } from '../../../utils/avatar.js'

export default function WelcomeBanner() {
  const { user, role, name, initials } = useAuth()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const firstName = name.trim().split(/\s+/)[0] ?? ''
  const speciality = user?.professional?.speciality || role
  const avatarUrl = normalizeAvatarUrl(user?.avatar)

  return (
    <div className="mb-7 flex items-center justify-between rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 to-blue-500/10 px-5 py-6 md:px-7">
      <div>
        <p className="font-display m-0 mb-1 text-xl font-bold text-[var(--text-primary)]">{greeting()}, {firstName}</p>
        <p className="m-0 text-sm text-[var(--text-secondary)]">{subtitle(speciality)}</p>
      </div>
      <div>
        {avatarUrl && !avatarFailed ? (
          <img src={avatarUrl} alt={name} className="h-14 w-14 rounded-full border-2 border-blue-500/30 object-cover" onError={() => setAvatarFailed(true)} />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-500/30 bg-gradient-to-br from-blue-600 to-blue-500 text-xl font-bold text-white">
            {initials}
          </div>
        )}
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function subtitle(role) {
  return (
    {
      nutritionist: 'Veja seus pacientes e planos alimentares do dia.',
      trainer: 'Confira os treinos e agenda de hoje.',
      client: 'Acompanhe sua dieta e progresso de hoje.',
    }[role] ?? 'Bem-vindo ao dashboard.'
  )
}
