'use client'

let cachedScore = 0

export const getStoredScore = (): number => {
  if (typeof window === 'undefined') return cachedScore
  try {
    const raw = localStorage.getItem('hyblock-last-score')
    if (!raw) return cachedScore
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : cachedScore
  } catch {
    return cachedScore
  }
}

export const setStoredScore = (score: number) => {
  cachedScore = score
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('hyblock-last-score', String(score))
  } catch {
    // ignore
  }
}

export const clearStoredScore = () => {
  cachedScore = 0
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('hyblock-last-score')
  } catch {
    // ignore
  }
}
