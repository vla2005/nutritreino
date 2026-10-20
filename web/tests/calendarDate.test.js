import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatCalendarDate, localDateInput, parseCalendarDate, relativeCalendarDate } from '../src/shared/utils/calendarDate.js'

for (const timezone of ['America/Sao_Paulo', 'America/Los_Angeles', 'UTC', 'Asia/Tokyo']) {
  test(`calendar day stays October 20 in ${timezone}`, () => {
    const original = process.env.TZ
    process.env.TZ = timezone
    try {
      assert.equal(formatCalendarDate('2026-10-20'), '20/10/2026')
      assert.equal(formatCalendarDate('2026-01-01'), '01/01/2026')
      assert.equal(formatCalendarDate('2024-02-29'), '29/02/2024')
      assert.equal(relativeCalendarDate('2026-10-20', new Date(2026, 9, 20, 23, 59)), 'Hoje')
      assert.equal(relativeCalendarDate('2026-10-19', new Date(2026, 9, 20)), '19/10/2026')
      assert.equal(localDateInput(new Date(2026, 9, 20, 23, 59)), '2026-10-20')
    } finally {
      if (original === undefined) delete process.env.TZ
      else process.env.TZ = original
    }
  })
}

test('real timestamps retain local timezone conversion', () => {
  assert.equal(formatCalendarDate('2026-10-20T00:30:00Z'), new Date('2026-10-20T00:30:00Z').toLocaleDateString('pt-BR'))
})

test('invalid or missing dates do not throw or roll over to another day', () => {
  for (const value of [null, undefined, '', 'bad date', '2026-02-30', '2026-13-01', new Date('bad')]) {
    assert.equal(parseCalendarDate(value), null)
    assert.equal(formatCalendarDate(value), '-')
  }
})
