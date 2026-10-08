import { useState } from 'react'
import { PlusIcon } from '@phosphor-icons/react'
import PatientFormModal from '@/features/people/components/PatientFormModal/PatientFormModal.jsx'
import { useToast } from '@/composables/useToast.jsx'
import {
  clientErrorToFormErrors,
  inviteClient,
  validateClientPayload,
} from '@/services/clients.js'
import { getNutritionistDashboard } from '@/services/dashboard.js'
import { useProfessionalDashboard } from '../hooks/useProfessionalDashboard.js'
import ProfessionalOverview from './ProfessionalOverview.jsx'

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  cpf: '',
  gender: '',
  birth_date: '',
  height: '',
  weight: '',
})

export default function NutritionistDashboard() {
  const toast = useToast()
  const { dashboard, loading, error, refresh } = useProfessionalDashboard(
    getNutritionistDashboard
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function openPatientModal() {
    setForm(emptyForm())
    setFormErrors({})
    setModalOpen(true)
  }

  function updateForm(nextForm) {
    setForm(nextForm)
    setFormErrors((current) => {
      const next = { ...current }
      Object.keys(nextForm).forEach((key) => {
        if (nextForm[key] !== form[key]) delete next[key]
      })
      return next
    })
  }

  async function savePatient() {
    const errors = validateClientPayload(form)
    setFormErrors(errors)
    if (Object.keys(errors).length) {
      toast.warning('Revise os campos destacados.')
      return
    }
    try {
      setSaving(true)
      await inviteClient(form)
      setModalOpen(false)
      toast.success('Convite enviado com sucesso.')
      await refresh({ notifyError: false })
    } catch (error) {
      const errors = clientErrorToFormErrors(error)
      setFormErrors(errors)
      toast.warning(Object.values(errors)[0] || error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ProfessionalOverview
        data={dashboard}
        loading={loading}
        error={error}
        onRetry={() => refresh().catch(() => {})}
        action={
          <button
            type="button"
            className="nt-primary-button"
            onClick={openPatientModal}
          >
            <PlusIcon size={20} /> Novo paciente
          </button>
        }
      />
      <PatientFormModal
        open={modalOpen}
        form={form}
        errors={formErrors}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onSave={savePatient}
        onChange={updateForm}
      />
    </>
  )
}
