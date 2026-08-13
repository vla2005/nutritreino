import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/composables/useToast.jsx'

export default function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <ToastProvider>{children}</ToastProvider>
    </BrowserRouter>
  )
}
