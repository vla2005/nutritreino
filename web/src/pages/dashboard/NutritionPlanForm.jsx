import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AiLoadingIcon from '../../components/ui/AiLoadingIcon.jsx'
import AiLoadingOverlay from '../../components/ui/AiLoadingOverlay.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useAuth } from '../../composables/useAuth.js'
import { useToast } from '../../composables/useToast.jsx'
import { listClients } from '../../services/clients.js'
import { createMealPlan, generateMealPlanSuggestion, getMealPlan, updateMealPlan } from '../../services/mealPlans.js'

const unitOptions = [
  { value: 'g', label: 'gramas' },
  { value: 'ml', label: 'ml' },
  { value: 'un', label: 'unidades' },
  { value: 'colheres', label: 'colheres' },
  { value: 'fatias', label: 'fatias' },
]

const goalOptions = [
  { value: 'weight_loss', label: 'Emagrecimento' },
  { value: 'muscle_gain', label: 'Ganhar massa' },
  { value: 'body_recomposition', label: 'Recomposição corporal' },
  { value: 'maintenance', label: 'Manutenção' },
]

const planTypeOptions = [
  { value: 'hypocaloric', label: 'Hipocalórico' },
  { value: 'balanced', label: 'Equilíbrio nutricional' },
  { value: 'hypercaloric', label: 'Hipercalórico' },
  { value: 'low_carb', label: 'Low carb' },
]

const defaultMeals = [
  {
    id: 1,
    name: '',
    time: '',
    expanded: true,
    instructions: '',
    foods: [],
  },
]

export default function NutritionPlanForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const { uuid } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const initialPatient = location.state?.patient
  const isDetailMode = Boolean(uuid)
  const [patients, setPatients] = useState(initialPatient ? [initialPatient] : [])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [loadedPlan, setLoadedPlan] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [aiForm, setAiForm] = useState({
    targetCalories: '',
    preferences: '',
    limitations: '',
    notes: '',
    mealsCount: 5,
    adjustmentRequest: '',
  })
  const [plan, setPlan] = useState(() => ({
    title: 'Plano Nutricional - Semana 1',
    patientId: initialPatient?.uuid || initialPatient?.id ? String(initialPatient.uuid || initialPatient.id) : '',
    startDate: todayInput(),
    endDate: nextMonthInput(),
    clientGoal: 'weight_loss',
    planType: 'balanced',
    notes: '',
  }))
  const [meals, setMeals] = useState(defaultMeals)
  const canLoadPatients = user?.professional?.speciality === 'nutritionist'

  useEffect(() => {
    if (!uuid) return

    let mounted = true

    async function loadPlan() {
      try {
        setLoadingPlan(true)
        const data = await getMealPlan(uuid)
        if (!mounted) return

        setLoadedPlan(data)
        const patient = normalizePatient(data.client || {})
        setPatients((current) => mergePatients(current, [patient]))
        setPlan({
          title: data.title || '',
          patientId: patient.uuid || '',
          startDate: data.start_date || todayInput(),
          endDate: data.end_date || nextMonthInput(),
          clientGoal: data.client_goal || 'weight_loss',
          planType: data.plan_type || 'balanced',
          notes: data.general_notes || '',
        })
        setMeals(normalizeMeals(data.meals || []))
      } catch (error) {
        if (mounted) toast.warning(error.message)
      } finally {
        if (mounted) setLoadingPlan(false)
      }
    }

    loadPlan()

    return () => {
      mounted = false
    }
  }, [toast, uuid])

  useEffect(() => {
    if (!canLoadPatients) return

    let mounted = true

    async function loadPatients() {
      try {
        setLoadingPatients(true)
        const clients = await listClients()
        if (!mounted) return

        setPatients((current) => mergePatients(current, clients.map(normalizePatient)))
      } catch {
        if (mounted) toast.warning('Não foi possível carregar os pacientes.')
      } finally {
        if (mounted) setLoadingPatients(false)
      }
    }

    loadPatients()

    return () => {
      mounted = false
    }
  }, [canLoadPatients, toast])

  const canEditPlan = Boolean(isDetailMode && loadedPlan?.nutritionist?.uuid && user?.professional?.uuid === loadedPlan.nutritionist.uuid)
  const readOnly = isDetailMode && !canEditPlan
  const selectedPatient = useMemo(() => patients.find((patient) => String(patient.uuid) === String(plan.patientId)), [patients, plan.patientId])
  const totalFoods = useMemo(() => meals.reduce((sum, meal) => sum + meal.foods.filter((food) => food.name.trim()).length, 0), [meals])
  const hasMealDraft = useMemo(() => meals.some((meal) => meal.name.trim() || meal.time || meal.instructions.trim() || meal.foods.some((food) => food.name.trim())), [meals])

  function updatePlan(field, value) {
    if (readOnly) return
    setPlan((current) => ({ ...current, [field]: value }))
  }

  function updateAi(field, value) {
    setAiForm((current) => ({ ...current, [field]: value }))
  }

  async function generateWithAi() {
    if (readOnly || generatingAi) return

    if (!plan.patientId) {
      toast.warning('Selecione um paciente antes de gerar com IA.')
      return
    }

    if (!aiForm.targetCalories) {
      toast.warning('Informe o numero de calorias alvo.')
      return
    }

    try {
      setGeneratingAi(true)
      const suggestion = await generateMealPlanSuggestion({
        client_uuid: plan.patientId,
        objective: optionLabel(goalOptions, plan.clientGoal),
        plan_type: optionLabel(planTypeOptions, plan.planType),
        target_calories: Number(aiForm.targetCalories),
        meals_count: Number(aiForm.mealsCount || 5),
        preferences: aiForm.preferences,
        limitations: aiForm.limitations,
        notes: aiForm.notes || plan.notes,
      })

      applyMealSuggestion(suggestion)
      toast.success('Rascunho gerado. Revise antes de salvar.')
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setGeneratingAi(false)
    }
  }

  async function adjustAiDraft() {
    if (readOnly || generatingAi) return

    if (!plan.patientId) {
      toast.warning('Selecione um paciente antes de ajustar com IA.')
      return
    }

    if (!aiForm.adjustmentRequest.trim()) {
      toast.warning('Descreva o ajuste que deseja no rascunho.')
      return
    }

    try {
      setGeneratingAi(true)
      const suggestion = await generateMealPlanSuggestion({
        client_uuid: plan.patientId,
        objective: optionLabel(goalOptions, plan.clientGoal),
        plan_type: optionLabel(planTypeOptions, plan.planType),
        target_calories: Number(aiForm.targetCalories || 2000),
        meals_count: Number(aiForm.mealsCount || meals.length || 5),
        preferences: aiForm.preferences,
        limitations: aiForm.limitations,
        notes: aiForm.notes || plan.notes,
        adjustment_request: aiForm.adjustmentRequest,
        current_draft: mealDraftPayload(plan, meals),
      })

      applyMealSuggestion(suggestion)
      setAiForm((current) => ({ ...current, adjustmentRequest: '' }))
      toast.success('Rascunho ajustado. Revise antes de salvar.')
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setGeneratingAi(false)
    }
  }

  function applyMealSuggestion(suggestion) {
    setPlan((current) => ({
      ...current,
      title: suggestion.title || current.title,
      notes: suggestion.general_notes || current.notes,
    }))
      setMeals(sortMealsByTime(normalizeMealsForForm(suggestion.meals || [])))
  }

  function clearAiDraft() {
    if (readOnly || generatingAi) return

    setPlan((current) => ({
      ...current,
      title: 'Plano Nutricional - Semana 1',
      notes: '',
    }))
    setMeals(defaultMeals)
    toast.success('Rascunho limpo.')
  }

  function updateMeal(id, patch) {
    if (readOnly && Object.keys(patch).some((key) => key !== 'expanded')) return
    setMeals((current) => current.map((meal) => (meal.id === id ? { ...meal, ...patch } : meal)))
  }

  function addMeal() {
    if (readOnly) return
    const id = Date.now()
    setMeals((current) => [
      ...current.map((meal) => ({ ...meal, expanded: false })),
      { id, name: '', time: '', expanded: true, instructions: '', foods: [] },
    ])
  }

  function requestRemoveMeal(id) {
    if (readOnly) return
    const meal = meals.find((item) => item.id === id)
    setConfirmDelete({
      type: 'meal',
      mealId: id,
      title: 'Excluir refeição?',
      message: `A refeição "${meal?.name || 'Sem nome'}" e todos os alimentos dela serão removidos.`,
    })
  }

  function updateFood(mealId, foodId, patch) {
    if (readOnly) return
    setMeals((current) =>
      current.map((meal) => {
        if (meal.id !== mealId) return meal
        return {
          ...meal,
          foods: meal.foods.map((food) => (food.id === foodId ? { ...food, ...patch } : food)),
        }
      }),
    )
  }

  function addFood(mealId) {
    if (readOnly) return
    setMeals((current) =>
      current.map((meal) => {
        if (meal.id !== mealId) return meal
        return {
          ...meal,
          foods: [...meal.foods, { id: Date.now(), name: '', amount: '', unit: 'g' }],
        }
      }),
    )
  }

  function requestRemoveFood(mealId, foodId) {
    if (readOnly) return
    const meal = meals.find((item) => item.id === mealId)
    const food = meal?.foods.find((item) => item.id === foodId)
    setConfirmDelete({
      type: 'food',
      mealId,
      foodId,
      title: 'Excluir alimento?',
      message: `O alimento "${food?.name || 'Sem nome'}" será removido desta refeição.`,
    })
  }

  function confirmDeletion() {
    if (!confirmDelete) return

    if (confirmDelete.type === 'meal') {
      setMeals((current) => current.filter((meal) => meal.id !== confirmDelete.mealId))
    }

    if (confirmDelete.type === 'food') {
      setMeals((current) =>
        current.map((meal) => {
          if (meal.id !== confirmDelete.mealId) return meal
          return { ...meal, foods: meal.foods.filter((food) => food.id !== confirmDelete.foodId) }
        }),
      )
    }

    setConfirmDelete(null)
  }

  async function savePlan() {
    if (readOnly) return

    if (!plan.title.trim()) {
      toast.warning('Informe o título do plano.')
      return
    }

    if (!plan.patientId) {
      toast.warning('Selecione um paciente.')
      return
    }

    const payload = {
      title: plan.title,
      client_uuid: plan.patientId,
      start_date: plan.startDate,
      end_date: plan.endDate,
      client_goal: plan.clientGoal,
      plan_type: plan.planType,
      general_notes: plan.notes,
      meals: meals.map((meal) => ({
        name: meal.name,
        time: meal.time,
        instructions: meal.instructions,
        foods: meal.foods.map((food) => ({
          name: food.name,
          amount: food.amount,
          unit: food.unit,
        })),
      })),
    }

    try {
      const savedPlan = uuid ? await updateMealPlan(uuid, payload) : await createMealPlan(payload)
      if (uuid) setLoadedPlan(savedPlan)
      toast.success(uuid ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!')
    } catch (error) {
      console.error(error)
      toast.warning(Object.values(error.fieldErrors || {})[0] || error.message)
    }
  }

  return (
    <div className="nutrition-plan-page">
      {generatingAi ? <AiLoadingOverlay text="IA montando o rascunho da dieta" /> : null}

      <header className="plan-page-header">
        <button type="button" className="plan-back-button" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeftIcon />
        </button>
        <div>
          <h1>{isDetailMode ? (canEditPlan ? 'Editar Plano Alimentar' : 'Detalhes do Plano Alimentar') : 'Criar Plano Alimentar'}</h1>
          <p>{readOnly ? 'Visualize as refeições, alimentos e orientações do plano' : 'Defina refeições, alimentos e orientações para o paciente'}</p>
        </div>
      </header>

      {loadingPlan ? (
        <section className="plan-card">
          <p className="meal-plans-empty">Carregando plano alimentar...</p>
        </section>
      ) : (
      <div className="plan-page-grid">
        <div className="plan-main-column">
          <section className="plan-card">
            <h2>Informações do Plano</h2>

            <div className="plan-form-grid">
              <PlanField label="Título do Plano" className="is-full">
                <input value={plan.title} disabled={readOnly} onChange={(event) => updatePlan('title', event.target.value)} />
              </PlanField>

              <PlanField label="Paciente">
                <select value={plan.patientId} disabled={readOnly} onChange={(event) => updatePlan('patientId', event.target.value)}>
                  <option value="">{loadingPatients ? 'Carregando pacientes...' : 'Selecione um paciente'}</option>
                  {patients.map((patient) => (
                    <option key={patient.uuid} value={patient.uuid}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </PlanField>

              <PlanField label="Principal objetivo">
                <select value={plan.clientGoal} disabled={readOnly} onChange={(event) => updatePlan('clientGoal', event.target.value)}>
                  {goalOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </PlanField>

              <PlanField label="Tipo de plano">
                <select value={plan.planType} disabled={readOnly} onChange={(event) => updatePlan('planType', event.target.value)}>
                  {planTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </PlanField>

              <PlanField label="Início">
                <input type="date" value={plan.startDate} disabled={readOnly} onChange={(event) => updatePlan('startDate', event.target.value)} />
              </PlanField>

              <PlanField label="Término">
                <input type="date" value={plan.endDate} disabled={readOnly} onChange={(event) => updatePlan('endDate', event.target.value)} />
              </PlanField>

              <PlanField label="Observações Gerais" className="is-full">
                <textarea value={plan.notes} disabled={readOnly} placeholder="Orientações nutricionais gerais, restrições, etc." onChange={(event) => updatePlan('notes', event.target.value)} />
              </PlanField>
            </div>
          </section>

          {!readOnly ? (
            <section className="plan-card ai-plan-card">
              <div className="ai-plan-head">
                <span aria-hidden="true"><SparkIcon /></span>
                <div>
                  <div className="ai-plan-title-row">
                    <h2>Copiloto de dieta</h2>
                    <small>Gemini</small>
                  </div>
                  <p>Rascunho editável para revisar antes de salvar.</p>
                  <div className="ai-plan-meta" aria-label="Contexto usado pela IA">
                    <span>calorias</span>
                    <span>gostos</span>
                    <span>limitações</span>
                    <span>dados físicos</span>
                  </div>
                </div>
              </div>
              <div className="ai-plan-grid">
                <PlanField label="Calorias alvo">
                  <input type="number" min="800" max="8000" value={aiForm.targetCalories} onChange={(event) => updateAi('targetCalories', event.target.value)} placeholder="Ex: 2200" />
                </PlanField>
                <PlanField label="Refeições por dia">
                  <input type="number" min="1" max="10" value={aiForm.mealsCount} onChange={(event) => updateAi('mealsCount', event.target.value)} />
                </PlanField>
                <PlanField label="Gostos e preferências" className="is-full">
                  <textarea value={aiForm.preferences} onChange={(event) => updateAi('preferences', event.target.value)} placeholder="Ex: gosta de arroz, frango, frutas; não gosta de peixe..." />
                </PlanField>
                <PlanField label="Limitações/restrições" className="is-full">
                  <textarea value={aiForm.limitations} onChange={(event) => updateAi('limitations', event.target.value)} placeholder="Ex: intolerância à lactose, rotina corrida, pouco tempo para cozinhar..." />
                </PlanField>
                {hasMealDraft ? (
                  <PlanField label="Pedir ajuste no rascunho" className="is-full">
                    <textarea value={aiForm.adjustmentRequest} onChange={(event) => updateAi('adjustmentRequest', event.target.value)} placeholder="Ex: reduzir carboidratos no jantar, trocar leite por opções sem lactose, aumentar proteína no café da manhã..." />
                  </PlanField>
                ) : null}
              </div>
              <div className="ai-plan-actions">
                <button type="button" className="ai-generate-button" onClick={generateWithAi} disabled={generatingAi}>
                  {generatingAi ? <AiLoadingIcon /> : <SparkIcon />}
                  {generatingAi ? 'Gerando' : 'Gerar rascunho'}
                </button>
                {hasMealDraft ? (
                  <>
                    <button type="button" className="ai-adjust-button" onClick={adjustAiDraft} disabled={generatingAi}>
                      {generatingAi ? <AiLoadingIcon /> : null}
                      {generatingAi ? 'Ajustando' : 'Ajustar rascunho'}
                    </button>
                    <button type="button" className="ai-clear-button" onClick={clearAiDraft} disabled={generatingAi}>
                      Limpar rascunho
                    </button>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="plan-meals-section">
            <div className="plan-section-head">
              <h2>Refeições</h2>
              {!readOnly ? (
                <button type="button" onClick={addMeal}>
                  <PlusIcon />
                  Adicionar Refeição
                </button>
              ) : null}
            </div>

            <div className="plan-meal-list">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onUpdate={(patch) => updateMeal(meal.id, patch)}
                  onRemove={() => requestRemoveMeal(meal.id)}
                  onAddFood={() => addFood(meal.id)}
                  onUpdateFood={(foodId, patch) => updateFood(meal.id, foodId, patch)}
                  onRemoveFood={(foodId) => requestRemoveFood(meal.id, foodId)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="plan-summary-card">
          <h2>Resumo do Plano</h2>

          <div className="plan-summary-lines">
            <SummaryLine label="Paciente" value={selectedPatient?.name || '-'} />
            <SummaryLine label="Objetivo" value={optionLabel(goalOptions, plan.clientGoal)} />
            <SummaryLine label="Tipo de plano" value={optionLabel(planTypeOptions, plan.planType)} />
            {loadedPlan?.nutritionist ? <ProfessionalSummaryLine label="Nutricionista" professional={loadedPlan.nutritionist} /> : null}
            <SummaryLine label="Refeições" value={meals.length} />
            <SummaryLine label="Total de Alimentos" value={totalFoods} />
            <SummaryLine label="Periodo" value={`${formatShortDate(plan.startDate)} - ${formatShortDate(plan.endDate)}`} />
          </div>

          <div className="plan-summary-meals">
            <h3>Refeições</h3>
            {meals.map((meal) => {
              const count = meal.foods.filter((food) => food.name.trim()).length
              return (
                <div key={meal.id}>
                  <span>{meal.name || 'Sem nome'}</span>
                  <strong className={count ? '' : 'is-empty'}>{count ? `${count} itens` : 'vazio'}</strong>
                </div>
              )
            })}
          </div>

          {!readOnly ? (
            <button type="button" className="plan-save-button" onClick={savePlan}>
              <SaveIcon />
              {uuid ? 'Salvar Alterações' : 'Salvar Plano'}
            </button>
          ) : null}
        </aside>
      </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete?.title}
        message={confirmDelete?.message}
        confirmLabel="Excluir"
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeletion}
      />
    </div>
  )
}

function MealCard({ meal, onUpdate, onRemove, onAddFood, onUpdateFood, onRemoveFood, readOnly = false }) {
  const foodCount = meal.foods.filter((food) => food.name.trim()).length

  return (
    <article className="plan-meal-card">
      <header className="plan-meal-header plan-meal-toggle-header" onClick={() => onUpdate({ expanded: !meal.expanded })}>
        <div className="plan-meal-title">
          <span aria-hidden="true"><UtensilsMiniIcon /></span>
          <div>
            <h3>{meal.name || 'Sem nome'}</h3>
            <p>{meal.time || '--:--'} <span>-</span> {foodCount} alimento(s)</p>
          </div>
        </div>

        <div className="plan-meal-actions">
          {!readOnly ? <button type="button" onClick={(event) => { event.stopPropagation(); onRemove() }} aria-label="Remover refeição"><TrashIcon /></button> : null}
          <span className="plan-chevron-indicator" aria-hidden="true">
            <ChevronIcon open={meal.expanded} />
          </span>
        </div>
      </header>

      <div className={`plan-meal-body ${meal.expanded ? 'is-open' : ''}`} aria-hidden={!meal.expanded}>
        <div className="plan-meal-body-inner">
          <div className="plan-meal-fields">
            <PlanField label="Nome da Refeição">
              <input value={meal.name} disabled={readOnly} onChange={(event) => onUpdate({ name: event.target.value })} />
            </PlanField>
            <PlanField label="Horário Sugerido">
              <input type="time" value={meal.time} disabled={readOnly} onChange={(event) => onUpdate({ time: event.target.value })} />
            </PlanField>
          </div>

          <div className="plan-food-block">
            <label>Alimentos</label>
            {meal.foods.map((food) => (
              <div className="plan-food-row" key={food.id}>
                <input value={food.name} disabled={readOnly} placeholder="Nome do alimento" onChange={(event) => onUpdateFood(food.id, { name: event.target.value })} />
                <input value={food.amount} disabled={readOnly} inputMode="decimal" placeholder="0" onChange={(event) => onUpdateFood(food.id, { amount: event.target.value.replace(/[^\d.,]/g, '') })} />
                <select value={food.unit} disabled={readOnly} onChange={(event) => onUpdateFood(food.id, { unit: event.target.value })}>
                  {unitOptions.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                {!readOnly ? <button type="button" onClick={() => onRemoveFood(food.id)} aria-label="Remover alimento"><TrashIcon /></button> : null}
              </div>
            ))}

            {!readOnly ? (
              <button type="button" className="plan-add-food" onClick={onAddFood}>
                <PlusIcon />
                Adicionar Alimento
              </button>
            ) : null}
          </div>

          <PlanField label="Instruções Específicas" className="is-full">
            <textarea value={meal.instructions} disabled={readOnly} placeholder="Ex: comer lentamente, evitar líquidos..." onChange={(event) => onUpdate({ instructions: event.target.value })} />
          </PlanField>
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

function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || '-'
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
    name: patient.name || 'Paciente sem nome',
    email: patient.email || '',
  }
}

function normalizeMeals(meals) {
  if (!meals.length) return defaultMeals

  return meals.map((meal, mealIndex) => ({
    id: meal.uuid || mealIndex + 1,
    name: meal.name || '',
    time: meal.time?.slice(0, 5) || '',
    expanded: true,
    instructions: meal.instructions || '',
    foods: (meal.foods || []).map((food, foodIndex) => ({
      id: food.uuid || `${meal.uuid || mealIndex}-${foodIndex}`,
      name: food.name || '',
      amount: food.amount || '',
      unit: food.unit || 'g',
    })),
  }))
}

function normalizeMealsForForm(meals) {
  if (!meals.length) return defaultMeals

  return sortMealsByTime(meals.map((meal, mealIndex) => ({
    id: Date.now() + mealIndex,
    name: meal.name || '',
    time: String(meal.time || '').slice(0, 5),
    expanded: mealIndex === 0,
    instructions: meal.instructions || '',
    foods: (meal.foods || []).map((food, foodIndex) => ({
      id: `${Date.now()}-${mealIndex}-${foodIndex}`,
      name: food.name || '',
      amount: food.amount || '',
      unit: normalizeFoodUnit(food.unit, food.name),
    })),
  })))
}

function sortMealsByTime(meals) {
  return [...meals].sort((a, b) => mealTimeValue(a.time) - mealTimeValue(b.time))
}

function mealTimeValue(time) {
  const [hours, minutes] = String(time || '').split(':').map(Number)
  if (!Number.isFinite(hours)) return 24 * 60

  return hours * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

function mealDraftPayload(plan, meals) {
  return {
    title: plan.title,
    general_notes: plan.notes,
    meals: meals.map((meal) => ({
      name: meal.name,
      time: meal.time,
      instructions: meal.instructions,
      foods: meal.foods.map((food) => ({
        name: food.name,
        amount: food.amount,
        unit: food.unit,
      })),
    })),
  }
}

function normalizeFoodUnit(unit, foodName = '') {
  const normalized = String(unit || '').trim().toLowerCase()
  const direct = {
    g: 'g',
    grama: 'g',
    gramas: 'g',
    ml: 'ml',
    mililitro: 'ml',
    mililitros: 'ml',
    un: 'un',
    unidade: 'un',
    unidades: 'un',
    colher: 'colheres',
    colheres: 'colheres',
    fatia: 'fatias',
    fatias: 'fatias',
  }

  if (direct[normalized]) return direct[normalized]

  const name = String(foodName || '').toLowerCase()
  if (/(agua|água|suco|leite|vitamina|shake|cha|chá|cafe|café)/.test(name)) return 'ml'
  if (/(banana|maca|maçã|ovo|laranja|pera|iogurte)/.test(name)) return 'un'
  if (/(pao|pão|queijo|peito de peru|torrada)/.test(name)) return 'fatias'
  if (/(azeite|mel|pasta|requeijao|requeijão|chia|linhaça)/.test(name)) return 'colheres'

  return 'g'
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

function UtensilsMiniIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4v7M10 4v7M7 8h3M8.5 11v9M16.5 4v16M14 4c0 4.8.8 7 2.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function SparkIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
