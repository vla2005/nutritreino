export default function StatCard({ label, value, icon, iconBg = 'rgba(59,130,246,0.12)', iconBorder = 'rgba(59,130,246,0.25)', trend = null }) {
  return (
    <div className="flex items-start gap-4 rounded-[14px] border border-white/10 bg-[var(--panel-bg)] p-5 transition-all hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border text-blue-300" style={{ background: iconBg, borderColor: iconBorder }}>
        {icon}
      </div>
      <div>
        <p className="m-0 mb-1 text-[0.8rem] font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)]">{label}</p>
        <p className="font-display m-0 mb-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        {trend ? <p className={`m-0 text-xs ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% vs mês anterior</p> : null}
      </div>
    </div>
  )
}
