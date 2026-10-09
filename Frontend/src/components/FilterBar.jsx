import { SECTORS } from '../data/sectors'
import { CATEGORY_LABELS, PRIORITIES, STATUSES } from '../data/labels'

export default function FilterBar({ filters, departments, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value || undefined })

  return (
    <div className="filter-bar" role="group" aria-label="Filter complaints">
      <select aria-label="Filter by department" value={filters.department || ''} onChange={set('department')}>
        <option value="">All departments</option>
        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select aria-label="Filter by priority" value={filters.priority || ''} onChange={set('priority')}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select aria-label="Filter by status" value={filters.status || ''} onChange={set('status')}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select aria-label="Filter by category" value={filters.category || ''} onChange={set('category')}>
        <option value="">All categories</option>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select aria-label="Filter by sector" value={filters.sector || ''} onChange={set('sector')}>
        <option value="">All sectors</option>
        {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
