import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../composables/useAuth.js'
import { useIcons } from '../composables/useIcons.jsx'
import { listConversations } from '../services/messages.js'
import { normalizeAvatarUrl } from '../utils/avatar.js'

export default function Sidebar({ collapsed, mobileOpen = false, onCloseMobile, onToggle }) {
  const navigate = useNavigate()
  const { role, user, logout } = useAuth()
  const { icons } = useIcons()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const speciality = user?.professional?.speciality
  const navItems = getNavItems(speciality || role, icons, unreadMessages)
  const roleLabel = roleName(speciality || role)
  const displayName = user?.name || 'Profissional'
  const firstName = displayName.split(' ')[0] || displayName
  const isCollapsed = collapsed && !mobileOpen
  const avatarUrl = normalizeAvatarUrl(user?.avatar)

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

  async function handleLogout() {
    setUserMenuOpen(false)
    await logout()
    onCloseMobile?.()
    navigate('/login')
  }

  return (
    <aside className={`dashboard-sidebar fixed bottom-0 left-0 top-0 z-[100] flex flex-col overflow-visible transition-all duration-300 ${mobileOpen ? 'is-mobile-open' : ''} ${collapsed ? 'md:w-[76px]' : 'md:w-[262px]'}`}>
      <div className="dashboard-brand">
        <span className="dashboard-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6.2 13.7c5.4.4 9.8-2.5 10.8-7.7 2.5 7.9-2.7 12.3-8.4 11.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 18c2.2-5.2 5.7-8 10.7-8.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
        </span>
        {!isCollapsed ? <span>NutriTreino</span> : null}
      </div>

      <nav className="dashboard-nav flex-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <div key={item.section} className="mb-4">
            {item.section && !isCollapsed ? <p className="dashboard-nav-section">{item.section}</p> : null}
            {item.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) =>
                  `dashboard-nav-link group relative ${
                    isActive ? 'is-active' : ''
                  }`
                }
              >
                <span className="dashboard-nav-icon">{link.icon}</span>
                {!isCollapsed ? <span className="flex-1">{link.label}</span> : null}
                {!isCollapsed && link.badge ? <span className="dashboard-nav-badge">{link.badge}</span> : null}
                {isCollapsed ? <span className="dashboard-nav-tooltip">{link.label}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="dashboard-sidebar-user">
        <button
          type="button"
          className="dashboard-user-trigger"
          onClick={() => setUserMenuOpen((open) => !open)}
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <span className="dashboard-user-avatar" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials(displayName)}
          </span>
          {!isCollapsed ? (
            <span className="dashboard-user-copy">
              <p>{firstName.includes('Dr') || firstName.includes('Dra') ? displayName : professionalPrefix(roleLabel, displayName)}</p>
              <span>{roleLabel}</span>
            </span>
          ) : null}
          {!isCollapsed ? <ChevronUpIcon /> : null}
        </button>

        {userMenuOpen ? (
          <div className={`dashboard-user-menu ${isCollapsed ? 'is-collapsed' : ''}`} role="menu">
            <Link to="/dashboard/settings" role="menuitem" onClick={() => { setUserMenuOpen(false); onCloseMobile?.() }}>
              <UserIcon />
              Meu perfil
            </Link>
            <button type="button" role="menuitem" onClick={handleLogout}>
              <LogoutIcon />
              Sair
            </button>
          </div>
        ) : null}
      </div>

      <button className="dashboard-sidebar-toggle" onClick={onToggle} aria-label="Alternar sidebar">
        <svg className={`h-3 w-3 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  )
}

function getNavItems(role, icons, unreadMessages = 0) {
  const badge = unreadMessages > 0 ? unreadMessages : null

  if (role === 'nutritionist') {
    return [
      {
        section: 'Menu',
        links: [
          { to: '/dashboard/home', label: 'Painel', icon: icons.home },
          { to: '/patients', label: 'Pacientes', icon: icons.patients },
          { to: '/dashboard/meal-plans', label: 'Planos Alimentares', icon: icons.plans },
          { to: '/dashboard/messages', label: 'Mensagens', icon: icons.messages, badge },
        ],
      },
    ]
  }

  if (role === 'trainer') {
    return [
      {
        section: 'Menu',
        links: [
          { to: '/dashboard/home', label: 'Painel', icon: icons.home },
          { to: '/patients', label: 'Alunos', icon: icons.patients },
          { to: '/dashboard/workouts', label: 'Treinos', icon: icons.workouts },
          { to: '/dashboard/messages', label: 'Mensagens', icon: icons.messages, badge },
        ],
      },
    ]
  }

  return [
    {
      section: 'Menu',
      links: [
        { to: '/dashboard/home', label: 'Progresso', icon: icons.progress },
        { to: '/dashboard/meal-plans', label: 'Planos Alimentares', icon: icons.diet },
        { to: '/dashboard/workouts', label: 'Meus Treinos', icon: icons.workouts },
        { to: '/dashboard/messages', label: 'Mensagens', icon: icons.messages, badge },
      ],
    },
  ]
}

function totalUnread(conversations = []) {
  return conversations.reduce((sum, conversation) => sum + Number(conversation.unread_count || 0), 0)
}

function roleName(role) {
  return (
    {
      professional: 'Profissional',
      nutritionist: 'Nutricionista',
      trainer: 'Treinador',
      client: 'Cliente',
    }[role] ?? 'Profissional'
  )
}

function professionalPrefix(roleLabel, name) {
  if (roleLabel === 'Nutricionista') return `Dra. ${name}`
  if (roleLabel === 'Treinador') return `Prof. ${name}`
  return name
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0][0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : '?'
}

function LogoutIcon() {
  return (
    <svg className="h-[18px] w-[18px] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-[18px] w-[18px] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg className="h-[16px] w-[16px] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m18 15-6-6-6 6" />
    </svg>
  )
}
