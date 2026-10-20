import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatPortion } from '../src/features/plans/utils/planPresentation.js'

for (const [amount, unit, expected] of [
  ['2.00', 'fatias', '2 fatias'], ['1.00', 'fatias', '1 fatia'],
  ['120.50', 'g', '120,5 g'], ['200.00', 'ml', '200 ml'],
  ['1', 'un', '1 unidade'], ['2', 'un', '2 unidades'],
  ['1', 'colheres', '1 colher'], ['2', 'colheres', '2 colheres'],
  ['0,5', 'g', '0,5 g'], ['0', 'g', '0 g'], ['', 'g', '— g'],
]) {
  test(`readable portion ${amount} ${unit}`, () => assert.equal(formatPortion(amount, unit), expected))
}
