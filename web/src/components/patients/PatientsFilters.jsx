export default function PatientsFilters({ tabs, activeTab, search, onTabChange, onSearchChange }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[color:var(--border-color)] bg-[color:color-mix(in_srgb,var(--panel-bg)_92%,var(--panel-muted)_8%)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${activeTab === tab.value ? 'bg-[var(--panel-muted)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            onClick={() => onTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-xs flex-1">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          type="text"
          placeholder="Buscar paciente..."
          className="w-full rounded-lg border border-[color:var(--border-color)] bg-[color:color-mix(in_srgb,var(--panel-bg)_92%,var(--panel-muted)_8%)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-blue-500/45 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  )
}
