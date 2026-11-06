import { useState, useEffect } from 'react'

const BREAKPOINT = 768

/**
 * Returns true when the viewport width is <= 768px.
 * Updates reactively on resize / orientation change.
 * Phase 4: also returns true when running inside Capacitor Android.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= BREAKPOINT
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

