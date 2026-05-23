export default function LoginDivider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-[#484f58]">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  )
}
