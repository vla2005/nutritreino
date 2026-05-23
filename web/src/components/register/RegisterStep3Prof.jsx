import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../ui/Button.jsx'

const outputSize = 360

export default function RegisterStep3Prof({ form, errors = {}, loading, onChange, onBack, onSubmit }) {
  const fileInputRef = useRef(null)
  const [cropSource, setCropSource] = useState('')

  useEffect(() => () => {
    if (cropSource) URL.revokeObjectURL(cropSource)
  }, [cropSource])

  function handleFileSelect(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(URL.createObjectURL(file))
  }

  function handleAvatarReady({ file, preview }) {
    onChange({ avatar: preview, avatar_file: file })
    setCropSource((current) => {
      if (current) URL.revokeObjectURL(current)
      return ''
    })
  }

  function clearAvatar() {
    onChange({ avatar: '', avatar_file: null })
  }

  return (
    <div>
      <h2 className="register-step-title">Personalize seu perfil</h2>
      <p className="register-step-copy">Envie uma foto profissional e escreva uma bio curta.</p>

      <div className="register-field-stack">
        <div>
          <label className="form-label">Avatar</label>
          <div className="register-avatar-upload">
            <button type="button" className="register-avatar-preview" onClick={() => fileInputRef.current?.click()} aria-label="Selecionar avatar">
              {form.avatar ? <img src={form.avatar} alt="" /> : <CameraIcon />}
            </button>
            <div>
              <strong>{form.avatar ? 'Avatar selecionado' : 'Adicione sua foto'}</strong>
              <p>A imagem sera recortada em formato circular para aparecer nas tabelas e perfis.</p>
              <div className="register-avatar-actions">
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                  {form.avatar ? 'Trocar imagem' : 'Escolher imagem'}
                </button>
                {form.avatar ? <button type="button" onClick={clearAvatar}>Remover</button> : null}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
          </div>
          {errors.avatar_file || errors.avatar ? <p className="field-error">{errors.avatar_file || errors.avatar}</p> : null}
        </div>

        <div>
          <label className="form-label">Bio</label>
          <textarea
            value={form.bio}
            className={`input-field min-h-[120px] resize-y rounded-lg px-4 py-3 text-sm ${errors.bio ? 'is-invalid' : ''}`}
            rows="5"
            placeholder="Conte um pouco sobre sua experiencia, abordagem e objetivos profissionais."
            onChange={(event) => onChange({ bio: event.target.value })}
          />
          {errors.bio ? <p className="field-error">{errors.bio}</p> : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <button type="button" className="register-back-button" onClick={onBack} aria-label="Voltar">
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </button>
        <Button placeholder="Criar conta" loading={loading} className="register-action-button" onClick={onSubmit}>
          <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </Button>
      </div>

      {cropSource ? (
        <AvatarCropDialog
          source={cropSource}
          onClose={() => setCropSource((current) => {
            if (current) URL.revokeObjectURL(current)
            return ''
          })}
          onPickFile={() => fileInputRef.current?.click()}
          onConfirm={handleAvatarReady}
        />
      ) : null}
    </div>
  )
}

function AvatarCropDialog({ source, onClose, onPickFile, onConfirm }) {
  const imageRef = useRef(null)
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const cropSize = useMemo(() => {
    if (typeof window === 'undefined') return 320
    return Math.min(320, Math.max(240, window.innerWidth - 72))
  }, [])

  const metrics = useMemo(() => {
    const image = imageRef.current
    if (!image || !loaded) return null
    const baseScale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight)
    return {
      width: image.naturalWidth * baseScale * zoom,
      height: image.naturalHeight * baseScale * zoom,
    }
  }, [cropSize, loaded, zoom])

  useEffect(() => {
    function stopDrag() {
      dragRef.current = null
    }

    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)
    return () => {
      window.removeEventListener('pointerup', stopDrag)
      window.removeEventListener('pointercancel', stopDrag)
    }
  }, [])

  function handlePointerDown(event) {
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offset,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return
    const next = {
      x: dragRef.current.offset.x + event.clientX - dragRef.current.x,
      y: dragRef.current.offset.y + event.clientY - dragRef.current.y,
    }
    setOffset(clampOffset(next, metrics, cropSize))
  }

  function handleZoomChange(nextZoom) {
    const next = Math.min(3, Math.max(1, nextZoom))
    setZoom(next)
    window.requestAnimationFrame(() => setOffset((current) => clampOffset(current, metrics, cropSize)))
  }

  function confirmCrop() {
    const image = imageRef.current
    if (!image || !metrics) return

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')
    const ratio = outputSize / cropSize
    const drawWidth = metrics.width * ratio
    const drawHeight = metrics.height * ratio
    const drawX = (outputSize - drawWidth) / 2 + offset.x * ratio
    const drawY = (outputSize - drawHeight) / 2 + offset.y * ratio

    context.clearRect(0, 0, outputSize, outputSize)
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'avatar.png', { type: 'image/png' })
      onConfirm({ file, preview: URL.createObjectURL(blob) })
    }, 'image/png', 0.92)
  }

  return (
    <div className="avatar-cropper-overlay" role="dialog" aria-modal="true" aria-label="Recortar avatar">
      <div className="avatar-cropper-shell">
        <div className="avatar-cropper-topbar">
          <button type="button" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
          <strong>Arraste a imagem para ajustar.</strong>
          <button type="button" onClick={onPickFile}>
            <RotateIcon /> Carregar
          </button>
        </div>

        <div
          ref={stageRef}
          className="avatar-cropper-stage"
          style={{ '--crop-size': `${cropSize}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <img
            ref={imageRef}
            src={source}
            alt=""
            draggable="false"
            className="avatar-cropper-image"
            style={metrics ? {
              width: `${metrics.width}px`,
              height: `${metrics.height}px`,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            } : undefined}
            onLoad={() => {
              setLoaded(true)
              setOffset({ x: 0, y: 0 })
            }}
          />
          <div className="avatar-cropper-shade" aria-hidden="true" />
          <div className="avatar-cropper-circle" style={{ width: cropSize, height: cropSize }} aria-hidden="true" />
        </div>

        <div className="avatar-cropper-controls">
          <button type="button" onClick={() => handleZoomChange(zoom - 0.1)} aria-label="Diminuir zoom">-</button>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => handleZoomChange(Number(event.target.value))} aria-label="Zoom do avatar" />
          <button type="button" onClick={() => handleZoomChange(zoom + 0.1)} aria-label="Aumentar zoom">+</button>
        </div>

        <button type="button" className="avatar-cropper-confirm" onClick={confirmCrop} aria-label="Confirmar avatar">
          <CheckIcon />
        </button>
      </div>
    </div>
  )
}

function clampOffset(next, metrics, cropSize) {
  if (!metrics) return next

  const maxX = Math.max(0, (metrics.width - cropSize) / 2)
  const maxY = Math.max(0, (metrics.height - cropSize) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, next.x)),
    y: Math.min(maxY, Math.max(-maxY, next.y)),
  }
}

function CameraIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4V8ZM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function RotateIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7h6a5 5 0 1 1-4.1 7.9M7 7V3M7 7H3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
