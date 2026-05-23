export default function ActivityFeed({ items = [] }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-[var(--panel-bg)] p-5">
      <h3 className="font-display m-0 mb-4 text-[0.9375rem] font-bold text-[var(--text-primary)]">Atividade Recente</h3>
      <div className="flex flex-col gap-3.5">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotClass[item.type] ?? 'bg-blue-500'}`} />
              <div>
                <p className="m-0 mb-0.5 text-sm text-[#c9d1d9]">{item.text}</p>
                <p className="m-0 text-xs text-[var(--text-muted)]">{item.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-5 text-center text-sm text-[var(--text-muted)]">Nenhuma atividade recente.</p>
        )}
      </div>
    </div>
  )
}

const dotClass = {
  success: 'bg-emerald-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}
