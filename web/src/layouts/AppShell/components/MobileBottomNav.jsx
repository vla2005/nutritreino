import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/composables/useAuth.js'
import { useIcons } from '@/composables/useIcons.jsx'
import { listConversations } from '@/services/messages.js'

export default function MobileBottomNav() {
  const { role, user } = useAuth()
  const { icons } = useIcons()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const items = getMobileItems(user?.professional?.speciality || role, icons, unreadMessages)

  useEffect(() => {
    let mounted = true

    async function loadUnread() {
      if (!user) return

      try {
        const conversations = await listConversations()
        if (mounted) setUnreadMessages(totalUnread(conversations))
      } catch {
        if (mounted) setUnreadMessages(0)
      }
    }

    function handleUnreadEvent(event) {
      setUnreadMessages(Number(event.detail?.total || 0))
    }

    loadUnread()
    window.addEventListener('chat:unread-updated', handleUnreadEvent)

    return () => {
      mounted = false
      window.removeEventListener('chat:unread-updated', handleUnreadEvent)
    }
  }, [user])

  return (
    <nav className="dashboard-bottom-nav" aria-label="Navegacao principal">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `dashboard-bottom-link ${isActive ? 'is-active' : ''}`}>
          <span className="dashboard-bottom-icon">
            {item.icon}
            {item.badge ? <b>{item.badge}</b> : null}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function getMobileItems(role, icons, unreadMessages = 0) {
  const badge = unreadMessages > 0 ? unreadMessages : null

  if (role === 'nutritionist') {
    return [
      { to: '/dashboard/home', label: 'Painel', icon: icons.home },
      { to: '/patients', label: 'Pacientes', icon: icons.patients },
      { to: '/dashboard/meal-plans', label: 'Planos', icon: icons.plans },
      { to: '/dashboard/messages', label: 'Mensagens', icon: icons.messages, badge },
      { to: '/dashboard/settings', label: 'Perfil', icon: icons.settings },
    ]
  }

  if (role === 'trainer') {
    return [
      { to: '/dashboard/home', label: 'Painel', icon: icons.home },
      { to: '/patients', label: 'Alunos', icon: icons.patients },
      { to: '/dashboard/workouts', label: 'Treinos', icon: icons.workouts },
      { to: '/dashboard/messages', label: 'Mensagens', icon: icons.messages, badge },
      { to: '/dashboard/settings', label: 'Perfil', icon: icons.settings },
    ]
  }

  return [
    { to: '/dashboard/home', label: 'Progresso', icon: icons.progress },
    { to: '/dashboard/meal-plans', label: 'Dietas', icon: icons.diet },
    { to: '/dashboard/workouts', label: 'Treinos', icon: icons.workouts },
    { to: '/dashboard/messages', label: 'Mensagens', icon: icons.messages, badge },
    { to: '/dashboard/settings', label: 'Perfil', icon: icons.settings },
  ]
}

function totalUnread(conversations = []) {
  return conversations.reduce((sum, conversation) => sum + Number(conversation.unread_count || 0), 0)
}
