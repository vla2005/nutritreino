import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/composables/useAuth.js'
import { useIcons } from '@/composables/useIcons.jsx'
import { listConversations } from '@/services/messages.js'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import {
  CaretLeftIcon,
  CaretUpIcon,
  GearSixIcon,
  LeafIcon,
  SignOutIcon,
  UserCircleIcon,
} from '@phosphor-icons/react'

export default function Sidebar({
  collapsed,
  mobileOpen = false,
  onCloseMobile,
  onToggle,
}) {
  const navigate = useNavigate()
  const { role, user, logout } = useAuth()
  const { icons } = useIcons()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const speciality = user?.professional?.speciality
  const navItems = getNavItems(speciality || role, icons, unreadMessages)
  const roleLabel = roleName(speciality || role)
  const displayName = user?.name || 'Profissional'
  const isCollapsed = collapsed && !mobileOpen
  const avatarUrl = normalizeAvatarUrl(user?.avatar)
  const [failedAvatar, setFailedAvatar] = useState(null)

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
    <aside
      className={`dashboard-sidebar fixed bottom-0 left-0 top-0 z-[100] flex flex-col overflow-visible ${mobileOpen ? 'is-mobile-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}
    >
      <div className="dashboard-brand">
        <span className="dashboard-brand-mark" aria-hidden="true">
          <LeafIcon size={34} weight="fill" />
        </span>
        {!isCollapsed ? <span>NutriTreino</span> : null}
      </div>

      <nav className="dashboard-nav flex-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <div key={item.section}>
            {item.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                aria-label={link.label}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) =>
                  `dashboard-nav-link group relative ${
                    isActive ? 'is-active' : ''
                  }`
                }
              >
                <span className="dashboard-nav-icon">{link.icon}</span>
                {!isCollapsed ? (
                  <span className="flex-1">{link.label}</span>
                ) : null}
                {!isCollapsed && link.badge ? (
                  <span className="dashboard-nav-badge">{link.badge}</span>
                ) : null}
                {isCollapsed ? (
                  <span className="dashboard-nav-tooltip">{link.label}</span>
                ) : null}
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
          aria-label={`Abrir menu de ${displayName}`}
        >
          <span className="dashboard-user-avatar" aria-hidden="true">
            {avatarUrl && failedAvatar !== avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                onError={() => setFailedAvatar(avatarUrl)}
              />
            ) : (
              initials(displayName)
            )}
          </span>
          {!isCollapsed ? (
            <span className="dashboard-user-copy">
              <p>{displayName}</p>
              <span>{roleLabel}</span>
            </span>
          ) : null}
          {!isCollapsed ? <CaretUpIcon size={16} /> : null}
        </button>

        {userMenuOpen ? (
          <div
            className={`dashboard-user-menu ${isCollapsed ? 'is-collapsed' : ''}`}
            role="menu"
          >
            <Link
              to="/dashboard/settings"
              role="menuitem"
              onClick={() => {
                setUserMenuOpen(false)
                onCloseMobile?.()
              }}
            >
              <UserCircleIcon size={18} />
              Meu perfil
            </Link>
            <button type="button" role="menuitem" onClick={handleLogout}>
              <SignOutIcon size={18} />
              Sair
            </button>
          </div>
        ) : null}
      </div>

      {!isCollapsed ? (
        <div className="dashboard-sidebar-footer">
          <Link to="/dashboard/settings" onClick={() => onCloseMobile?.()}>
            <GearSixIcon size={20} /> Configurações
          </Link>
          <button onClick={handleLogout}>
            <SignOutIcon size={20} /> Sair
          </button>
        </div>
      ) : null}

      <button
        className="dashboard-sidebar-toggle"
        onClick={onToggle}
        aria-label="Alternar sidebar"
      >
        <CaretLeftIcon size={14} className={collapsed ? 'rotate-180' : ''} />
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
          {
            to: '/dashboard/meal-plans',
            label: 'Planos Alimentares',
            icon: icons.plans,
          },
          {
            to: '/dashboard/messages',
            label: 'Mensagens',
            icon: icons.messages,
            badge,
          },
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
          {
            to: '/dashboard/messages',
            label: 'Mensagens',
            icon: icons.messages,
            badge,
          },
        ],
      },
    ]
  }

  return [
    {
      section: 'Menu',
      links: [
        { to: '/dashboard/home', label: 'Progresso', icon: icons.progress },
        {
          to: '/dashboard/meal-plans',
          label: 'Planos Alimentares',
          icon: icons.diet,
        },
        {
          to: '/dashboard/workouts',
          label: 'Meus Treinos',
          icon: icons.workouts,
        },
        {
          to: '/dashboard/messages',
          label: 'Mensagens',
          icon: icons.messages,
          badge,
        },
      ],
    },
  ]
}

function totalUnread(conversations = []) {
  return conversations.reduce(
    (sum, conversation) => sum + Number(conversation.unread_count || 0),
    0
  )
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

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length
    ? `${parts[0][0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
    : '?'
}
