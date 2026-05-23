import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../composables/useAuth.js'
import { useTheme } from '../composables/useTheme.js'

const pageTitles = {
  '/dashboard/home': 'Inicio',
  '/patients': 'Pacientes / Alunos',
  '/dashboard/plans': 'Planos Alimentares',
  '/dashboard/workouts': 'Treinos',
  '/dashboard/schedule': 'Agenda',
  '/dashboard/progress': 'Progresso',
  '/dashboard/messages': 'Mensagens',
  '/dashboard/settings': 'Configurações',
  '/dashboard/diet': 'Plano Alimentar',
}

export default function Topbar({ onToggleSidebar }) {
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const { user, fullName, role, initials, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const roleLabel = roleName(user?.professional?.speciality || role)

  return (
    <header className="sticky top-0 z-50 flex h-16 flex-shrink-0 items-center justify-between border-b border-[color:var(--border-soft)] bg-[var(--panel-bg)] px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border-none bg-transparent text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] md:hidden" onClick={onToggleSidebar}>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="font-display m-0 text-base font-bold text-[var(--text-primary)]">{pageTitles[location.pathname] ?? 'Dashboard'}</h1>
      </div>

      <div className="relative flex items-center gap-2" ref={menuRef}>
        <button className="border-none bg-transparent p-0" aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'} onClick={toggleTheme}>
          <span className={`flex h-8 w-[58px] items-center rounded-full border border-[color:var(--border-color)] p-[3px] transition-colors ${isDark ? 'bg-slate-900' : 'bg-amber-300'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 shadow transition-transform ${isDark ? '' : 'translate-x-[26px]'}`}>
              {isDark ? <MoonIcon /> : <SunIcon />}
            </span>
          </span>
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-[9px] border border-[color:var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-strong)] hover:text-[var(--text-primary)]">
          <BellIcon />
          <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full border-2 border-[var(--panel-bg)] bg-blue-500" />
        </button>

        <button className="flex items-center gap-2.5 rounded-[10px] border border-[color:var(--border-color)] bg-[var(--hover-bg)] px-2.5 py-1.5 transition-colors hover:bg-[var(--hover-strong)]" onClick={() => setMenuOpen((current) => !current)}>
          {user?.avatar && !avatarFailed ? <img src={user.avatar} className="h-[30px] w-[30px] rounded-full object-cover" onError={() => setAvatarFailed(true)} /> : <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-blue-500/30 bg-gradient-to-br from-blue-600 to-blue-500 text-sm font-bold text-white">{initials}</div>}
          <div className="hidden flex-col text-left md:flex">
            <p className="m-0 whitespace-nowrap text-[0.8125rem] font-semibold text-[var(--text-primary)]">{fullName}</p>
            <p className="m-0 text-[0.7rem] text-[var(--text-secondary)]">{roleLabel}</p>
          </div>
          <ChevronIcon open={menuOpen} />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-[200] w-[220px] rounded-xl border border-[color:var(--border-color)] bg-[var(--panel-bg-strong)] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
            <div className="px-2.5 pb-2 pt-2.5">
              <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">{fullName}</p>
              <p className="m-0 truncate text-xs text-[var(--text-secondary)]">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-[var(--border-soft)]" />
            <Link className="dropdown-link" to="/dashboard/settings" onClick={() => setMenuOpen(false)}>
              Meu Perfil
            </Link>
            <Link className="dropdown-link" to="/dashboard/settings" onClick={() => setMenuOpen(false)}>
              Configurações
            </Link>
            <div className="my-1 h-px bg-[var(--border-soft)]" />
            <button className="dropdown-link w-full text-red-400 hover:!bg-[var(--danger-soft)]" onClick={handleLogout}>
              Sair
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function roleName(role) {
  return (
    {
      professional: 'Profissional',
      nutritionist: 'Nutricionista',
      trainer: 'Treinador',
      client: 'Cliente',
    }[role] ?? ''
  )
}

function BellIcon() {
  return <svg className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
}

function MoonIcon() {
  return <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
}

function SunIcon() {
  return <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 18.75V21M5.636 5.636l1.591 1.591M16.773 16.773l1.591 1.591M3 12h2.25M18.75 12H21M5.636 18.364l1.591-1.591M16.773 7.227l1.591-1.591M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
}

function ChevronIcon({ open }) {
  return <svg className={`hidden h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform md:block ${open ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
}
