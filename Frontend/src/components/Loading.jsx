export default function Loading({ label = 'Loading…' }) {
  return (
    <p className="muted center" role="status">
      <span className="spin" aria-hidden="true">◌</span> {label}
    </p>
  )
}
