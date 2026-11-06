import { Link, useLocation } from 'react-router-dom'
import './BottomNav.css'

const TABS = [
  { label: 'WORKOUT', icon: '🏋️', path: '/Dashboard' },
  { label: 'METRICS', icon: '📊', path: '/Tracker'   },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`bnav-item ${pathname === tab.path ? 'bnav-active' : ''}`}
        >
          <span className="bnav-icon">{tab.icon}</span>
          <span className="bnav-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

