import { useEffect, useState } from 'react'
import { getPendingComplaints, onPendingChanged } from '../services/offline/queue'

export function usePendingComplaints() {
  const [items, setItems] = useState([])
  useEffect(() => {
    let mounted = true
    const refresh = () => getPendingComplaints().then((rows) => mounted && setItems(rows))
    refresh()
    const off = onPendingChanged(refresh)
    return () => { mounted = false; off() }
  }, [])
  return items
}
