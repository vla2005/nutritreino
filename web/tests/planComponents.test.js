import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let server
let MealCard
let WorkoutDayCard
let ProgressPhotos
before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
  MealCard = (await server.ssrLoadModule('/src/pages/nutrition/NutritionPlanPage/components/MealCard.jsx')).default
  WorkoutDayCard = (await server.ssrLoadModule('/src/pages/workouts/WorkoutPlanPage/components/WorkoutDayCard.jsx')).default
  ProgressPhotos = (await server.ssrLoadModule('/src/pages/progress/ClientProgressPage/components/ProgressPhotos.jsx')).default
})
after(async () => { await server?.close() })

const meal = { id: 1, name: 'Café da manhã', time: '08:00', expanded: true, instructions: 'Sem lactose', foods: [{ id: 1, name: 'Pão integral', amount: '2.00', unit: 'fatias' }] }
const day = { id: 1, name: 'Treino A', weekDays: 'Segunda', expanded: true, exercises: [{ id: 1, name: 'Agachamento', sets: '3', reps: '12', rest: '0', note: 'Carga leve' }] }
const noop = () => {}
const render = (Component, props) => renderToStaticMarkup(createElement(Component, { onUpdate: noop, ...props }))

test('client meal reading shows real portions and instructions, not disabled form fields', () => {
  const html = render(MealCard, { meal, readOnly: true })
  assert.match(html, /Pão integral/)
  assert.match(html, /2 fatias/)
  assert.match(html, /Sem lactose/)
  assert.doesNotMatch(html, /<(input|select|textarea)\b/)
  assert.doesNotMatch(html, /Remover refeição|Adicionar Alimento/)
  assert.match(html, /aria-expanded="true"/)
  assert.match(html, /aria-controls=/)
})

test('professional meal keeps editable values and remove actions', () => {
  const html = render(MealCard, { meal, readOnly: false, onRemove: noop })
  assert.match(html, /value="Pão integral"/)
  assert.match(html, /value="2.00"/)
  assert.match(html, /Remover refeição/)
  assert.match(html, /Adicionar Alimento/)
})

test('closed meal has hidden region and retains draft values', () => {
  const html = render(MealCard, { meal: { ...meal, expanded: false }, readOnly: false })
  assert.match(html, /aria-expanded="false"/)
  assert.match(html, /role="region"[^>]*hidden=""/)
  assert.match(html, /value="Pão integral"/)
})

test('client exercise reading preserves order, sets, reps, zero rest and instructions', () => {
  const html = render(WorkoutDayCard, { day, readOnly: true })
  assert.match(html, /<ol/)
  assert.match(html, /Agachamento/)
  assert.match(html, /<dt>Séries<\/dt><dd>3<\/dd>/)
  assert.match(html, /<dt>Repetições<\/dt><dd>12<\/dd>/)
  assert.match(html, /<dt>Descanso<\/dt><dd>0 s<\/dd>/)
  assert.match(html, /Carga leve/)
  assert.doesNotMatch(html, /<(input|select|textarea)\b/)
  assert.doesNotMatch(html, /Remover dia de treino|Adicionar Exercício/)
})

test('professional exercise keeps all edit fields', () => {
  const html = render(WorkoutDayCard, { day, readOnly: false, onRemove: noop })
  assert.match(html, /value="Agachamento"/)
  assert.match(html, /value="3"/)
  assert.match(html, /value="12"/)
  assert.match(html, /Remover dia de treino/)
})

test('closed workout hides its region while preserving the exercises', () => {
  const html = render(WorkoutDayCard, { day: { ...day, expanded: false }, readOnly: true })
  assert.match(html, /role="region"[^>]*hidden=""/)
  assert.match(html, /Agachamento/)
})

test('empty read-only sections have explicit empty states', () => {
  assert.match(render(MealCard, { meal: { ...meal, foods: [] }, readOnly: true }), /Nenhum alimento informado/)
  assert.match(render(WorkoutDayCard, { day: { ...day, exercises: [] }, readOnly: true }), /Nenhum exercício informado/)
})

test('progress photo dates keep the measurement calendar day', () => {
  const html = render(ProgressPhotos, { photos: [{ type: 'front', record_date: '2026-10-20', url: '/test-front.jpg' }], items: [{ key: 'front', label: 'Frente' }], onOpen: noop })
  assert.match(html, /20\/10\/2026/)
  assert.doesNotMatch(html, /19\/10\/2026/)
})

test('missing progress photos never display a fabricated date', () => {
  const html = render(ProgressPhotos, { photos: [], items: [{ key: 'front', label: 'Frente' }], onOpen: noop })
  assert.doesNotMatch(html, /\d{2}\/\d{2}\/\d{4}/)
})
