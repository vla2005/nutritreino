import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AiLoadingIcon from '../../components/ui/AiLoadingIcon.jsx'
import AiLoadingOverlay from '../../components/ui/AiLoadingOverlay.jsx'
import { useAuth } from '../../composables/useAuth.js'
import { useToast } from '../../composables/useToast.jsx'
import { listClients } from '../../services/clients.js'
import { createWorkoutProgram, generateWorkoutProgramSuggestion, getWorkoutProgram, updateWorkoutProgram } from '../../services/workoutPrograms.js'

const defaultDays = [
  {
    id: 1,
    name: '',
    weekDays: '',
    expanded: true,
    exercises: [],
  },
]

export default function WorkoutPlanForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const { uuid } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const initialPatient = location.state?.patient
  const isDetailMode = Boolean(uuid)
  const isTrainer = user?.professional?.speciality === 'trainer'
  const isClient = user?.role === 'client'
  const canAccessWorkout = isTrainer || (isClient && isDetailMode)
  const readOnly = isDetailMode && !isTrainer
  const [patients, setPatients] = useState(initialPatient ? [initialPatient] : [])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingProgram, setLoadingProgram] = useState(false)
  const [loadedProgram, setLoadedProgram] = useState(null)
  const [saving, setSaving] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [aiForm, setAiForm] = useState({
    weeklyFrequency: 4,
    sessionDuration: 60,
    preferences: '',
    limitations: '',
    equipment: '',
    notes: '',
  })
  const [program, setProgram] = useState(() => ({
    title: 'Programa Hipertrofia - Fase 2',
    patientId: initialPatient?.uuid || initialPatient?.id ? String(initialPatient.uuid || initialPatient.id) : '',
    goal: 'Hipertrofia',
    level: 'Intermediário',
    startDate: todayInput(),
    endDate: nextMonthInput(),
    notes: '',
  }))
  const [days, setDays] = useState(defaultDays)

  useEffect(() => {
    if (!uuid) return

    let mounted = true

    async function loadProgram() {
      try {
        setLoadingProgram(true)
        const data = await getWorkoutProgram(uuid)
        if (!mounted) return

        setLoadedProgram(data)
        const patient = normalizePatient(data.client || {})
        setPatients((current) => mergePatients(current, [patient]))
        setProgram({
          title: data.title || '',
          patientId: patient.uuid || '',
          goal: data.goal || 'Hipertrofia',
          level: data.level || 'Intermediário',
          startDate: data.start_date || todayInput(),
          endDate: data.end_date || nextMonthInput(),
          notes: data.general_notes || '',
        })
        setDays(normalizeDays(data.days || []))
      } catch (error) {
        if (mounted) toast.warning(error.message)
      } finally {
        if (mounted) setLoadingProgram(false)
      }
    }

    loadProgram()

    return () => {
      mounted = false
    }
  }, [toast, uuid])

  useEffect(() => {
    if (!isTrainer) return

    let mounted = true

    async function loadPatients() {
      try {
        setLoadingPatients(true)
        const clients = await listClients()
        if (mounted) setPatients((current) => mergePatients(current, clients.map(normalizePatient)))
      } catch {
        if (mounted) toast.warning('Não foi possível carregar os alunos.')
      } finally {
        if (mounted) setLoadingPatients(false)
      }
    }

    loadPatients()

    return () => {
      mounted = false
    }
  }, [isTrainer, toast])

  const selectedPatient = useMemo(() => patients.find((patient) => String(patient.uuid) === String(program.patientId)), [patients, program.patientId])
  const totalExercises = useMemo(() => days.reduce((sum, day) => sum + day.exercises.filter((exercise) => exercise.name.trim()).length, 0), [days])

  if (!canAccessWorkout) {
    return (
      <div className="nutrition-plan-page">
        <header className="plan-page-header">
          <button type="button" className="plan-back-button" onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeftIcon />
          </button>
          <div>
            <h1>Treinos indisponíveis</h1>
            <p>Esta seção aparece somente para profissionais com especialidade Treinador.</p>
          </div>
        </header>
      </div>
    )
  }

  function updateProgram(field, value) {
    if (readOnly) return
    setProgram((current) => ({ ...current, [field]: value }))
  }

  function updateAi(field, value) {
    setAiForm((current) => ({ ...current, [field]: value }))
  }

  async function generateWithAi() {
    if (readOnly || generatingAi) return

    if (!program.patientId) {
      toast.warning('Selecione um aluno antes de gerar com IA.')
      return
    }

    try {
      setGeneratingAi(true)
      const suggestion = await generateWorkoutProgramSuggestion({
        client_uuid: program.patientId,
        objective: program.goal,
        level: program.level,
        weekly_frequency: Number(aiForm.weeklyFrequency || 4),
        session_duration: Number(aiForm.sessionDuration || 60),
        preferences: aiForm.preferences,
        limitations: aiForm.limitations,
        equipment: aiForm.equipment,
        notes: aiForm.notes || program.notes,
      })

      setProgram((current) => ({
        ...current,
        title: suggestion.title || current.title,
        goal: suggestion.goal || current.goal,
        level: suggestion.level || current.level,
        notes: suggestion.general_notes || current.notes,
      }))
      setDays(normalizeDaysForForm(suggestion.days || []))
      toast.success('Rascunho gerado. Revise antes de salvar.')
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setGeneratingAi(false)
    }
  }

  function clearAiDraft() {
    if (readOnly || generatingAi) return

    setProgram((current) => ({
      ...current,
      title: 'Programa Hipertrofia - Fase 2',
      goal: 'Hipertrofia',
      level: 'Intermediário',
      notes: '',
    }))
    setDays(defaultDays)
    toast.success('Rascunho limpo.')
  }

  function updateDay(id, patch) {
    if (readOnly && Object.keys(patch).some((key) => key !== 'expanded')) return
    setDays((current) => current.map((day) => (day.id === id ? { ...day, ...patch } : day)))
  }

  function addDay() {
    if (readOnly) return
    const id = Date.now()
    setDays((current) => [
      ...current.map((day) => ({ ...day, expanded: false })),
      { id, name: 'Novo Treino', weekDays: '', expanded: true, exercises: [] },
    ])
  }

  function removeDay(id) {
    if (readOnly) return
    setDays((current) => current.filter((day) => day.id !== id))
  }

  function addExercise(dayId) {
    if (readOnly) return
    setDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day
        return { ...day, exercises: [...day.exercises, { id: Date.now(), name: '', sets: '3', reps: '10', rest: '60', note: '' }] }
      }),
    )
  }

  function updateExercise(dayId, exerciseId, patch) {
    if (readOnly) return
    setDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day
        return {
          ...day,
          exercises: day.exercises.map((exercise) => (exercise.id === exerciseId ? { ...exercise, ...patch } : exercise)),
        }
      }),
    )
  }

  function removeExercise(dayId, exerciseId) {
    if (readOnly) return
    setDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day
        return { ...day, exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId) }
      }),
    )
  }

  async function saveProgram() {
    if (readOnly) return
    if (saving) return

    if (!program.title.trim()) {
      toast.warning('Informe o título do programa.')
      return
    }

    if (!program.patientId) {
      toast.warning('Selecione um aluno.')
      return
    }

    if (!days.length) {
      toast.warning('Adicione pelo menos um dia de treino.')
      return
    }

    if (days.some((day) => !day.name.trim())) {
      toast.warning('Informe o nome de todos os dias de treino.')
      return
    }

    if (days.some((day) => !day.exercises.length)) {
      toast.warning('Adicione pelo menos um exercício em cada dia de treino.')
      return
    }

    if (days.some((day) => day.exercises.some((exercise) => !exercise.name.trim()))) {
      toast.warning('Informe o nome de todos os exercícios.')
      return
    }

    if (days.some((day) => day.exercises.some((exercise) => Number(exercise.sets || 0) < 1 || Number(exercise.reps || 0) < 1 || Number(exercise.rest || 0) < 0))) {
      toast.warning('Revise séries, repetições e descanso dos exercícios.')
      return
    }

    const payload = {
      title: program.title,
      client_uuid: program.patientId,
      goal: program.goal,
      level: program.level,
      start_date: program.startDate,
      end_date: program.endDate,
      general_notes: program.notes,
      days: days.map((day, dayIndex) => ({
        name: day.name,
        week_days: day.weekDays,
        order: dayIndex,
        exercises: day.exercises.map((exercise, exerciseIndex) => ({
          name: exercise.name,
          sets: Number(exercise.sets || 0),
          reps: Number(exercise.reps || 0),
          rest_seconds: Number(exercise.rest || 0),
          notes: exercise.note,
          order: exerciseIndex,
        })),
      })),
    }

    try {
      setSaving(true)
      await (uuid ? updateWorkoutProgram(uuid, payload) : createWorkoutProgram(payload))
      toast.success(uuid ? 'Programa de treino atualizado com sucesso!' : 'Programa de treino salvo com sucesso!')
    } catch (error) {
      console.error(error)
      toast.warning(Object.values(error.fieldErrors || {})[0] || error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="nutrition-plan-page">
      {generatingAi ? <AiLoadingOverlay text="IA montando o rascunho do treino" /> : null}

      <header className="plan-page-header">
        <button type="button" className="plan-back-button" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeftIcon />
        </button>
        <div>
          <h1>{readOnly ? 'Detalhes do Programa de Treino' : isDetailMode ? 'Editar Programa de Treino' : 'Criar Programa de Treino'}</h1>
          <p>Defina os dias, exercícios e séries para o aluno</p>
        </div>
      </header>

      {loadingProgram ? (
        <section className="plan-card">
          <p className="meal-plans-empty">Carregando treino...</p>
        </section>
      ) : (
      <div className="plan-page-grid">
        <div className="plan-main-column">
          <section className="plan-card">
            <h2>Informações do Programa</h2>

            <div className="plan-form-grid workout-form-grid">
              <PlanField label="Título do Programa" className="is-full">
                <input value={program.title} disabled={readOnly} onChange={(event) => updateProgram('title', event.target.value)} />
              </PlanField>

              <PlanField label="Aluno">
                <select value={program.patientId} disabled={readOnly} onChange={(event) => updateProgram('patientId', event.target.value)}>
                  <option value="">{loadingPatients ? 'Carregando alunos...' : 'Selecione um aluno'}</option>
                  {patients.map((patient) => (
                    <option key={patient.uuid} value={patient.uuid}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </PlanField>

              <PlanField label="Objetivo">
                <select value={program.goal} disabled={readOnly} onChange={(event) => updateProgram('goal', event.target.value)}>
                  <option>Hipertrofia</option>
                  <option>Força</option>
                  <option>Emagrecimento</option>
                  <option>Condicionamento</option>
                  <option>Reabilitação</option>
                </select>
              </PlanField>

              <PlanField label="Nível">
                <select value={program.level} disabled={readOnly} onChange={(event) => updateProgram('level', event.target.value)}>
                  <option>Iniciante</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </PlanField>

              <PlanField label="Início">
                <input type="date" value={program.startDate} disabled={readOnly} onChange={(event) => updateProgram('startDate', event.target.value)} />
              </PlanField>

              <PlanField label="Término">
                <input type="date" value={program.endDate} disabled={readOnly} onChange={(event) => updateProgram('endDate', event.target.value)} />
              </PlanField>

              <PlanField label="Observações Gerais" className="is-full">
                <textarea value={program.notes} disabled={readOnly} placeholder="Restrições, orientações gerais, aquecimento recomendado..." onChange={(event) => updateProgram('notes', event.target.value)} />
              </PlanField>
            </div>
          </section>

          {!readOnly ? (
            <section className="plan-card ai-plan-card">
              <div className="ai-plan-head">
                <span aria-hidden="true"><SparkIcon /></span>
                <div>
                  <div className="ai-plan-title-row">
                    <h2>Copiloto de treino</h2>
                    <small>Gemini</small>
                  </div>
                  <p>Rascunho editável para revisar antes de salvar.</p>
                  <div className="ai-plan-meta" aria-label="Contexto usado pela IA">
                    <span>frequência</span>
                    <span>equipamentos</span>
                    <span>limitações</span>
                    <span>objetivo</span>
                  </div>
                </div>
              </div>
              <div className="ai-plan-grid">
                <PlanField label="Treinos por semana">
                  <input type="number" min="1" max="7" value={aiForm.weeklyFrequency} onChange={(event) => updateAi('weeklyFrequency', event.target.value)} />
                </PlanField>
                <PlanField label="Duração por sessão">
                  <input type="number" min="15" max="240" value={aiForm.sessionDuration} onChange={(event) => updateAi('sessionDuration', event.target.value)} placeholder="Minutos" />
                </PlanField>
                <PlanField label="Gostos e preferências" className="is-full">
                  <textarea value={aiForm.preferences} onChange={(event) => updateAi('preferences', event.target.value)} placeholder="Ex: gosta de musculação, prefere treinos curtos, quer evitar cardio longo..." />
                </PlanField>
                <PlanField label="Limitações/restrições" className="is-full">
                  <textarea value={aiForm.limitations} onChange={(event) => updateAi('limitations', event.target.value)} placeholder="Ex: dor no joelho, lesão no ombro, pouca mobilidade..." />
                </PlanField>
                <PlanField label="Equipamentos disponíveis" className="is-full">
                  <textarea value={aiForm.equipment} onChange={(event) => updateAi('equipment', event.target.value)} placeholder="Ex: academia completa, halteres, elásticos, treino em casa..." />
                </PlanField>
              </div>
              <div className="ai-plan-actions">
                <button type="button" className="ai-generate-button" onClick={generateWithAi} disabled={generatingAi}>
                  {generatingAi ? <AiLoadingIcon /> : <SparkIcon />}
                  {generatingAi ? 'Gerando' : 'Gerar rascunho'}
                </button>
                <button type="button" className="ai-clear-button" onClick={clearAiDraft} disabled={generatingAi}>
                  Limpar rascunho
                </button>
              </div>
            </section>
          ) : null}

          <section className="plan-meals-section">
            <div className="plan-section-head">
              <h2>Dias de Treino</h2>
              {!readOnly ? (
                <button type="button" onClick={addDay}>
                  <PlusIcon />
                  Adicionar Dia
                </button>
              ) : null}
            </div>

            <div className="plan-meal-list">
              {days.map((day) => (
                <WorkoutDayCard
                  key={day.id}
                  day={day}
                  onUpdate={(patch) => updateDay(day.id, patch)}
                  onRemove={() => removeDay(day.id)}
                  onAddExercise={() => addExercise(day.id)}
                  onUpdateExercise={(exerciseId, patch) => updateExercise(day.id, exerciseId, patch)}
                  onRemoveExercise={(exerciseId) => removeExercise(day.id, exerciseId)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="plan-summary-card">
          <h2>Resumo do Programa</h2>

          <div className="plan-summary-lines">
            <SummaryLine label="Aluno" value={selectedPatient?.name || '-'} />
            {loadedProgram?.trainer ? <ProfessionalSummaryLine label="Treinador" professional={loadedProgram.trainer} /> : null}
            <SummaryLine label="Objetivo" value={program.goal} />
            <SummaryLine label="Nível" value={program.level} />
            <SummaryLine label="Dias de Treino" value={days.length} />
            <SummaryLine label="Total de Exercícios" value={totalExercises} />
            <SummaryLine label="Período" value={`${formatShortDate(program.startDate)} - ${formatShortDate(program.endDate)}`} />
          </div>

          <div className="plan-summary-meals">
            <h3>Dias</h3>
            {days.map((day) => {
              const count = day.exercises.filter((exercise) => exercise.name.trim()).length
              return (
                <div key={day.id}>
                  <span>{day.name || 'Sem nome'}</span>
                  <strong className={count ? '' : 'is-empty'}>{count ? `${count} ex.` : 'vazio'}</strong>
                </div>
              )
            })}
          </div>

          <button type="button" className="plan-save-button" onClick={saveProgram} disabled={saving} hidden={readOnly}>
            <SaveIcon />
            {saving ? 'Salvando...' : uuid ? 'Salvar Alterações' : 'Salvar Programa'}
          </button>
        </aside>
      </div>
      )}
    </div>
  )
}

function WorkoutDayCard({ day, onUpdate, onRemove, onAddExercise, onUpdateExercise, onRemoveExercise, readOnly = false }) {
  const exerciseCount = day.exercises.filter((exercise) => exercise.name.trim()).length

  return (
    <article className="plan-meal-card">
      <header className="plan-meal-header workout-day-header" onClick={() => onUpdate({ expanded: !day.expanded })}>
        <div className="plan-meal-title">
          <span aria-hidden="true"><DumbbellIcon /></span>
          <div>
            <h3>{day.name || 'Sem nome'}</h3>
            <p>{day.weekDays || 'Dias não definidos'} <span>-</span> {exerciseCount} exercício(s)</p>
          </div>
        </div>

        <div className="plan-meal-actions">
          {!readOnly ? <button type="button" onClick={(event) => { event.stopPropagation(); onRemove() }} aria-label="Remover dia de treino"><TrashIcon /></button> : null}
          <span className="workout-chevron-indicator" aria-hidden="true">
            <ChevronIcon open={day.expanded} />
          </span>
        </div>
      </header>

      <div className={`plan-meal-body ${day.expanded ? 'is-open' : ''}`} aria-hidden={!day.expanded}>
        <div className="plan-meal-body-inner">
          <div className="plan-meal-fields">
            <PlanField label="Nome do Dia">
              <input placeholder='Ex: Treino A - Peito e Tríceps' value={day.name} disabled={readOnly} onChange={(event) => onUpdate({ name: event.target.value })} />
            </PlanField>
            <PlanField label="Dias da Semana">
              <input placeholder='Ex: Segunda e quinta' value={day.weekDays} disabled={readOnly} onChange={(event) => onUpdate({ weekDays: event.target.value })} />
            </PlanField>
          </div>

          <div className="workout-exercise-block">
            <label>Exercícios</label>
            <div className="workout-exercise-head" aria-hidden="true">
              <span>Exercício</span>
              <span>Séries</span>
              <span>Reps</span>
              <span>Descanso</span>
              <span>Observação</span>
            </div>

            {day.exercises.map((exercise) => (
              <div className="workout-exercise-row" key={exercise.id}>
                <input value={exercise.name} disabled={readOnly} placeholder="Nome do exercício" onChange={(event) => onUpdateExercise(exercise.id, { name: event.target.value })} />
                <input value={exercise.sets} disabled={readOnly} inputMode="numeric" onChange={(event) => onUpdateExercise(exercise.id, { sets: onlyNumbers(event.target.value) })} />
                <input value={exercise.reps} disabled={readOnly} inputMode="numeric" onChange={(event) => onUpdateExercise(exercise.id, { reps: onlyNumbers(event.target.value) })} />
                <label className="workout-rest-input">
                  <input value={exercise.rest} disabled={readOnly} inputMode="numeric" onChange={(event) => onUpdateExercise(exercise.id, { rest: onlyNumbers(event.target.value) })} />
                  <span>s</span>
                </label>
                <input value={exercise.note} disabled={readOnly} placeholder="Cadência, variação..." onChange={(event) => onUpdateExercise(exercise.id, { note: event.target.value })} />
                {!readOnly ? <button type="button" onClick={() => onRemoveExercise(exercise.id)} aria-label="Remover exercício"><TrashIcon /></button> : null}
              </div>
            ))}

            <button type="button" className="plan-add-food" onClick={onAddExercise} hidden={readOnly}>
              <PlusIcon />
              Adicionar Exercício
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function PlanField({ label, className = '', children }) {
  return (
    <label className={`plan-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function SummaryLine({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ProfessionalSummaryLine({ label, professional }) {
  return (
    <div>
      <span>{label}</span>
      {professional?.uuid ? (
        <Link className="plan-professional-link" to={`/dashboard/professionals/${professional.uuid}`}>
          {professional.name || 'Profissional'}
        </Link>
      ) : (
        <strong>{professional?.name || '-'}</strong>
      )}
    </div>
  )
}

function mergePatients(current, incoming) {
  const map = new Map()
  ;[...current, ...incoming].forEach((patient) => map.set(String(patient.uuid), patient))
  return Array.from(map.values())
}

function normalizePatient(patient) {
  return {
    uuid: patient.uuid || patient.id || patient.email,
    name: patient.name || 'Aluno sem nome',
    email: patient.email || '',
  }
}

function normalizeDays(days) {
  if (!days.length) return defaultDays

  return days.map((day, dayIndex) => ({
    id: day.uuid || dayIndex + 1,
    name: day.name || '',
    weekDays: day.week_days || '',
    expanded: true,
    exercises: (day.exercises || []).map((exercise, exerciseIndex) => ({
      id: exercise.uuid || `${day.uuid || dayIndex}-${exerciseIndex}`,
      name: exercise.name || '',
      sets: String(exercise.sets || ''),
      reps: String(exercise.reps || ''),
      rest: String(exercise.rest_seconds ?? ''),
      note: exercise.notes || '',
    })),
  }))
}

function normalizeDaysForForm(days) {
  if (!days.length) return defaultDays

  return days.map((day, dayIndex) => ({
    id: Date.now() + dayIndex,
    name: day.name || '',
    weekDays: day.week_days || '',
    expanded: dayIndex === 0,
    exercises: (day.exercises || []).map((exercise, exerciseIndex) => ({
      id: `${Date.now()}-${dayIndex}-${exerciseIndex}`,
      name: exercise.name || '',
      sets: String(exercise.sets || '3'),
      reps: String(exercise.reps || '10'),
      rest: String(exercise.rest_seconds ?? '60'),
      note: exercise.notes || '',
    })),
  }))
}

function todayInput() {
  return toInputDate(new Date())
}

function nextMonthInput() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return toInputDate(date)
}

function toInputDate(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

function formatShortDate(value) {
  if (!value) return '--/--'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}`
}

function onlyNumbers(value) {
  return value.replace(/[^\d]/g, '')
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function SaveIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h10l2 2v16H6V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 3v6h6V3M9 18v-5h6v5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M9 7l1-3h4l1 3M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChevronIcon({ open }) {
  return <svg className={open ? 'is-open' : ''} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function DumbbellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6.5 7.5 10 10M4 10l3-3M7 13l3-3M14 7l3-3M17 10l3-3M4.5 13.5l6-6M13.5 19.5l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function SparkIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
