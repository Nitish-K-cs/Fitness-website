import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import './Tracker.css'
import {
  getThisWeekDays,
  getConsistencyGrid,
  getThisWeekVolume,
  getRecentSessions,
  getLiveStats,
} from '../services/storage'
import BottomNav from '../components/BottomNav'

/* ── Static mock — heart rate is device data we don't have ── */
const HEART_RATE = [
  { t: '04:00', bpm: 62 },
  { t: '06:00', bpm: 75 },
  { t: '08:00', bpm: 110 },
  { t: '10:00', bpm: 145 },
  { t: '12:00', bpm: 174 },
  { t: '14:00', bpm: 158 },
  { t: '16:00', bpm: 120 },
  { t: '18:00', bpm: 90  },
  { t: '20:00', bpm: 68  },
]
const MAX_BPM = Math.max(...HEART_RATE.map(h => h.bpm))
const MIN_BPM = Math.min(...HEART_RATE.map(h => h.bpm))

/* ── Sub-components ───────────────────────────────────── */

function IntensityBar({ level }) {
  return (
    <div className="intensity-bar">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`intensity-seg ${i <= level ? `seg-${level}` : 'seg-empty'}`} />
      ))}
    </div>
  )
}

function WeeklyVolumeChart({ volume }) {
  const maxVol = Math.max(...volume, 1)   // avoid /0
  const days   = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const peakIdx = volume.indexOf(Math.max(...volume))

  return (
    <div className="chart-bars">
      {volume.map((vol, i) => (
        <div key={i} className="bar-col">
          <div className="bar-track">
            <div
              className={`bar-fill ${i === peakIdx && vol > 0 ? 'bar-peak' : ''}`}
              style={{ height: `${(vol / maxVol) * 100}%` }}
            />
          </div>
          <span className="bar-label">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

function HeartRateChart() {
  const w = 100
  const h = 80
  const pts = HEART_RATE.map((d, i) => {
    const x = (i / (HEART_RATE.length - 1)) * w
    const y = h - ((d.bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * (h - 10) - 5
    return `${x},${y}`
  })
  const peakIdx = HEART_RATE.findIndex(d => d.bpm === MAX_BPM)
  const peakX   = (peakIdx / (HEART_RATE.length - 1)) * 100

  return (
    <div className="hr-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="hr-svg">
        <defs>
          <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"   />
          </linearGradient>
        </defs>
        <polyline
          points={pts.join(' ')}
          fill="none"
          stroke="var(--accent2)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          points={`0,${h} ${pts.join(' ')} ${w},${h}`}
          fill="url(#hrGrad)"
        />
      </svg>
      <div className="hr-peak-marker" style={{ left: `${peakX}%` }}>
        <div className="hr-peak-label">PEAK: {MAX_BPM} BPM</div>
        <div className="hr-peak-dot" />
      </div>
      <div className="hr-x-labels">
        {HEART_RATE.filter((_, i) => i % 2 === 0).map(d => (
          <span key={d.t}>{d.t}</span>
        ))}
      </div>
    </div>
  )
}

/* ── Empty state for when there are no logs yet ───────── */
function EmptyState() {
  return (
    <div className="empty-logs">
      <div className="empty-icon">📋</div>
      <div className="empty-title">NO SESSIONS LOGGED YET</div>
      <div className="empty-sub">Complete a workout on the Dashboard to see your history here.</div>
    </div>
  )
}

/* ── Tracker (default export) ─────────────────────────── */
export default function Tracker() {
  const [selectedDay,  setSelectedDay]  = useState(null)
  const [weekOffset,   setWeekOffset]   = useState(0)

  // Read all derived data once per render from storage
  // (re-reads if the user navigates back and forth)
  const weekDays       = useMemo(() => getThisWeekDays(),        [])
  const consistGrid    = useMemo(() => getConsistencyGrid(35),   [])
  const weeklyVolume   = useMemo(() => getThisWeekVolume(),      [])
  const recentSessions = useMemo(() => getRecentSessions(5),     [])
  const stats          = useMemo(() => getLiveStats(),           [])

  // Auto-select today in the week strip
  const todayIdx = weekDays.findIndex(d => d.active)
  const activeDayIdx = selectedDay ?? (todayIdx >= 0 ? todayIdx : 0)

  // Current week's total reps (for the TOTAL VOLUME card)
  const totalRepsThisWeek = weeklyVolume.reduce((s, v) => s + v, 0)
  // Today's active time in minutes
  const todayMinutes = Math.max(1, Math.round(stats.totalDurToday / 60))

  /* ── 3-letter month labels for consistency footer ── */
  const monthLabels = (() => {
    const labels = []
    const now = new Date()
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(now.getMonth() - i)
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase())
    }
    return labels
  })()

  return (
    <div className="tracker-shell">

      {/* ── Mobile top bar (hidden on desktop via CSS) ── */}
      <div className="mobile-topbar tracker-mobile-top">
        <Link to="/Dashboard" className="mobile-back">‹ WORKOUT</Link>
        <span className="mobile-page-title">METRICS</span>
        {stats.streak > 0
          ? <span className="mobile-streak-badge">🔥 {stats.streak}</span>
          : <span className="mobile-streak-badge" />
        }
      </div>

      {/* ── Sidebar (desktop only) ── */}
      <aside className="sidebar">
        <div className="brand">KINETIC<br /><span>PRECISION</span></div>
        <nav className="sidebar-nav">
          {['DASHBOARD', 'WORKOUTS', 'METRICS', 'RECOVERY', 'SETTINGS'].map(item => (
            <a
              key={item}
              href={item === 'DASHBOARD' ? '/Dashboard' : '#'}
              className={`nav-item ${item === 'METRICS' ? 'active' : ''}`}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="session-progress">
          <div className="progress-label">WEEK STREAK</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(stats.daysThisWeek / 7) * 100}%` }} />
          </div>
          <div className="progress-count">{stats.daysThisWeek} / 7</div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="tracker-main">

        {/* Header */}
        <div className="tracker-header">
          <div>
            <span className="tracker-supertitle">
              {stats.streak > 0 ? `🔥 ${stats.streak}-DAY STREAK · TELEMETRY ACTIVE` : 'TELEMETRY ACTIVE'}
            </span>
            <h1 className="tracker-title">TRACKER LOGS</h1>
          </div>
          <div className="week-nav">
            <button className="week-nav-btn" onClick={() => setWeekOffset(w => w - 1)}>‹</button>
            <button className="week-nav-btn" onClick={() => setWeekOffset(w => w + 1)}>›</button>
          </div>
        </div>

        {/* Week strip — real dates from storage */}
        <div className="week-strip">
          {weekDays.map((d, i) => (
            <button
              key={i}
              className={`day-pill ${i === activeDayIdx ? 'day-active' : ''} ${!d.hasLog ? 'day-empty' : ''}`}
              onClick={() => setSelectedDay(i)}
            >
              <span className="day-name">{d.day}</span>
              <span className="day-num">{d.date + weekOffset}</span>
              {d.hasLog && <span className="day-dot" />}
            </button>
          ))}
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          <div className="stat-card stat-volume">
            <div className="stat-label">TOTAL REPS (WEEK)</div>
            <div className="stat-value">
              {totalRepsThisWeek.toLocaleString()}
            </div>
            <div className="stat-unit">REPS</div>
            <div className="stat-sub">
              {totalRepsThisWeek > 0 ? `${stats.daysThisWeek} session${stats.daysThisWeek !== 1 ? 's' : ''} this week` : 'No sessions yet'}
            </div>
          </div>

          <div className="stat-card stat-calories">
            <div className="stat-divider" />
            <div className="stat-label">TODAY'S REPS</div>
            <div className="stat-value">
              {stats.totalRepsToday} <span className="stat-kcal">REPS</span>
            </div>
            <div className="stat-sub stat-sub-accent">
              {stats.totalRepsToday > 0 ? '🔥 Session logged today' : '— Rest day'}
            </div>
          </div>

          <div className="stat-card stat-time">
            <div className="stat-label">TIME ACTIVE TODAY</div>
            <div className="stat-value">
              {stats.totalDurToday > 0 ? todayMinutes : '—'}{' '}
              {stats.totalDurToday > 0 && <span className="stat-unit-inline">MIN</span>}
            </div>
            <div className="stat-sub stat-sub-ok">
              {stats.totalDurToday > 0 ? '✓ Workout complete' : 'No workout yet'}
            </div>
          </div>

          <div className="stat-card stat-consistency">
            <div className="consistency-header">
              <span className="stat-label">CONSISTENCY TRACKER</span>
              {stats.streak > 0 && (
                <span className="streak-badge">{stats.streak} DAY STREAK</span>
              )}
            </div>
            <div className="consistency-grid">
              {consistGrid.map((level, i) => (
                <div key={i} className={`consistency-cell cell-${level}`} />
              ))}
            </div>
            <div className="consistency-months">
              {monthLabels.map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-title">WEEKLY REPS (MON → SUN)</div>
            <WeeklyVolumeChart volume={weeklyVolume} />
          </div>
          <div className="chart-card">
            <div className="chart-title">HEART RATE TRENDS (BPM)</div>
            <HeartRateChart />
          </div>
        </div>

        {/* Recent logs */}
        <div className="logs-section">
          <div className="logs-header">
            <span className="logs-title">RECENT SESSIONS</span>
          </div>
          <div className="logs-list">
            {recentSessions.length === 0
              ? <EmptyState />
              : recentSessions.map(log => (
                  <div key={log.id} className="log-row">
                    <div className="log-icon">{log.icon}</div>
                    <div className="log-info">
                      <div className="log-name">{log.name}</div>
                      <div className="log-meta">
                        <span>📅 {log.time}</span>
                        <span>⏱ {log.duration} MIN</span>
                        <span>💪 {log.totalReps} REPS</span>
                      </div>
                    </div>
                    <div className="log-intensity">
                      <span className="intensity-label">INTENSITY</span>
                      <IntensityBar level={log.intensity} />
                    </div>
                    <button className="log-menu">⋮</button>
                  </div>
                ))
            }
          </div>
        </div>

      </div>

      {/* ── Bottom nav (mobile only, hidden on desktop via CSS) ── */}
      <BottomNav />
    </div>
  )
}
