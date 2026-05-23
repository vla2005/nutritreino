import { useEffect, useRef, useState } from 'react'

export default function PatientsTable({ items, currentPage, totalPages, onToggleSort, onEdit, onRemove, onPageChange }) {
  const [openMenu, setOpenMenu] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpenMenu(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--border-color)] bg-[var(--panel-bg)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <div className="hidden border-b border-[color:var(--border-color)] bg-[color:color-mix(in_srgb,var(--panel-bg)_70%,var(--layout-bg)_30%)] px-6 py-3 lg:grid lg:grid-cols-[2fr_1fr_1.2fr_1.5fr_1.5fr_40px] lg:items-center lg:gap-3">
        <button className="flex items-center gap-1.5 border-none bg-transparent p-0 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]" onClick={onToggleSort}>
          Paciente
          <SortIcon />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Contato</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Objetivo</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Progresso</span>
        <span />
      </div>

      {items.length ? (
        items.map((patient, index) => (
          <div key={patient.uuid} className={`grid grid-cols-1 gap-3 px-4 py-4 transition-colors duration-150 hover:bg-[var(--hover-bg)] lg:grid-cols-[2fr_1fr_1.2fr_1.5fr_1.5fr_40px] lg:items-center lg:px-6 ${index < items.length - 1 ? 'border-b border-[color:var(--border-color)]' : ''}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: avatarColor(patient.name) }}>
                {initials(patient.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{patient.name}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{patient.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(patient.status)}`}>{statusLabel(patient.status)}</span>
            </div>
            <div className="flex items-center text-sm text-[var(--text-secondary)]">{patient.phone}</div>
            <div className="min-w-0 text-sm text-[var(--text-secondary)]">{patient.goal}</div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--hover-bg)_75%,var(--panel-muted)_25%)]">
                <div className={`h-full rounded-full transition-all duration-500 ${patient.progress >= 70 ? 'bg-emerald-500' : patient.progress >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${patient.progress}%` }} />
              </div>
              <span className="w-8 text-right text-xs text-[var(--text-muted)]">{patient.progress}%</span>
            </div>
            <div className="flex items-center justify-end">
              <div className="relative" ref={openMenu === patient.uuid ? menuRef : null}>
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-all hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]" onClick={(event) => { event.stopPropagation(); setOpenMenu(openMenu === patient.uuid ? null : patient.uuid) }}>
                  <DotsIcon />
                </button>
                {openMenu === patient.uuid ? (
                  <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-[color:var(--border-color)] bg-[var(--panel-bg-strong)] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                    <button className="table-menu-item" onClick={() => onEdit(patient)}>Editar</button>
                    <button className="table-menu-item" onClick={() => setOpenMenu(null)}>Ver plano</button>
                    <div className="my-1 h-px bg-[var(--border-color)]" />
                    <button className="table-menu-item text-red-400 hover:!bg-[var(--danger-soft)]" onClick={() => onRemove(patient.uuid)}>Remover</button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center gap-3 py-16">
          <UsersIcon />
          <p className="text-sm text-[var(--text-muted)]">Nenhum paciente encontrado.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-[color:var(--border-color)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-[var(--text-muted)]">
          Pagina <span className="font-medium text-[var(--text-secondary)]">{currentPage}</span> de <span className="font-medium text-[var(--text-secondary)]">{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-[color:var(--border-color)] bg-[color:color-mix(in_srgb,var(--panel-bg)_92%,var(--panel-muted)_8%)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            Anterior
          </button>
          <button className="rounded-lg border border-[color:var(--border-color)] bg-[color:color-mix(in_srgb,var(--panel-bg)_92%,var(--panel-muted)_8%)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
            Proximo
          </button>
        </div>
      </div>
    </div>
  )
}

function statusLabel(status) {
  return { active: 'Ativo', inactive: 'Inativo', pending: 'Pendente' }[status] ?? status
}

function statusClass(status) {
  return {
    active: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
    inactive: 'border-[color:var(--border-color)] bg-[color:color-mix(in_srgb,var(--panel-muted)_76%,transparent)] text-[var(--text-secondary)]',
    pending: 'border-amber-500/35 bg-amber-500/15 text-amber-200',
  }[status] ?? ''
}

const colors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#0891b2']

function avatarColor(name) {
  return colors[name.charCodeAt(0) % colors.length]
}

function initials(name) {
  const parts = name.trim().split(' ')
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
}

function SortIcon() {
  return <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
}

function DotsIcon() {
  return <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
}

function UsersIcon() {
  return <svg className="h-10 w-10 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
