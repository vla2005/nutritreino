import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/composables/useAuth.js'
import { useTheme } from '@/composables/useTheme.js'
import { VideoCallProvider } from '@/components/VideoCallProvider.jsx'
import { joinOnlineUsers, leaveOnlineUsers } from '@/services/echo.js'
import MobileBottomNav from './components/MobileBottomNav.jsx'
import Sidebar from './components/Sidebar.jsx'
import './AppShell.css'

export default function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { fetchMe, user } = useAuth()
  const userUuid = user?.uuid
  useTheme()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    if (!userUuid) return undefined

    joinOnlineUsers()

    return () => {
      leaveOnlineUsers()
    }
  }, [userUuid])

  return (
    <div className="dashboard-layout flex min-h-[100dvh]">
      <button className="dashboard-mobile-menu" type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Abrir menu">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {mobileSidebarOpen ? <button className="dashboard-sidebar-overlay" type="button" aria-label="Fechar menu" onClick={() => setMobileSidebarOpen(false)} /> : null}

      <VideoCallProvider>
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggle={() => setSidebarCollapsed((current) => !current)}
        />
        <div className={`flex min-w-0 flex-1 flex-col transition-[margin-left] duration-300 md:ml-[262px] ${sidebarCollapsed ? 'md:!ml-[76px]' : ''}`}>
          <main className="dashboard-main flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <MobileBottomNav />
      </VideoCallProvider>
    </div>
  )
}
