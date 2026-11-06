/**
 * storage.js — local workout log persistence
 *
 * Uses localStorage now.
 * When Capacitor is added (Phase 4), swap each
 * localStorage.getItem / setItem call to
 * @capacitor/preferences — the shape stays identical.
 */

const STORAGE_KEY = 'kinetic_workout_logs'

/* ── Helpers ──────────────────────────────────────────── */

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Returns "YYYY-MM-DD" for today in local time. */
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Returns "YYYY-MM-DD" for an arbitrary Date object. */
function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ── Core CRUD ────────────────────────────────────────── */

/**
 * Returns every stored log entry, sorted oldest → newest.
 * Shape of each entry:
 * {
 *   id, exercise_id, exercise_name, portfolio,
 *   date,          // "YYYY-MM-DD"
 *   set1, set2, set3,
 *   total_reps,    // set1+set2+set3
 *   duration,      // seconds
 *   logged_at,     // ISO timestamp
 * }
 */
export function getAllLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function _saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

/**
 * Persist one exercise set log to storage.
 * @param {object} opts
 * @param {number} opts.exerciseId
 * @param {string} opts.exerciseName
 * @param {string} opts.portfolio  - 'dumbbell' | 'bodyweight'
 * @param {number} opts.set1
 * @param {number} opts.set2
 * @param {number} opts.set3
 * @param {number} opts.duration   - total seconds across all sets
 * @returns {object} the saved entry
 */
export function saveWorkoutLog({ exerciseId, exerciseName, portfolio, set1, set2, set3, duration }) {
  const s1 = set1 || 0
  const s2 = set2 || 0
  const s3 = set3 || 0
  const entry = {
    id:            uid(),
    exercise_id:   exerciseId,
    exercise_name: exerciseName,
    portfolio,
    date:          todayStr(),
    set1: s1, set2: s2, set3: s3,
    total_reps:    s1 + s2 + s3,
    duration:      duration || 0,
    logged_at:     new Date().toISOString(),
  }
  const logs = getAllLogs()
  logs.push(entry)
  _saveLogs(logs)
  return entry
}

/** Returns all logs for a specific exercise ID. */
export function getLogsForExercise(exerciseId) {
  return getAllLogs().filter(l => l.exercise_id === exerciseId)
}

/** Dev utility — wipes all stored logs. */
export function clearLogs() {
  localStorage.removeItem(STORAGE_KEY)
}

/* ── Tracker Aggregations ─────────────────────────────── */

/**
 * Returns an array of 7 numbers (Mon=0 … Sun=6) representing
 * total reps logged each day during the current calendar week.
 */
export function getThisWeekVolume() {
  const logs  = getAllLogs()
  const now   = new Date()
  const dow   = now.getDay()                          // 0=Sun
  const toMon = dow === 0 ? -6 : 1 - dow             // days to subtract to reach Mon
  const monday = new Date(now)
  monday.setDate(now.getDate() + toMon)
  monday.setHours(0, 0, 0, 0)

  const volume = Array(7).fill(0)
  logs.forEach(log => {
    // Parse date without timezone shift
    const [y, m, d] = log.date.split('-').map(Number)
    const logDate = new Date(y, m - 1, d)
    const diff = Math.round((logDate - monday) / 86400000)
    if (diff >= 0 && diff < 7) {
      volume[diff] += log.total_reps
    }
  })
  return volume
}

/**
 * Returns the last `days` days (default 35) as intensity strings
 * for the consistency heat-map, oldest first.
 * 'high' = >30 total reps, 'mid' = >15, 'low' = >0, 'none' = rest day.
 */
export function getConsistencyGrid(days = 35) {
  const logs = getAllLogs()

  // Build date → total reps map
  const repsByDate = {}
  logs.forEach(log => {
    repsByDate[log.date] = (repsByDate[log.date] || 0) + log.total_reps
  })

  const result = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = dateStr(d)
    const reps = repsByDate[key] || 0
    if      (reps > 30) result.push('high')
    else if (reps > 15) result.push('mid')
    else if (reps > 0)  result.push('low')
    else                result.push('none')
  }
  return result
}

/**
 * Returns the current Mon–Sun week as 7 day objects:
 * { day: 'MON', date: 5, hasLog: true, active: false }
 * `active` = today.
 */
export function getThisWeekDays() {
  const logs    = getAllLogs()
  const logDates = new Set(logs.map(l => l.date))

  const now    = new Date()
  const dow    = now.getDay()
  const toMon  = dow === 0 ? -6 : 1 - dow
  const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  // today's index in Mon-indexed week (0=Mon…6=Sun)
  const todayIdx = dow === 0 ? 6 : dow - 1

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() + toMon + i)
    return {
      day:    DAY_NAMES[i],
      date:   d.getDate(),
      hasLog: logDates.has(dateStr(d)),
      active: i === todayIdx,
    }
  })
}

/**
 * Returns the N most-recent unique workout days as session summaries
 * for the Recent Logs panel.
 */
export function getRecentSessions(limit = 5) {
  const logs = getAllLogs()
  if (!logs.length) return []

  // Group by date
  const byDate = {}
  logs.forEach(log => {
    if (!byDate[log.date]) byDate[log.date] = []
    byDate[log.date].push(log)
  })

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  const now       = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const todayKey     = todayStr()
  const yesterdayKey = dateStr(yesterday)

  return sortedDates.slice(0, limit).map(date => {
    const dayLogs      = byDate[date]
    const totalReps    = dayLogs.reduce((s, l) => s + l.total_reps, 0)
    const totalDurSec  = dayLogs.reduce((s, l) => s + l.duration, 0)
    const portfolio    = dayLogs[dayLogs.length - 1].portfolio  // last logged portfolio

    // Human-readable date label
    let timeLabel
    if (date === todayKey)     timeLabel = 'Today'
    else if (date === yesterdayKey) timeLabel = 'Yesterday'
    else {
      const [y, m, d] = date.split('-').map(Number)
      timeLabel = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short',
      })
    }

    // Intensity 1–5 based on total reps (5 = >60 reps)
    const intensity = Math.min(5, Math.max(1, Math.ceil(totalReps / 15)))

    return {
      id:        date,
      icon:      portfolio === 'dumbbell' ? '🏋️' : '💪',
      name:      portfolio === 'dumbbell' ? 'DUMBBELL CIRCUIT' : 'BODYWEIGHT CIRCUIT',
      time:      timeLabel,
      duration:  Math.max(1, Math.round(totalDurSec / 60)),  // minutes
      totalReps,
      intensity,
    }
  })
}

/**
 * Returns live stats for the sidebar / stats cards:
 * { weekStreak, daysLoggedThisWeek, totalRepsToday, totalDurToday }
 */
export function getLiveStats() {
  const logs        = getAllLogs()
  const todayKey    = todayStr()

  const todayLogs   = logs.filter(l => l.date === todayKey)
  const totalRepsToday = todayLogs.reduce((s, l) => s + l.total_reps, 0)
  const totalDurToday  = todayLogs.reduce((s, l) => s + l.duration, 0)

  // Consecutive days logged (ending today or yesterday)
  const logDates  = [...new Set(logs.map(l => l.date))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  const cursor = new Date()
  for (const ld of logDates) {
    const expected = dateStr(cursor)
    if (ld === expected) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      // Allow one gap if streak is 0 (today might not be done yet)
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1)
        if (ld === dateStr(cursor)) { streak++; cursor.setDate(cursor.getDate() - 1) }
        else break
      } else {
        break
      }
    }
  }

  // Days logged this week
  const now    = new Date()
  const dow    = now.getDay()
  const toMon  = dow === 0 ? -6 : 1 - dow
  let daysThisWeek = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + toMon + i)
    if (logDates.includes(dateStr(d))) daysThisWeek++
  }

  return { streak, daysThisWeek, totalRepsToday, totalDurToday }
}

