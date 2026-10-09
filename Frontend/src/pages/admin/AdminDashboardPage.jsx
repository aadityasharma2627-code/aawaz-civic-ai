import { useEffect, useState } from 'react'
import { getDashboardStats, getDashboardHotspots } from '../../api/dashboard'
import { SECTORS } from '../../data/sectors'
import Loading from '../../components/Loading'

const STAT_DEFS = [
  { key: 'total', altKeys: ['total_complaints'], label: 'Total complaints' },
  { key: 'open', altKeys: ['open_complaints'], label: 'Open complaints' },
  { key: 'high_priority', altKeys: ['high_priority_complaints', 'highPriority'], label: 'High priority' },
  { key: 'merged', altKeys: ['merged_reports', 'merged'], label: 'Merged / duplicates' },
]

function pick(data, primary, alts) {
  if (data?.[primary] != null) return data[primary]
  for (const k of alts) if (data?.[k] != null) return data[k]
  return null
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [hotspots, setHotspots] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.allSettled([getDashboardStats(), getDashboardHotspots()]).then(([s, h]) => {
      if (!mounted) return
      if (s.status === 'fulfilled') setStats(s.value?.stats || s.value)
      if (h.status === 'fulfilled') setHotspots(h.value?.hotspots || h.value)
      if (s.status === 'rejected' && h.status === 'rejected') {
        setError('Dashboard data is unavailable right now. The backend may still be starting up — try refreshing in a moment.')
      }
    })
    return () => { mounted = false }
  }, [])

  const hotspotMax = Math.max(1, ...(hotspots || []).map((h) => h.count ?? h.open ?? 0))

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Overview of civic complaints across Chandigarh.</p>

      {error && <div className="error-box" role="alert">{error}</div>}

      <div className="stats-grid">
        {STAT_DEFS.map((def) => {
          const value = stats ? pick(stats, def.key, def.altKeys) : null
          return (
            <div key={def.key} className="card stat-card">
              <div className="num">{value ?? '—'}</div>
              <div className="lbl">{def.label}</div>
            </div>
          )
        })}
      </div>
      {!stats && !error && <Loading label="Loading statistics…" />}

      <section className="section">
        <h2>Sector hotspots</h2>
        <p className="muted" style={{ fontSize: '0.88rem' }}>Open complaints by sector.</p>
        {hotspots ? (
          <div className="hotspot-list">
            {(hotspots.length ? hotspots : SECTORS.map((sector) => ({ sector, count: 0 }))).map((h) => {
              const count = h.count ?? h.open ?? 0
              return (
                <div className="hotspot-row" key={h.sector || h.sector_name}>
                  <span className="hs-name">{h.sector || h.sector_name}</span>
                  <span className="hotspot-bar" aria-hidden="true">
                    <span style={{ width: `${Math.round((count / hotspotMax) * 100)}%` }} />
                  </span>
                  <span className="hs-count">{count} open</span>
                </div>
              )
            })}
          </div>
        ) : (
          !error && <Loading label="Loading hotspots…" />
        )}
      </section>
    </div>
  )
}
