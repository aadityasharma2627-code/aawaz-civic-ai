import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="center" style={{ padding: '60px 0' }}>
      <h1 className="page-title">Page not found</h1>
      <p className="muted">The page you are looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back home</Link>
    </div>
  )
}
