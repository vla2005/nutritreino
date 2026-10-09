import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveAvatarUrl } from '../src/utils/avatarUrl.js'

const origin = 'https://api.example.test'
const cases = [
  [null, ''], [undefined, ''], [42, ''], ['  ', ''],
  ['/storage/avatars/a.png', `${origin}/storage/avatars/a.png`],
  ['storage/avatars/a.png', `${origin}/storage/avatars/a.png`],
  ['avatars/a.png', `${origin}/storage/avatars/a.png`],
  ['https://uploads.example.test/storage/avatars/a.png?signature=123', 'https://uploads.example.test/storage/avatars/a.png?signature=123'],
  ['http://localhost:8080/storage/avatars/a.png', 'http://localhost:8080/storage/avatars/a.png'],
  [' https:\\/\\/uploads.example.test\\/storage\\/avatars\\/a.png ', 'https://uploads.example.test/storage/avatars/a.png'],
  ['blob:https://example.test/123', 'blob:https://example.test/123'],
  ['data:image/png;base64,abc', 'data:image/png;base64,abc'],
  ['//uploads.example.test/a.png', '//uploads.example.test/a.png'],
  ['javascript:alert(1)', ''],
]

for (const [value, expected] of cases) {
  test(`resolve avatar: ${String(value)}`, () => {
    assert.equal(resolveAvatarUrl(value, `${origin}/`), expected)
  })
}
