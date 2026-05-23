import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../composables/useAuth.js'
import { useToast } from '../../composables/useToast.jsx'
import { createProgressRecord, getProgress, getProgressAccess, grantProgressAccess, revokeProgressAccess, saveProgressFeedback } from '../../services/progress.js'

const measurementItems = [
  { key: 'waist', label: 'Cintura', icon: '📏' },
  { key: 'hip', label: 'Quadril', icon: '🩳' },
  { key: 'chest', label: 'Peito', icon: '👕' },
  { key: 'arm', label: 'Braço', icon: '💪' },
  { key: 'thigh', label: 'Coxa', icon: '🦵' },
]

const checkItems = [
  { key: 'sleep', label: 'Sono', icon: <MoonIcon /> },
  { key: 'hunger', label: 'Fome', icon: <FoodIcon /> },
  { key: 'energy', label: 'Energia', icon: <BoltIcon /> },
  { key: 'diet_adherence', label: 'Aderência à dieta', icon: <AppleSmallIcon /> },
  { key: 'training_adherence', label: 'Aderência ao treino', icon: <DumbbellIcon /> },
]

const photoItems = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lateral' },
  { key: 'back', label: 'Costas' },
]

export default function ClientProgress() {
  const toast = useToast()
  const { role } = useAuth()
  const location = useLocation()
  const clientUuid = new URLSearchParams(location.search).get('client_uuid') || location.state?.client?.uuid || ''
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progressError, setProgressError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [historyDialog, setHistoryDialog] = useState(null)
  const [photoDialog, setPhotoDialog] = useState(null)
  const [imageDialog, setImageDialog] = useState(null)
  const [recordDialog, setRecordDialog] = useState(null)

  async function loadProgress() {
    try {
      setLoading(true)
      setProgressError('')
      setProgress(await getProgress({ clientUuid }))
    } catch (error) {
      setProgressError(error.message)
      toast.warning(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProgress()
  }, [clientUuid])

  if (loading) {
    return (
      <div className="progress-page">
        <ProgressHeader role={role} progress={progress} onNew={() => setModalOpen(true)} onManageAccess={() => setAccessModalOpen(true)} />
        <div className="progress-loading"><span /><span /><span /></div>
      </div>
    )
  }

  const allRecords = progress?.records || progress?.recent_records || []

  return (
    <div className="progress-page">
      <ProgressHeader role={role} progress={progress} onNew={() => setModalOpen(true)} onManageAccess={() => setAccessModalOpen(true)} />

      {progressError ? (
        <section className="progress-card progress-access-denied">
          <span><LockIcon /></span>
          <div>
            <h2>Acesso restrito</h2>
            <p>{progressError}</p>
          </div>
        </section>
      ) : null}

      {!progressError ? (
      <>

      <section className="progress-summary-grid">
        <SummaryCard tone="green" icon={<ScaleIcon />} label="Peso atual" value={`${formatNumber(progress?.summary?.current_weight)} kg`} detail="Atualizado hoje" />
        <SummaryCard tone="green" icon={<TrendIcon />} label="Variação no mês" value={`${signedNumber(progress?.summary?.month_variation)} kg`} detail={`${signedNumber(progress?.summary?.month_variation_percent)}% desde 18/05`} />
        <SummaryCard tone="orange" icon={<TargetIcon />} label="Meta" value={progress?.summary?.target_weight ? `${formatNumber(progress.summary.target_weight)} kg` : '-'} detail={progress?.summary?.target_remaining ? `Faltam ${formatNumber(progress.summary.target_remaining)} kg` : 'Defina no próximo registro'} />
        <SummaryCard tone="purple" icon={<CalendarIcon />} label="Último check-in" value={progress?.summary?.last_check_in_date ? relativeDate(progress.summary.last_check_in_date) : '-'} detail={formatDate(progress?.summary?.last_check_in_date)} />
      </section>

      <section className="progress-top-grid">
        <article className="progress-card progress-chart-card">
          <div className="progress-card-head">
            <h2>Evolução do peso</h2>
          </div>
          <WeightChart points={progress?.weight_history || []} />
        </article>

        <article className="progress-card">
          <div className="progress-card-head">
            <h2>Medidas corporais</h2>
            <button type="button" onClick={() => setHistoryDialog('measurements')}>Ver histórico</button>
          </div>
          <div className="progress-measure-list">
            {(progress?.measurements || measurementItems.map((item) => ({ type: item.key }))).map((item) => (
              <MeasurementRow key={item.type} item={item} />
            ))}
          </div>
        </article>
      </section>

      <section className="progress-middle-grid">
        <article className="progress-card progress-photos-section">
          <button type="button" className="progress-card-title-button" onClick={() => setPhotoDialog({ mode: 'gallery', category: 'front' })}>
            <h2>Fotos de progresso</h2>
            <span>Abrir galeria <ChevronRightIcon /></span>
          </button>
          <PhotoGrid photos={progress?.latest_photos || []} onOpen={(category) => setPhotoDialog({ mode: 'gallery', category })} />
        </article>

        <article className="progress-card">
          <div className="progress-card-head">
            <h2>Check-in semanal</h2>
            <button type="button" onClick={() => setHistoryDialog('checkins')}>Ver histórico</button>
          </div>
          <CheckInRows values={progress?.latest_check_in || {}} />
        </article>
      </section>

      <section className="progress-bottom-grid">
        <article className="progress-card progress-records-card">
          <h2>Registros recentes</h2>
          <RecentRecords records={progress?.recent_records || []} onOpen={setRecordDialog} onShowAll={() => setHistoryDialog('records')} />
        </article>

        <article className="progress-card progress-feedback-card">
          <h2>Feedback do profissional</h2>
          <FeedbackCard feedback={progress?.feedback} feedbacks={progress?.feedbacks || []} />
        </article>
      </section>

      {modalOpen && role === 'client' ? (
        <ProgressModal
          clientUuid={clientUuid}
          progress={progress}
          onClose={() => setModalOpen(false)}
          onSaved={async () => {
            setModalOpen(false)
            await loadProgress()
            toast.success('Registro salvo com sucesso.')
          }}
        />
      ) : null}
      {historyDialog ? <HistoryDialog type={historyDialog} records={allRecords} onOpenRecord={(record) => { setHistoryDialog(null); setRecordDialog(record) }} onClose={() => setHistoryDialog(null)} /> : null}
      {photoDialog ? <PhotoDialog photo={photoDialog} role={role} records={allRecords} clientName={progress?.client?.name} onImageOpen={setImageDialog} onAdd={() => { setPhotoDialog(null); setModalOpen(true) }} onClose={() => setPhotoDialog(null)} /> : null}
      {imageDialog ? <ImageViewer photo={imageDialog} onClose={() => setImageDialog(null)} /> : null}
      {recordDialog ? <RecordDialog record={recordDialog} role={role} onSaved={async () => { setRecordDialog(null); await loadProgress(); toast.success('Feedback salvo com sucesso.') }} onClose={() => setRecordDialog(null)} /> : null}
      </>
      ) : null}
      {accessModalOpen && role === 'client' ? <ProgressAccessDialog onClose={() => setAccessModalOpen(false)} /> : null}
    </div>
  )
}

function ProgressHeader({ role, progress, onNew, onManageAccess }) {
  const { fullName } = useAuth()
  const clientName = progress?.client?.name
  const title = role === 'professional'
    ? `Progresso de ${clientName || 'cliente'}`
    : `Olá, ${firstNameFrom(fullName || clientName || 'Cliente')}! 👋`

  return (
    <header className="progress-header">
      <span className="progress-title-icon" aria-hidden="true"><ProgressIcon /></span>
      <div>
        <h1>{title}</h1>
        <p>Acompanhe peso, medidas, fotos e check-ins</p>
      </div>
      <div className="progress-header-actions">
        {role === 'client' ? <button type="button" className="progress-access-button" onClick={onManageAccess}><LockIcon /> Gerenciar acesso</button> : null}
        {role === 'client' ? <button type="button" className="progress-new-button" onClick={onNew}><PlusIcon /> Novo registro</button> : null}
      </div>
    </header>
  )
}

function ProgressAccessDialog({ onClose }) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [access, setAccess] = useState({ granted: [], available: [] })
  const [selectedUuid, setSelectedUuid] = useState('')

  async function loadAccess() {
    try {
      setLoading(true)
      const data = await getProgressAccess()
      setAccess(data || { granted: [], available: [] })
      setSelectedUuid(data?.available?.[0]?.uuid || '')
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccess()
  }, [])

  async function handleGrant() {
    if (!selectedUuid) return

    try {
      setSaving(true)
      await grantProgressAccess(selectedUuid)
      await loadAccess()
      toast.success('Acesso liberado com sucesso.')
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRevoke(professionalUuid) {
    try {
      setSaving(true)
      await revokeProgressAccess(professionalUuid)
      await loadAccess()
      toast.success('Acesso removido com sucesso.')
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="progress-dialog-overlay" role="dialog" aria-modal="true">
      <div className="progress-dialog progress-access-dialog">
        <button type="button" className="progress-dialog-close" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        <h2>Gerenciar acesso ao progresso</h2>
        <p>Somente você acessa seus dados de progresso. Libere acesso apenas para profissionais que podem acompanhar seus registros.</p>

        {loading ? <div className="progress-loading"><span /><span /><span /></div> : (
          <>
            <section>
              <h3>Profissionais com acesso</h3>
              <div className="progress-access-list">
                {access.granted?.length ? access.granted.map((item) => (
                  <div key={item.professional.uuid} className="progress-access-row">
                    <AvatarImage person={item.professional} />
                    <div>
                      <strong>{item.professional.name}</strong>
                      <span>{professionalLabel(item.professional.speciality)} liberado em {formatDate(item.granted_at)}</span>
                    </div>
                    <button type="button" onClick={() => handleRevoke(item.professional.uuid)} disabled={saving}>Remover</button>
                  </div>
                )) : <div className="progress-empty">Nenhum profissional tem acesso ao seu progresso.</div>}
              </div>
            </section>

            <section>
              <h3>Liberar novo profissional</h3>
              <div className="progress-access-grant">
                <select value={selectedUuid} onChange={(event) => setSelectedUuid(event.target.value)} disabled={!access.available?.length || saving}>
                  {access.available?.length
                    ? access.available.map((professional) => <option key={professional.uuid} value={professional.uuid}>{professional.name} - {professionalLabel(professional.speciality)}</option>)
                    : <option value="">Nenhum profissional disponível</option>}
                </select>
                <button type="button" onClick={handleGrant} disabled={!selectedUuid || saving}>Permitir acesso</button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function AvatarImage({ person }) {
  return person?.avatar
    ? <img className="progress-access-avatar" src={person.avatar} alt="" />
    : <span className="progress-access-avatar">{initials(person?.name || 'PR')}</span>
}

function SummaryCard({ tone, icon, label, value, detail }) {
  return (
    <article className="progress-summary-card">
      <span className={`is-${tone}`} aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}

function WeightChart({ points }) {
  const values = points.length ? points : mockHistory()
  const weights = values.map((item) => Number(item.weight || 0))
  const min = Math.min(...weights, 74)
  const max = Math.max(...weights, 82)
  const width = 720
  const height = 220
  const plot = values.map((item, index) => {
    const x = 38 + (index / Math.max(1, values.length - 1)) * (width - 76)
    const y = 28 + ((max - Number(item.weight)) / Math.max(1, max - min)) * (height - 58)
    return { x, y, item }
  })
  const d = plot.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const last = plot.at(-1)

  return (
    <div className="progress-chart">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {[82, 80, 78, 76, 74].map((line, index) => <g key={line}><line x1="30" y1={32 + index * 36} x2="690" y2={32 + index * 36} /><text x="2" y={37 + index * 36}>{line}</text></g>)}
        <path d={d} />
        {plot.map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" />)}
        {last ? <circle className="is-last" cx={last.x} cy={last.y} r="7" /> : null}
      </svg>
      {last ? <div className="progress-chart-tooltip" style={{ left: `${(last.x / width) * 100}%`, top: `${(last.y / height) * 100}%` }}>{formatDate(last.item.date)}<strong>{formatNumber(last.item.weight)} kg</strong></div> : null}
      <div className="progress-chart-dates"><span>18/05</span><span>25/05</span><span>01/06</span><span>08/06</span><span>15/06</span><span>18/06</span></div>
    </div>
  )
}

function MeasurementRow({ item }) {
  const meta = measurementItems.find((entry) => entry.key === item.type) || measurementItems[0]
  return (
    <div className="progress-measure-row">
      <span aria-hidden="true">{meta.icon}</span>
      <strong>{meta.label}</strong>
      <b>{item.value ? `${formatNumber(item.value)} cm` : '-'}</b>
      <small className={Number(item.delta || 0) > 0 ? 'is-up' : 'is-down'}>{item.delta === null || item.delta === undefined ? '- 0 cm' : `${Number(item.delta) > 0 ? '+' : ''}${formatNumber(item.delta)} cm`}</small>
    </div>
  )
}

function PhotoGrid({ photos, onOpen }) {
  const byType = Object.fromEntries(photos.map((photo) => [photo.type, photo]))
  return (
    <div className="progress-photo-grid">
      {photoItems.map((item) => (
        <button type="button" className="progress-photo-card" key={item.key} onClick={() => onOpen(item.key)}>
          {byType[item.key]?.url ? <img src={byType[item.key].url} alt="" /> : <div className="progress-photo-placeholder"><PhotoIcon /></div>}
          <span>{formatDate(byType[item.key]?.record_date || new Date())}</span>
          <strong>{item.label}</strong>
        </button>
      ))}
    </div>
  )
}

function CheckInRows({ values }) {
  return (
    <div className="progress-check-list">
      {checkItems.map((item) => (
        <div className="progress-check-row" key={item.key}>
          <span aria-hidden="true">{item.icon}</span>
          <strong>{item.label}</strong>
          <RatingDots value={values?.[item.key] || 0} />
        </div>
      ))}
    </div>
  )
}

function RatingDots({ value }) {
  return <span className="progress-rating-dots">{[1, 2, 3, 4, 5].map((item) => <i key={item} className={item <= Number(value || 0) ? 'is-on' : ''} />)}</span>
}

function RecentRecords({ records, onOpen, onShowAll }) {
  if (!records.length) return <div className="progress-empty">Nenhum registro encontrado.</div>

  return (
    <div className="progress-record-table">
      <div><span>Data</span><span>Peso</span><span>Medidas</span><span>Fotos</span><span>Check-in</span><span>Observações</span></div>
      {records.map((record) => (
        <button type="button" key={record.uuid} className="progress-record-row" onClick={() => onOpen(record)}>
          <span>{formatDate(record.record_date)}</span>
          <span>{formatNumber(record.weight)} kg</span>
          <span>{Object.keys(record.measurements || {}).length} medidas</span>
          <span>{record.photos?.length || 0} fotos</span>
          <span><RatingDots value={averageCheck(record.check_in)} /></span>
          <span>{record.notes || 'Sem observações'}</span>
        </button>
      ))}
      <button type="button" className="progress-record-more" onClick={onShowAll}>Ver todos os registros <ChevronDownIcon /></button>
    </div>
  )
}

function FeedbackCard({ feedback, feedbacks = [] }) {
  const items = feedbacks.length ? feedbacks : (feedback ? [feedback] : [])
  if (!items.length) return <p className="progress-feedback-empty">Nenhum feedback registrado ainda.</p>

  return (
    <div className="progress-feedback-list">
      {items.slice(0, 3).map((item, index) => (
        <div className="progress-feedback-item" key={item.uuid || `${item.record_uuid || 'legacy'}-${index}`}>
          <div className="progress-feedback-author">
            <span>{initials(item.professional?.name || 'Profissional')}</span>
            <div>
              <strong>{item.professional?.name || 'Profissional'}</strong>
              <small>{formatDate(item.record_date || item.date)} {item.professional?.speciality ? `- ${professionalLabel(item.professional.speciality)}` : ''}</small>
            </div>
          </div>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  )
}

function ProgressModal({ clientUuid, progress, onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const latestMeasurements = Object.fromEntries((progress?.measurements || []).map((item) => [item.type, item.value || '']))
  const [form, setForm] = useState({
    record_date: new Date().toISOString().slice(0, 10),
    weight: progress?.summary?.current_weight || '',
    target_weight: progress?.summary?.target_weight || '',
    notes: '',
    measurements: latestMeasurements,
    check_in: { sleep: 4, hunger: 3, energy: 4, diet_adherence: 4, training_adherence: 5 },
    photos: {},
  })

  function update(path, value) {
    setForm((current) => ({ ...current, [path]: value }))
  }

  function updateMeasurement(key, value) {
    setForm((current) => ({ ...current, measurements: { ...current.measurements, [key]: value } }))
  }

  function updateCheck(key, value) {
    setForm((current) => ({ ...current, check_in: { ...current.check_in, [key]: value } }))
  }

  function updatePhoto(key, file) {
    if (!file) {
      setForm((current) => ({ ...current, photos: { ...current.photos, [key]: file } }))
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.warning('Use apenas imagens JPG, PNG ou WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Cada foto deve ter no máximo 5MB.')
      return
    }

    setForm((current) => ({ ...current, photos: { ...current.photos, [key]: file } }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const weight = Number(form.weight)
    const targetWeight = form.target_weight ? Number(form.target_weight) : null

    if (!form.record_date) {
      toast.warning('Informe a data do registro.')
      return
    }

    if (!Number.isFinite(weight) || weight < 20 || weight > 400) {
      toast.warning('Informe um peso entre 20kg e 400kg.')
      return
    }

    if (targetWeight !== null && (!Number.isFinite(targetWeight) || targetWeight < 20 || targetWeight > 400)) {
      toast.warning('Informe uma meta entre 20kg e 400kg.')
      return
    }

    try {
      setSaving(true)
      await createProgressRecord({ ...form, client_uuid: clientUuid })
      await onSaved()
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="progress-modal-overlay" role="dialog" aria-modal="true">
      <form className="progress-modal" onSubmit={handleSubmit}>
        <button type="button" className="progress-modal-close" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        <h2>Novo registro</h2>
        <p>Preencha as informações abaixo para registrar o progresso do cliente.</p>

        <section>
          <h3>Dados gerais</h3>
          <div className="progress-modal-grid is-two">
            <label><span>Data do registro</span><input type="date" value={form.record_date} onChange={(event) => update('record_date', event.target.value)} required /></label>
            <label><span>Peso</span><input type="number" min="20" max="400" step="0.1" value={form.weight} onChange={(event) => update('weight', event.target.value)} required /><b>kg</b></label>
            <label><span>Meta de peso para o próximo registro</span><input type="number" min="20" max="400" step="0.1" value={form.target_weight} onChange={(event) => update('target_weight', event.target.value)} /><b>kg</b></label>
          </div>
          <label className="progress-modal-notes"><span>Observações</span><textarea maxLength="300" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Como foi o dia do cliente? Alguma observação importante?" /><small>{form.notes.length}/300</small></label>
        </section>

        <section>
          <div className="progress-modal-section-head"><h3>Medidas corporais</h3><button type="button" onClick={() => setForm((current) => ({ ...current, measurements: latestMeasurements }))}>Usar ultimas medidas</button></div>
          <div className="progress-modal-grid is-measures">
            {measurementItems.map((item) => (
              <label key={item.key} className="progress-modal-measure"><i>{item.icon}</i><span>{item.label}</span><input type="number" step="0.1" value={form.measurements[item.key] || ''} onChange={(event) => updateMeasurement(item.key, event.target.value)} /><b>cm</b></label>
            ))}
          </div>
        </section>

        <section>
          <h3>Fotos de progresso</h3>
          <p>Adicione fotos para acompanhar a evolução do cliente.</p>
          <div className="progress-upload-grid">
            {photoItems.map((item) => <UploadBox key={item.key} item={item} file={form.photos[item.key]} onChange={updatePhoto} />)}
            <button type="button"><PhotoIcon /><strong>Comparar</strong><span>antes/depois</span></button>
          </div>
          <small className="progress-upload-hint">Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB por imagem.</small>
        </section>

        <section>
          <h3>Check-in de hoje</h3>
          <p>Avalie como o cliente se sentiu hoje.</p>
          <div className="progress-modal-checks">
            {checkItems.map((item) => <ScoreInput key={item.key} item={item} value={form.check_in[item.key]} onChange={updateCheck} />)}
          </div>
        </section>

        <footer>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar registro'}</button>
        </footer>
      </form>
    </div>
  )
}

function UploadBox({ item, file, onChange }) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <label className={`progress-upload-box ${preview ? 'has-preview' : ''}`}>
      <input type="file" accept="image/*" hidden onChange={(event) => onChange(item.key, event.target.files?.[0] || null)} />
      {preview ? <img src={preview} alt="" /> : <PhotoIcon />}
      <strong>{item.label}</strong>
      <span>{file ? file.name : 'Enviar foto'}</span>
    </label>
  )
}

function ScoreInput({ item, value, onChange }) {
  return (
    <div className="progress-score-row">
      <span aria-hidden="true">{item.icon}</span>
      <strong>{item.label}</strong>
      <div>{[1, 2, 3, 4, 5].map((score) => <button type="button" key={score} className={Number(value) === score ? 'is-active' : ''} onClick={() => onChange(item.key, score)}>{score}</button>)}</div>
    </div>
  )
}

function HistoryDialog({ type, records, onOpenRecord, onClose }) {
  const isMeasurements = type === 'measurements'
  const isRecords = type === 'records'
  return (
    <div className="progress-dialog-overlay" role="dialog" aria-modal="true">
      <div className="progress-dialog">
        <button type="button" className="progress-dialog-close" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        <h2>{isRecords ? 'Todos os registros' : isMeasurements ? 'Histórico de medidas' : 'Histórico de check-ins'}</h2>
        <p>{isRecords ? 'Lista completa de registros de progresso.' : isMeasurements ? 'Compare a evolução das medidas registradas.' : 'Veja como os check-ins evoluíram ao longo dos registros.'}</p>
        {isRecords ? <RecentRecords records={records} onOpen={onOpenRecord} onShowAll={() => {}} /> : null}
        {!isRecords ? (
        <div className="progress-history-table">
          <div>
            <span>Data</span>
            {isMeasurements ? measurementItems.map((item) => <span key={item.key}>{item.label}</span>) : checkItems.map((item) => <span key={item.key}>{item.label}</span>)}
          </div>
          {records.map((record) => (
            <div key={record.uuid}>
              <span>{formatDate(record.record_date)}</span>
              {isMeasurements
                ? measurementItems.map((item) => <span key={item.key}>{record.measurements?.[item.key] ? `${formatNumber(record.measurements[item.key])} cm` : '-'}</span>)
                : checkItems.map((item) => <span key={item.key}><RatingDots value={record.check_in?.[item.key] || 0} /></span>)}
            </div>
          ))}
        </div>
        ) : null}
      </div>
    </div>
  )
}

function PhotoDialog({ photo, role, records, clientName, onImageOpen, onAdd, onClose }) {
  const [category, setCategory] = useState(photo.category || 'front')
  const gallery = buildGalleryPhotos(records, category)
  const current = gallery.at(-1) || null
  const previous = gallery.length > 1 ? gallery.at(-2) : null

  return (
    <div className="progress-gallery-overlay" role="dialog" aria-modal="true">
      <div className="progress-gallery">
        <header className="progress-gallery-header">
          <button type="button" onClick={onClose} aria-label="Voltar"><ArrowLeftIcon /></button>
          <div>
            <h2>Fotos de progresso</h2>
            <p>Cliente: {clientName || '-'} <i /> Categoria: {photoLabel(category)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        </header>

        <section className="progress-gallery-tip">
          <span><TargetIcon /></span>
          <div>
            <strong>Compare sua evolução</strong>
            <p>Veja sua transformação ao longo do tempo. A foto atual é destacada ao centro.</p>
          </div>
        </section>

        <div className="progress-gallery-tabs">
          {photoItems.map((item) => (
            <button type="button" key={item.key} className={category === item.key ? 'is-active' : ''} onClick={() => setCategory(item.key)}>
              {item.label}
            </button>
          ))}
          {role === 'client' ? <button type="button" className="progress-gallery-add" onClick={onAdd}><UploadIcon /> Adicionar foto</button> : null}
        </div>

        <section className="progress-gallery-stage">
          <button type="button" className="progress-gallery-arrow" aria-label="Anterior"><ArrowLeftIcon /></button>
          <GalleryPhotoCard title="Anterior" photo={previous} emphasis="past" onImageOpen={onImageOpen} />
          <GalleryPhotoCard title="Atual" photo={current} emphasis="current" onImageOpen={onImageOpen} />
          <button type="button" className="progress-gallery-arrow" aria-label="Próxima"><ChevronRightIcon /></button>
        </section>

        <section className="progress-gallery-history">
          <h3>Histórico completo</h3>
          <div>
            {gallery.map((item, index) => (
              <button type="button" key={`${item.url}-${item.record_date}`} className={index === gallery.length - 1 ? 'is-current' : ''}>
                <span>{formatDate(item.record_date)}</span>
                <img src={item.url} alt="" onClick={() => onImageOpen(item)} />
                <strong>{formatNumber(item.weight)} kg</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="progress-gallery-hint">
          <span><LightbulbIcon /></span>
          <p>Mantenha as fotos sempre no mesmo local, iluminação e postura para acompanhar sua evolução com mais precisão.</p>
        </section>
      </div>
    </div>
  )
}

function GalleryPhotoCard({ title, photo, emphasis, onImageOpen }) {
  return (
    <article className={`progress-gallery-card is-${emphasis}`}>
      <header>
        <strong>{title}</strong>
        <span>{photo?.record_date ? formatDate(photo.record_date) : title === 'Proximo' ? 'Aguardando' : '-'}</span>
      </header>
      {photo?.url ? (
        <button type="button" className="progress-gallery-image-button" onClick={() => onImageOpen(photo)}>
          <img src={photo.url} alt="" />
        </button>
      ) : (
        <div className="progress-gallery-placeholder"><PhotoIcon /><span>Foto ainda não enviada</span></div>
      )}
      <footer>
        {emphasis === 'current' ? <small>Atual</small> : null}
        <b>{photo?.weight ? `${formatNumber(photo.weight)} kg` : '-'}</b>
      </footer>
    </article>
  )
}

function ImageViewer({ photo, onClose }) {
  return (
    <div className="progress-image-viewer" role="dialog" aria-modal="true">
      <button type="button" className="progress-image-backdrop" onClick={onClose} aria-label="Fechar" />
      <div>
        <button type="button" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        {photo?.url ? <img src={photo.url} alt="" /> : null}
        <strong>{photoLabel(photo?.type)} {photo?.record_date ? `- ${formatDate(photo.record_date)}` : ''}</strong>
      </div>
    </div>
  )
}

function buildGalleryPhotos(records, category) {
  return records
    .flatMap((record) => (record.photos || [])
      .filter((item) => item.type === category)
      .map((item) => ({ ...item, record_date: record.record_date, record_created_at: record.created_at, weight: record.weight })))
    .sort((a, b) => photoTimestamp(a) - photoTimestamp(b))
}

function photoTimestamp(photo) {
  const recordDate = photo?.record_date || ''
  const createdAt = photo?.record_created_at || photo?.created_at || ''
  const time = new Date(`${recordDate}T00:00:00`).getTime()
  const createdTime = createdAt ? new Date(createdAt).getTime() : 0

  return (Number.isNaN(time) ? 0 : time) + (Number.isNaN(createdTime) ? 0 : createdTime / 1000000000)
}

function RecordDialog({ record, role, onSaved, onClose }) {
  const toast = useToast()
  const [feedback, setFeedback] = useState('')
  const [savingFeedback, setSavingFeedback] = useState(false)

  async function handleFeedbackSubmit(event) {
    event.preventDefault()
    if (!feedback.trim()) {
      toast.warning('Escreva um feedback antes de salvar.')
      return
    }

    try {
      setSavingFeedback(true)
      await saveProgressFeedback(record.uuid, feedback.trim())
      await onSaved()
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setSavingFeedback(false)
    }
  }

  return (
    <div className="progress-dialog-overlay" role="dialog" aria-modal="true">
      <div className="progress-dialog">
        <button type="button" className="progress-dialog-close" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        <h2>Registro de {formatDate(record.record_date)}</h2>
        <p>{record.notes || 'Sem observações'}</p>
        <div className="progress-record-detail-grid">
          <SummaryCard tone="green" icon={<ScaleIcon />} label="Peso" value={`${formatNumber(record.weight)} kg`} detail="Registro selecionado" />
          <SummaryCard tone="orange" icon={<TargetIcon />} label="Meta" value={record.target_weight ? `${formatNumber(record.target_weight)} kg` : '-'} detail="Meta registrada" />
        </div>
        <h3>Medidas</h3>
        <div className="progress-measure-list">
          {measurementItems.map((item) => <MeasurementRow key={item.key} item={{ type: item.key, value: record.measurements?.[item.key], delta: null }} />)}
        </div>
        <h3>Check-in</h3>
        <CheckInRows values={record.check_in || {}} />
        <h3>Fotos</h3>
        <div className="progress-photo-history">
          {(record.photos || []).map((item) => (
            <button type="button" key={item.url} onClick={() => window.open(item.url, '_blank')}>
              <img src={item.url} alt="" />
              <span>{photoLabel(item.type)}</span>
            </button>
          ))}
        </div>
        <h3>Feedbacks dos profissionais</h3>
        <FeedbackList feedbacks={record.feedbacks || []} />
        {role === 'professional' ? (
          <form className="progress-feedback-form" onSubmit={handleFeedbackSubmit}>
            <label>
              <span>Seu feedback para este registro</span>
              <textarea maxLength="1000" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Comente a evolução, ajustes ou orientações para o aluno..." />
            </label>
            <button type="submit" disabled={savingFeedback}>{savingFeedback ? 'Salvando...' : 'Salvar feedback'}</button>
          </form>
        ) : null}
      </div>
    </div>
  )
}

function FeedbackList({ feedbacks }) {
  if (!feedbacks.length) return <p className="progress-feedback-empty">Nenhum feedback registrado para este registro.</p>

  return (
    <div className="progress-feedback-list is-dialog">
      {feedbacks.map((feedback) => (
        <div className="progress-feedback-item" key={feedback.uuid}>
          <div className="progress-feedback-author">
            <span>{initials(feedback.professional?.name || 'Profissional')}</span>
            <div>
              <strong>{feedback.professional?.name || 'Profissional'}</strong>
              <small>{formatDate(feedback.created_at)} {feedback.professional?.speciality ? `- ${professionalLabel(feedback.professional.speciality)}` : ''}</small>
            </div>
          </div>
          <p>{feedback.text}</p>
        </div>
      ))}
    </div>
  )
}

function mockHistory() {
  return [80.6, 80.1, 79.8, 79.2, 79.3, 78.7, 78.1, 78.3, 78.4, 77.4, 77.8, 77.6, 77.2, 77.4, 77.7, 76.9].map((weight, index) => ({ date: `2026-06-${String(index + 1).padStart(2, '0')}`, weight }))
}

function averageCheck(check = {}) {
  const values = Object.values(check).map(Number).filter(Boolean)
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function formatNumber(value) {
  const number = Number(value || 0)
  return number.toLocaleString('pt-BR', { minimumFractionDigits: number % 1 ? 1 : 0, maximumFractionDigits: 1 })
}

function signedNumber(value) {
  if (value === null || value === undefined) return '-'
  const number = Number(value)
  return `${number > 0 ? '+' : ''}${formatNumber(number)}`
}

function formatDate(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

function formatShortDate(value) {
  return value.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

function photoLabel(type) {
  return photoItems.find((item) => item.key === type)?.label || type || 'Foto'
}

function professionalLabel(value) {
  if (value === 'trainer') return 'Treinador'
  if (value === 'nutritionist') return 'Nutricionista'
  return 'Profissional'
}

function relativeDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Hoje'
  return formatDate(value)
}

function firstNameFrom(name = '') {
  return String(name || 'Cliente').trim().split(/\s+/)[0] || 'Cliente'
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'PR'
}

function ScaleIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h14v16H5V4ZM9 8h6M12 8v4M9 14h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function TrendIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 17 10 11l4 4 6-8M14 7h6v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function TargetIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg> }
function CalendarIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v16H5V5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function ArrowLeftIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ChevronRightIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ChevronDownIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function MoonIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 14.5A8 8 0 0 1 9.5 3 8.5 8.5 0 1 0 21 14.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function FoodIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3v7M9 3v7M12 3v7M9 10v11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /><path d="M17.5 3v18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /><path d="M17.5 3c2.1 1.7 3 3.9 3 7.1v1.4h-3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function BoltIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function AppleSmallIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 7c-1.5-2.3-3.4-2.9-5.5-1.8C4.2 6.4 3.4 9.5 4.3 13c1.2 4.6 4.1 7.3 6.4 6.2.8-.4 1.8-.4 2.6 0 2.3 1.1 5.2-1.6 6.4-6.2.9-3.5.1-6.6-2.2-7.8-2.1-1.1-4-.5-5.5 1.8ZM12 6.5c.1-1.8.9-3 2.4-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function DumbbellIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8V16M18 8V16M4 10V14M20 10V14M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function PhotoIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4V8ZM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function UploadIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function LightbulbIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-.8.7-1.2 1.5-1.2 2.4H9.2C9.2 15.5 8.8 14.7 8 14Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ProgressIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function LockIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6V11ZM12 15v2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
