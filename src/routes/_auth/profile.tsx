import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/profile')({
  component: () => <h1 className="p-8 text-2xl">Perfil (protegido)</h1>,
})