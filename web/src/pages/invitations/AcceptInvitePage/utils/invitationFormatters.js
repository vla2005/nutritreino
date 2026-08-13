export function clientDetails(client) {
  if (!client) return []

  return [
    { label: 'Telefone', value: formatPhone(client.phone) },
    { label: 'CPF', value: formatCpf(client.cpf) },
    { label: 'Genero', value: genderLabel(client.gender) },
    { label: 'Nascimento', value: formatDate(client.birth_date) },
    { label: 'Altura', value: client.height ? `${client.height} cm` : 'Nao informado' },
    { label: 'Peso', value: client.weight ? `${client.weight} kg` : 'Nao informado' },
  ]
}

export function inviteErrorMessage(message) {
  if (message === 'Invalid invitation token') return 'O link do convite e invalido ou ja foi utilizado.'
  if (message === 'Invitation token expired') return 'O link do convite expirou. Solicite um novo convite.'
  if (message === 'This email is already registered with another role') return 'Este e-mail ja esta cadastrado com outro tipo de perfil.'
  return message
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'CL'
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function formatPhone(value) {
  const digits = onlyDigits(value)
  if (!digits) return 'Nao informado'
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCpf(value) {
  const digits = onlyDigits(value)
  if (!digits) return 'Nao informado'
  if (digits.length !== 11) return digits
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function genderLabel(value) {
  return { male: 'Masculino', female: 'Feminino' }[value] || 'Nao informado'
}

function formatDate(value) {
  if (!value) return 'Nao informado'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}
