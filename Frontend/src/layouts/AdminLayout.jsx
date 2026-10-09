import { NavLink, Link, Outlet } from 'react-router-dom'
import OfflineBanner from '../components/OfflineBanner'

export default function AdminLayout() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/admin" className="brand" aria-label="Awaaz admin">
            <span className="brand-mark" aria-hidden="true">A</span>
            Awaaz <span className="muted" style={{ fontWeight: 500, fontSize: '0.9rem' }}>Admin</span>
          </Link>
          <nav className="main-nav" aria-label="Admin">
            <NavLink to="/" end>View site</NavLink>
          </nav>
        </div>
      </header>
      <OfflineBanner />
      <main className="container page">
        <nav className="admin-nav" aria-label="Admin sections">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/queue">Complaint Queue</NavLink>
        </nav>
        <Outlet />
      </main>
    </>
  )
}
