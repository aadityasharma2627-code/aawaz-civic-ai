import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { startSyncListener } from './services/offline/sync'

export default function App() {
  useEffect(() => {
    // Automatically flush the offline queue whenever connectivity returns.
    startSyncListener()
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
