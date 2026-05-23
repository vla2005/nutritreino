import ActivityFeed from '../../components/dashboard/widgets/ActivityFeed.jsx'
import StatCard from '../../components/dashboard/widgets/StatCard.jsx'
import WelcomeBanner from '../../components/dashboard/widgets/WelcomeBanner.jsx'
import { useIcons } from '../../composables/useIcons.jsx'

const recentActivity = [
  { id: 1, type: 'success', text: 'Cafe da manha registrado.', time: 'Ha 2h' },
  { id: 2, type: 'info', text: 'Novo plano alimentar disponível.', time: 'Hoje' },
  { id: 3, type: 'warning', text: 'Beba mais água, meta não atingida.', time: 'Ontem' },
  { id: 4, type: 'success', text: 'Treino de segunda concluido.', time: 'Ontem' },
]

const meals = [
  { id: 1, mark: 'CM', name: 'Cafe da Manha', calories: 420, done: true },
  { id: 2, mark: 'AL', name: 'Almoco', calories: 680, done: true },
  { id: 3, mark: 'LC', name: 'Lanche', calories: 180, done: false },
  { id: 4, mark: 'JT', name: 'Jantar', calories: 560, done: false },
]

export default function PatientHome() {
  const { icons } = useIcons()

  return (
    <div className="fade-up">
      <WelcomeBanner />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Calorias Hoje" value="1.840" trend={-3} icon={icons.diet} iconBg="rgba(245,158,11,0.12)" iconBorder="rgba(245,158,11,0.25)" />
        <StatCard label="Treinos Semana" value="3 / 5" icon={icons.workouts} iconBg="rgba(16,185,129,0.12)" iconBorder="rgba(16,185,129,0.25)" />
        <StatCard label="Peso Atual (kg)" value="74,2" trend={-2} icon={icons.progress} iconBg="rgba(59,130,246,0.12)" iconBorder="rgba(59,130,246,0.25)" />
        <StatCard label="Agua (ml)" value="1.600" icon={icons.schedule} iconBg="rgba(139,92,246,0.12)" iconBorder="rgba(139,92,246,0.25)" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityFeed items={recentActivity} />
        <div className="rounded-[14px] border border-white/10 bg-[var(--panel-bg)] p-5">
          <h3 className="font-display m-0 mb-4 text-[0.9375rem] font-bold text-[var(--text-primary)]">Refeicoes de Hoje</h3>
          <div className="flex flex-col gap-3">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-[var(--text-secondary)]">{meal.mark}</span>
                <div className="flex-1">
                  <p className="m-0 mb-0.5 text-sm font-semibold text-[var(--text-primary)]">{meal.name}</p>
                  <p className="m-0 text-xs text-[var(--text-secondary)]">{meal.calories} kcal</p>
                </div>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${meal.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-white/15'}`}>
                  {meal.done ? <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
