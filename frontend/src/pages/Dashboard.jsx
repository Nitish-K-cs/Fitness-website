import { useState, useEffect, useRef } from 'react'
import './Dashboard.css'
import { saveWorkoutLog } from '../services/storage'
import BottomNav from '../components/BottomNav'

/* ── Portfolios ───────────────────────────────────────── */
const PORTFOLIOS = {
  dumbbell: {
    key: 'dumbbell',
    label: 'Dumbbell',
    icon: '🏋️',
    exercises: [
      { id: 1, name: 'Bicep Curls',      target_sets: 3, target_reps: 12, video_url: '/videos/Bicep-Curls.mp4' },
      { id: 2, name: 'Dumbbell Chest',   target_sets: 3, target_reps: 12, video_url: '/videos/Dumbbell-chest-press.mp4' },
      { id: 3, name: 'Dumbbell Rows',    target_sets: 3, target_reps: 10, video_url: '/videos/Dumbell-rows.mp4' },
      { id: 4, name: 'Shoulder Press',   target_sets: 3, target_reps: 12, video_url: '/videos/Shoulder-press.mp4' },
      { id: 5, name: 'Tricep Extension', target_sets: 3, target_reps: 10, video_url: '/videos/Tricep-extension.mp4' },
    ],
  },
  bodyweight: {
    key: 'bodyweight',
    label: 'Bodyweight',
    icon: '💪',
    exercises: [
      { id: 6,  name: 'Leg Jumps',            target_sets: 3, target_reps: 10, video_url: '/videos/leg-workout.mp4' },
      { id: 7,  name: 'Lateral Raises',        target_sets: 3, target_reps: 10, video_url: '/videos/Lateral-tricep.mp4' },
      { id: 8,  name: 'PushUp Chest',          target_sets: 3, target_reps: 10, video_url: '/videos/PushUp-chest.mp4' },
      { id: 9,  name: 'Tricep Pushups',        target_sets: 3, target_reps: 10, video_url: '/videos/Tricep-pushups.mp4' },
      { id: 10, name: 'Dips & Table Pull-Ups', target_sets: 3, target_reps: 10, video_url: '/videos/dips-tablePullUps.mp4' },
    ],
  },
}

/* ── PortfolioSwitcher ────────────────────────────────── */
function PortfolioSwitcher({ selected, onChange }) {
  return (
    <div className="portfolio-switcher">
      {Object.values(PORTFOLIOS).map(p => (
        <button
          key={p.key}
          className={`portfolio-pill ${selected === p.key ? 'pill-active' : ''}`}
          onClick={() => onChange(p.key)}
        >
          <span className="pill-icon">{p.icon}</span>
          <span className="pill-label">{p.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── SetTimer ─────────────────────────────────────────── */
function SetTimer({ isActive, onStop }) {
  const [seconds, setSeconds] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (isActive) {
      setSeconds(0)
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      clearInterval(ref.current)
    }
    return () => clearInterval(ref.current)
  }, [isActive])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className={`set-timer ${isActive ? 'timer-active' : ''}`}>
      <span className="timer-display">{mm}:{ss}</span>
      {isActive && (
        <button className="timer-stop-btn" onClick={() => onStop(seconds)}>STOP</button>
      )}
    </div>
  )
}

/* ── SetInput ─────────────────────────────────────────── */
function SetInput({ setNum, value, onChange, duration, onStartSet, onStopSet, isRunning }) {
  return (
    <div className={`set-block ${value ? 'set-done' : ''} ${isRunning ? 'set-running' : ''}`}>
      <div className="set-header">
        <span className="set-label">SET {String(setNum).padStart(2, '0')}</span>
        {value && <span className="set-check">✓</span>}
      </div>
      <input
        className="rep-input"
        type="number"
        min="0"
        placeholder="00"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      <span className="rep-unit">REPS</span>
      <div className="set-timer-row">
        <SetTimer isActive={isRunning} onStop={onStopSet} />
        {!isRunning && (
          <button className="start-set-btn" onClick={onStartSet}>▶ START</button>
        )}
      </div>
      {duration > 0 && <div className="set-duration">{duration}s logged</div>}
    </div>
  )
}

/* ── ExerciseCard ─────────────────────────────────────── */
function ExerciseCard({ exercise, portfolio, isActive, isCompleted, onComplete, onNext, isLast }) {
  const [sets, setSets] = useState({ set1: '', set2: '', set3: '' })
  const [durations, setDurations] = useState({ set1: 0, set2: 0, set3: 0 })
  const [runningSet, setRunningSet] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isActive])

  const handleStopSet = (key, secs) => {
    setDurations(prev => ({ ...prev, [key]: secs }))
    setRunningSet(null)
  }

  const allDone = sets.set1 && sets.set2 && sets.set3

  const handleSubmit = () => {
    saveWorkoutLog({
      exerciseId:   exercise.id,
      exerciseName: exercise.name,
      portfolio,
      set1:     parseInt(sets.set1) || 0,
      set2:     parseInt(sets.set2) || 0,
      set3:     parseInt(sets.set3) || 0,
      duration: durations.set1 + durations.set2 + durations.set3,
    })
    setSubmitted(true)
    onComplete()
  }

  return (
    <div
      ref={cardRef}
      className={`exercise-card ${isActive ? 'card-active' : ''} ${isCompleted || submitted ? 'card-done' : ''}`}
    >
      <div className="card-accent-bar" />

      <div className="card-top">
        <div className="exercise-meta">
          <span className="exercise-tag">
            {submitted || isCompleted ? 'COMPLETE' : isActive ? 'ACTIVE SESSION' : 'UPCOMING'}
          </span>
          <h2 className="exercise-name">{exercise.name}</h2>
          <p className="exercise-info">{exercise.target_sets} SETS × {exercise.target_reps} REPS</p>
        </div>

        <div className="video-wrapper">
          {exercise.video_url ? (
            <video key={exercise.video_url} controls>
              <source src={exercise.video_url} type="video/mp4" />
            </video>
          ) : (
            <div className="video-placeholder"><span>▶</span></div>
          )}
        </div>
      </div>

      <div className="sets-row">
        {['set1', 'set2', 'set3'].map((key, i) => (
          <SetInput
            key={key}
            setNum={i + 1}
            value={sets[key]}
            onChange={val => setSets(prev => ({ ...prev, [key]: val }))}
            duration={durations[key]}
            isRunning={runningSet === key}
            onStartSet={() => setRunningSet(key)}
            onStopSet={secs => handleStopSet(key, secs)}
          />
        ))}
      </div>

      <div className="card-footer">
        {!submitted ? (
          <button
            className={`submit-btn ${allDone ? 'submit-ready' : ''}`}
            disabled={!allDone}
            onClick={handleSubmit}
          >
            {allDone ? 'LOG WORKOUT' : 'COMPLETE ALL SETS'}
          </button>
        ) : (
          <div className="submitted-badge">✓ LOGGED</div>
        )}
        {(submitted || isCompleted) && !isLast && (
          <button className="next-btn" onClick={onNext}>NEXT EXERCISE →</button>
        )}
      </div>
    </div>
  )
}

/* ── Dashboard (default export) ───────────────────────── */
export default function Dashboard() {
  const [selectedPortfolio, setSelectedPortfolio] = useState('dumbbell')
  const [activeIndex, setActiveIndex]             = useState(0)
  const [completed, setCompleted]                 = useState(new Set())

  // Derive exercises from the active portfolio
  const exercises = PORTFOLIOS[selectedPortfolio].exercises

  // Reset session state whenever the portfolio changes
  const handlePortfolioChange = (key) => {
    setSelectedPortfolio(key)
    setActiveIndex(0)
    setCompleted(new Set())
  }

  const markComplete = i => setCompleted(prev => new Set([...prev, i]))
  const goNext       = i => { if (i + 1 < exercises.length) setActiveIndex(i + 1) }

  const pct = exercises.length ? (completed.size / exercises.length) * 100 : 0

  return (
    <div className="dash-shell">

      {/* ── Mobile top bar (hidden on desktop via CSS) ── */}
      <div className="mobile-topbar">
        <div className="mtb-brand">
          <span className="mtb-name">KINETIC</span>
          <span className="mtb-sub">PRECISION</span>
        </div>
        <div className="mtb-progress">
          <span className="mtb-count">{completed.size}</span>
          <span className="mtb-sep">/</span>
          <span className="mtb-total">{exercises.length}</span>
        </div>
      </div>

      {/* ── Sidebar (desktop only) ── */}
      <aside className="sidebar">
        <div className="brand">KINETIC<br /><span>PRECISION</span></div>
        <nav className="sidebar-nav">
          {['DASHBOARD', 'WORKOUTS', 'METRICS', 'RECOVERY', 'SETTINGS'].map(item => (
            <a
              key={item}
              href={item === 'METRICS' ? '/Tracker' : '#'}
              className={`nav-item ${item === 'DASHBOARD' ? 'active' : ''}`}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="session-progress">
          <div className="progress-label">SESSION PROGRESS</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-count">{completed.size} / {exercises.length}</div>
        </div>
      </aside>

      {/* ── Circuit panel (vertical on desktop, horizontal strip on mobile) ── */}
      <div className="circuit-panel">
        <div className="circuit-title">WORKOUT CIRCUIT</div>
        <ul className="circuit-list">
          {exercises.map((ex, i) => (
            <li
              key={ex.id}
              className={`circuit-item ${i === activeIndex ? 'circuit-active' : ''} ${completed.has(i) ? 'circuit-done' : ''}`}
              onClick={() => setActiveIndex(i)}
            >
              <span className="circuit-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="circuit-info">
                {i === activeIndex && <span className="circuit-tag">ACTIVE SESSION</span>}
                <span className="circuit-name">{ex.name}</span>
              </div>
              <div className={`circuit-dot ${completed.has(i) ? 'dot-done' : ''}`}>
                {completed.has(i) ? '✓' : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Cards area ── */}
      <div className="cards-area">
        <div className="session-header">
          <span className="session-tag">ATHLETE_01 · ELITE_STATUS</span>
          <h1 className="session-title">TODAY'S CIRCUIT</h1>
          <PortfolioSwitcher selected={selectedPortfolio} onChange={handlePortfolioChange} />
        </div>

        <div className="cards-stack">
          {exercises.map((ex, i) => (
            <ExerciseCard
              key={`${selectedPortfolio}-${ex.id}`}
              exercise={ex}
              portfolio={selectedPortfolio}
              isActive={i === activeIndex}
              isCompleted={completed.has(i)}
              isLast={i === exercises.length - 1}
              onComplete={() => markComplete(i)}
              onNext={() => goNext(i)}
            />
          ))}
        </div>

        {completed.size === exercises.length && exercises.length > 0 && (
          <div className="session-complete">
            <div className="complete-label">SESSION COMPLETE</div>
            <div className="complete-title">CIRCUIT FINISHED</div>
          </div>
        )}
      </div>

      {/* ── Floating next ── */}
      {activeIndex < exercises.length - 1 && completed.has(activeIndex) && (
        <button className="floating-next" onClick={() => goNext(activeIndex)}>
          NEXT EXERCISE →
        </button>
      )}

      {/* ── Bottom nav (mobile only, hidden on desktop via CSS) ── */}
      <BottomNav />
    </div>
  )
}
