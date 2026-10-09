import { NavLink, Link, Outlet } from 'react-router-dom'
import OfflineBanner from '../components/OfflineBanner'
import PendingSyncBadge from '../components/PendingSyncBadge'

export default function MainLayout() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="brand" aria-label="Awaaz home">
            <span className="brand-mark" aria-hidden="true">A</span>
            Awaaz
          </Link>
          <nav className="main-nav" aria-label="Primary">
            <NavLink to="/report">Report</NavLink>
            <NavLink to="/track">Track</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            <PendingSyncBadge />
          </nav>
        </div>
      </header>
      <OfflineBanner />
      <main className="container page">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">Awaaz — AI that hears Chandigarh. Speak. Report. Track.</div>
      </footer>
    </>
  )
}
