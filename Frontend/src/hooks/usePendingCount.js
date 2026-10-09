import { useEffect, useState } from 'react'
import { getPendingCount, onPendingChanged } from '../services/offline/queue'

export function usePendingCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let mounted = true
    const refresh = () => getPendingCount().then((n) => mounted && setCount(n))
    refresh()
    const off = onPendingChanged(refresh)
    const onVisibility = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      mounted = false
      off()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
  return count
}
