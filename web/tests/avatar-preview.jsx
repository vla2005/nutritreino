import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import AvatarImage from '../src/shared/components/ui/AvatarImage/AvatarImage.jsx'
import { versionAvatarUrl } from '../src/utils/avatarUrl.js'

function TestAvatar(props) {
  const [size, setSize] = useState(null)
  return <><AvatarImage {...props} onLoad={(event) => setSize(`${event.currentTarget.naturalWidth}×${event.currentTarget.naturalHeight}`)} />{size ? <p style={{ color: '#226d50' }}>Imagem carregada ({size})</p> : null}</>
}

// Local-only regression fixture. It never logs in, uploads or changes application data.
function AvatarRegression() {
  const [updated, setUpdated] = useState(false)
  const [restored, setRestored] = useState(false)
  const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
  const publicUrl = new URL(new URLSearchParams(window.location.search).get('avatar') || '/__avatar-regression/recovered.png', window.location.origin)
  const remote = versionAvatarUrl(publicUrl.href, publicUrl.origin)
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>Regressão de avatares</h1>
      <section><h2>Foto pública — cache versionado</h2><TestAvatar src={remote} alt="Avatar público" width="120" height="120" fallback={<span>FALHOU FOTO PÚBLICA</span>} /></section>
      <section><h2>Preview de upload</h2><TestAvatar src={pixel} alt="Preview local" width="40" height="40" fallback={<span>FALHOU PREVIEW</span>} /></section>
      <section><h2>Sem foto</h2><AvatarImage src="" fallback={<span>SEM FOTO: VL</span>} /></section>
      <section><h2>Arquivo inexistente — uma recuperação e iniciais</h2><AvatarImage src={`${window.location.origin}/storage/avatars/missing-regression.png?nt_avatar_v=2`} fallback={<span>INEXISTENTE: VL</span>} /></section>
      <section><h2>Troca de avatar após falha</h2><TestAvatar src={updated ? pixel : '/missing-avatar-regression.png'} alt="Foto atualizada" width="40" height="40" fallback={<span>ANTIGA FALHOU: VL</span>} /><button onClick={() => setUpdated(true)}>Trocar foto após falha</button></section>
      <section><h2>Resposta com falha transitória — recuperar sem loop</h2><TestAvatar src={`${window.location.origin}/__avatar-regression/${restored ? 'recovered' : 'retry'}.png?nt_avatar_v=2`} alt={restored ? 'Restaurada' : 'Recuperada automaticamente'} width="40" height="40" fallback={<span>FALHOU RECUPERAÇÃO</span>} /><button onClick={() => setRestored(true)}>Restaurar origem</button></section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<AvatarRegression />)
