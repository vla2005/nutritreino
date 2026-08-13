export function profileToForm(user) {
  return {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || user?.client?.phone || '',
    cpf: user?.cpf || user?.client?.cpf || '',
    avatar_file: null,
    speciality: user?.professional?.speciality || '',
    registration: user?.professional?.registration || '',
    bio: user?.professional?.bio || '',
    gender: user?.client?.gender || '',
    birth_date: user?.client?.birth_date || '',
    height: user?.client?.height || '',
    weight: user?.client?.weight || '',
  }
}
