import { useState, useEffect, useRef } from 'react'
import './App.css'

const MOCK_EXERCISES = [
  { id: 1, name: 'Dumbbell Rows',    target_sets: 3, target_reps: 12, video_url: '' },
  { id: 2, name: 'Dumbbell Chest Press',        target_sets: 3, target_reps: 12, video_url: '' },
  { id: 3, name: 'Shoulder Press',  target_sets: 3, target_reps: 10, video_url: '' },
  { id: 4, name: 'Biceps Curls',       target_sets: 3, target_reps: 12, video_url: '' },
  { id: 5, name: 'Tricep Extension',     target_sets: 3, target_reps: 10, video_url: '' },
]

// const [MOCK_EXERCISES, setExercises] = useState([]);

//   useEffect(() => {
//     fetch('http://127.0.0.1:5000/exercises')
//       .then(res => res.json())
//       .then(data => setExercises(data))
//       .catch(error => console.error('Error fetching data:', error));
//   }, []);


function SetTimer({ isActive, onStop }) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isActive) {
      setSeconds(0)
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <div className={`set-timer ${isActive ? 'timer-active' : ''}`}>
      <span className="timer-display">{mins}:{secs}</span>
      {isActive && (
        <button className="timer-stop-btn" onClick={() => onStop(seconds)}>
          STOP
        </button>
      )}
    </div>
  )
}

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
        {!isRunning ? (
          <button className="start-set-btn" onClick={onStartSet}>
            ▶ START
          </button>
        ) : null}
      </div>

      {duration > 0 && (
        <div className="set-duration">{duration}s logged</div>
      )}
    </div>
  )
}

function ExerciseCard({ exercise, isActive, isCompleted, onComplete, onNext, isLast }) {
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

  const handleStartSet = (setKey) => {
    setRunningSet(setKey)
  }

  const handleStopSet = (setKey, elapsedSeconds) => {
    setDurations(prev => ({ ...prev, [setKey]: elapsedSeconds }))
    setRunningSet(null)
  }

  const allSetsCompleted = sets.set1 && sets.set2 && sets.set3

  const handleSubmit = async () => {
    try {
      await fetch('http://127.0.0.1:5000/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exercise.id,
          set1: parseInt(sets.set1) || 0,
          set2: parseInt(sets.set2) || 0,
          set3: parseInt(sets.set3) || 0,
          duration: durations.set1 + durations.set2 + durations.set3
        })
      })
    } catch (err) {
      console.warn('Backend unavailable, logging locally only.')
    }
    setSubmitted(true)
    onComplete()
  }

  return (
    <div
      ref={cardRef}
      className={`exercise-card ${isActive ? 'card-active' : ''} ${isCompleted ? 'card-completed' : ''} ${submitted ? 'card-submitted' : ''}`}
    >
      <div className="card-accent-bar" />

      <div className="card-top">
        <div className="exercise-meta">
          <span className="exercise-tag">
            {isCompleted ? 'COMPLETE' : isActive ? 'ACTIVE SESSION' : 'UPCOMING'}
          </span>
          <h2 className="exercise-name">{exercise.name}</h2>
          <p className="exercise-info">
            {exercise.target_sets} SETS × {exercise.target_reps} REPS
          </p>
        </div>

        <div className="video-wrapper">
          {exercise.video_url ? (
            <video controls>
              <source src={exercise.video_url} type="video/mp4" />
            </video>
          ) : (
            <div className="video-placeholder">
              <span>▶</span>
            </div>
          )}
        </div>
      </div>

      <div className="sets-row">
        {['set1', 'set2', 'set3'].map((setKey, i) => (
          <SetInput
            key={setKey}
            setNum={i + 1}
            value={sets[setKey]}
            onChange={val => setSets(prev => ({ ...prev, [setKey]: val }))}
            duration={durations[setKey]}
            isRunning={runningSet === setKey}
            onStartSet={() => handleStartSet(setKey)}
            onStopSet={(secs) => handleStopSet(setKey, secs)}
          />
        ))}
      </div>

      <div className="card-footer">
        {!submitted ? (
          <button
            className={`submit-btn ${allSetsCompleted ? 'submit-ready' : ''}`}
            disabled={!allSetsCompleted}
            onClick={handleSubmit}
          >
            {allSetsCompleted ? 'LOG WORKOUT' : 'COMPLETE ALL SETS'}
          </button>
        ) : (
          <div className="submitted-badge">✓ LOGGED</div>
        )}

        {(submitted || isCompleted) && !isLast && (
          <button className="next-btn" onClick={onNext}>
            NEXT EXERCISE →
          </button>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [exercises, setExercises] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [completedIndexes, setCompletedIndexes] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://127.0.0.1:5000/exercises')
      .then(res => res.json())
      .then(data => {
        setExercises(Array.isArray(data) && data.length ? data : MOCK_EXERCISES)
        setLoading(false)
      })
      .catch(() => {
        setExercises(MOCK_EXERCISES)
        setLoading(false)
      })
  }, [])

  const handleComplete = (index) => {
    setCompletedIndexes(prev => new Set([...prev, index]))
  }

  const handleNext = (index) => {
    const next = index + 1
    if (next < exercises.length) {
      setActiveIndex(next)
    }
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-text">LOADING PROTOCOL...</div>
    </div>
  )

  const totalCompleted = completedIndexes.size
  const progressPct = exercises.length ? (totalCompleted / exercises.length) * 100 : 0

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">KINETIC<br /><span>PRECISION</span></div>

        <nav className="sidebar-nav">
          <a className="nav-item active">DASHBOARD</a>
          <a className="nav-item">WORKOUTS</a>
          <a className="nav-item">METRICS</a>
          <a className="nav-item">RECOVERY</a>
          <a className="nav-item">SETTINGS</a>
        </nav>

        <div className="session-progress">
          <div className="progress-label">SESSION PROGRESS</div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-count">{totalCompleted} / {exercises.length}</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Circuit timeline */}
        <div className="circuit-panel">
          <div className="circuit-title">WORKOUT CIRCUIT</div>
          <ul className="circuit-list">
            {exercises.map((ex, i) => (
              <li
                key={ex.id}
                className={`circuit-item ${i === activeIndex ? 'circuit-active' : ''} ${completedIndexes.has(i) ? 'circuit-done' : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                <span className="circuit-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="circuit-info">
                  {i === activeIndex && <span className="circuit-tag">ACTIVE SESSION</span>}
                  <span className="circuit-name">{ex.name}</span>
                </div>
                <div className={`circuit-dot ${completedIndexes.has(i) ? 'dot-done' : ''}`}>
                  {completedIndexes.has(i) ? '✓' : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Exercise cards */}
        <div className="cards-area">
          <div className="session-header">
            <span className="session-tag">ATHLETE_01 · ELITE_STATUS</span>
            <h1 className="session-title">TODAY'S CIRCUIT</h1>
          </div>

          <div className="cards-stack">
            {exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                isActive={i === activeIndex}
                isCompleted={completedIndexes.has(i)}
                isLast={i === exercises.length - 1}
                onComplete={() => handleComplete(i)}
                onNext={() => handleNext(i)}
              />
            ))}
          </div>

          {completedIndexes.size === exercises.length && exercises.length > 0 && (
            <div className="session-complete">
              <div className="complete-label">SESSION COMPLETE</div>
              <div className="complete-title">CIRCUIT FINISHED</div>
            </div>
          )}
        </div>
      </main>

      {/* Floating next button */}
      {activeIndex < exercises.length - 1 && completedIndexes.has(activeIndex) && (
        <button className="floating-next" onClick={() => handleNext(activeIndex)}>
          NEXT EXERCISE →
        </button>
      )}
    </div>
  )
}
