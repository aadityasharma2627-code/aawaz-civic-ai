import { useOnline } from '../hooks/useOnline'

export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="offline-banner" role="status">
      You are offline. You can still report a problem — it will be saved on this device and sent automatically.
    </div>
  )
}
