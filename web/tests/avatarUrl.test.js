import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveAvatarUrl, versionAvatarUrl, retryAvatarUrl } from '../src/utils/avatarUrl.js'

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

test('local avatar gets a stable cache version, without changing its filename', () => {
  const src = versionAvatarUrl(resolveAvatarUrl('/storage/avatars/a.png', origin), origin)
  assert.equal(src, `${origin}/storage/avatars/a.png?nt_avatar_v=2`)
  assert.equal(versionAvatarUrl(src, origin), src)
})

test('same-host avatars use HTTPS behind the reverse proxy', () => {
  assert.equal(versionAvatarUrl('http://api.example.test/storage/avatars/a.png', origin), `${origin}/storage/avatars/a.png?nt_avatar_v=2`)
})

test('existing query parameters and fragments are preserved', () => {
  assert.equal(versionAvatarUrl(`${origin}/storage/avatars/a.png?size=360#photo`, origin), `${origin}/storage/avatars/a.png?size=360&nt_avatar_v=2#photo`)
})

test('external and signed URLs, previews and progress photos are not modified', () => {
  for (const src of [
    'https://cdn.example.test/storage/avatars/a.png?signature=123',
    `${origin}/storage/avatars/a.png?signature=123`,
    `${origin}/storage/avatars/a.png?X-Amz-Signature=123`,
    `${origin}/storage/progress/a.png`,
    'blob:https://api.example.test/123',
    'data:image/png;base64,abc', '',
  ]) assert.equal(versionAvatarUrl(src, origin), src)
})

test('recovery bypasses cached failure only for our own versioned avatar', () => {
  const src = versionAvatarUrl(`${origin}/storage/avatars/a.png`, origin)
  assert.equal(retryAvatarUrl(src, 123), `${origin}/storage/avatars/a.png?nt_avatar_v=2&nt_avatar_retry=123`)
  for (const other of ['blob:https://api.example.test/123', 'https://cdn.example.test/a.png?signature=123', '']) {
    assert.equal(retryAvatarUrl(other, 123), '')
  }
})
