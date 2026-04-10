import { useState } from 'react'
import './Tracker.css'

const WEEK_DAYS = [
  { day: 'MON', date: 14, hasLog: true },
  { day: 'TUE', date: 15, hasLog: true, active: true },
  { day: 'WED', date: 16, hasLog: false },
  { day: 'THU', date: 17, hasLog: true },
  { day: 'FRI', date: 18, hasLog: true },
  { day: 'SAT', date: 19, hasLog: false },
  { day: 'SUN', date: 20, hasLog: false },
]

const CONSISTENCY_GRID = Array.from({ length: 35 }, (_, i) => {
  const r = Math.random()
  if (r > 0.75) return 'high'
  if (r > 0.5) return 'mid'
  if (r > 0.3) return 'low'
  return 'none'
})

const WEEKLY_VOLUME = [8.2, 10.5, 7.8, 12.45, 9.1, 4.3, 0]
const MAX_VOL = Math.max(...WEEKLY_VOLUME)

const HEART_RATE = [
  { t: '04:00', bpm: 62 },
  { t: '06:00', bpm: 75 },
  { t: '08:00', bpm: 110 },
  { t: '10:00', bpm: 145 },
  { t: '12:00', bpm: 174 },
  { t: '14:00', bpm: 158 },
  { t: '16:00', bpm: 120 },
  { t: '18:00', bpm: 90 },
  { t: '20:00', bpm: 68 },
]
const MAX_BPM = Math.max(...HEART_RATE.map(h => h.bpm))
const MIN_BPM = Math.min(...HEART_RATE.map(h => h.bpm))

const RECENT_LOGS = [
  {
    id: 1,
    icon: '🏋️',
    name: 'HEAVY PULL — HYPERTROPHY FOCUS',
    time: 'Today, 06:45 AM',
    duration: 74,
    intensity: 4,
  },
  {
    id: 2,
    icon: '🏃',
    name: 'ZONE 2 AEROBIC BASE',
    time: 'Yesterday, 05:30 PM',
    duration: 45,
    intensity: 2,
  },
  {
    id: 3,
    icon: '🧘',
    name: 'MOBILITY & ACTIVE RECOVERY',
    time: '18 Oct, 08:00 AM',
    duration: 20,
    intensity: 1,
  },
]

function IntensityBar({ level }) {
  return (
    <div className="intensity-bar">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`intensity-seg ${i <= level ? `seg-${level}` : 'seg-empty'}`} />
      ))}
    </div>
  )
}

function WeeklyVolumeChart() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="chart-bars">
      {WEEKLY_VOLUME.map((vol, i) => (
        <div key={i} className="bar-col">
          <div className="bar-track">
            <div
              className={`bar-fill ${i === 3 ? 'bar-peak' : ''}`}
              style={{ height: `${(vol / MAX_VOL) * 100}%` }}
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
  const peakX = (peakIdx / (HEART_RATE.length - 1)) * 100

  return (
    <div className="hr-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="hr-svg">
        <defs>
          <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
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

export default function Tracker() {
  const [selectedDay, setSelectedDay] = useState(1)
  const [weekOffset, setWeekOffset] = useState(0)

  return (
    <div className="tracker-shell">

      {/* ── Sidebar ── */}
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
            <div className="progress-fill" style={{ width: '71%' }} />
          </div>
          <div className="progress-count">5 / 7</div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="tracker-main">

        {/* Header */}
        <div className="tracker-header">
          <div>
            <span className="tracker-supertitle">WEEK 42 · TELEMETRY ACTIVE</span>
            <h1 className="tracker-title">TRACKER LOGS</h1>
          </div>
          <div className="week-nav">
            <button className="week-nav-btn" onClick={() => setWeekOffset(w => w - 1)}>‹</button>
            <button className="week-nav-btn" onClick={() => setWeekOffset(w => w + 1)}>›</button>
          </div>
        </div>

        {/* Week strip */}
        <div className="week-strip">
          {WEEK_DAYS.map((d, i) => (
            <button
              key={i}
              className={`day-pill ${i === selectedDay ? 'day-active' : ''} ${!d.hasLog ? 'day-empty' : ''}`}
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
            <div className="stat-label">TOTAL VOLUME</div>
            <div className="stat-value">12<span className="stat-comma">,</span>450</div>
            <div className="stat-unit">KG</div>
            <div className="stat-sub">↑ +12% from avg</div>
          </div>

          <div className="stat-card stat-calories">
            <div className="stat-divider" />
            <div className="stat-label">CALORIES BURNED</div>
            <div className="stat-value">842 <span className="stat-kcal">KCAL</span></div>
            <div className="stat-sub stat-sub-accent">🔥 Peak Burn at 14:20</div>
          </div>

          <div className="stat-card stat-time">
            <div className="stat-label">TIME ACTIVE</div>
            <div className="stat-value">74 <span className="stat-unit-inline">MIN</span></div>
            <div className="stat-sub stat-sub-ok">✓ 92% of target</div>
          </div>

          <div className="stat-card stat-consistency">
            <div className="consistency-header">
              <span className="stat-label">CONSISTENCY TRACKER</span>
              <span className="streak-badge">90 DAY STREAK</span>
            </div>
            <div className="consistency-grid">
              {CONSISTENCY_GRID.map((level, i) => (
                <div key={i} className={`consistency-cell cell-${level}`} />
              ))}
            </div>
            <div className="consistency-months">
              <span>OCT</span><span>NOV</span><span>DEC</span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-title">WEEKLY VOLUME (10³ KG)</div>
            <WeeklyVolumeChart />
          </div>
          <div className="chart-card">
            <div className="chart-title">HEART RATE TRENDS (BPM)</div>
            <HeartRateChart />
          </div>
        </div>

        {/* Recent logs */}
        <div className="logs-section">
          <div className="logs-header">
            <span className="logs-title">RECENT LOGS</span>
            <button className="view-all-btn">VIEW ALL →</button>
          </div>
          <div className="logs-list">
            {RECENT_LOGS.map(log => (
              <div key={log.id} className="log-row">
                <div className="log-icon">{log.icon}</div>
                <div className="log-info">
                  <div className="log-name">{log.name}</div>
                  <div className="log-meta">
                    <span>📅 {log.time}</span>
                    <span>⏱ {log.duration} MIN</span>
                  </div>
                </div>
                <div className="log-intensity">
                  <span className="intensity-label">INTENSITY</span>
                  <IntensityBar level={log.intensity} />
                </div>
                <button className="log-menu">⋮</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
