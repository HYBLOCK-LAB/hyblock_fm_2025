'use client'

import { useEffect, useState } from 'react'
import LeaderboardTable from '../components/LeaderboardTable'
import { fetchLeaderboard, LeaderboardEntry } from '../lib/leaderboard'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchLeaderboard()
      setEntries(data)
    } catch (err: any) {
      console.error('Failed to load leaderboard', err)
      setError(err?.message || '리더보드를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="page-container">
      <main className="main-content">
        <div className="container">
          <section className="hero-section" style={{ padding: '60px 0 30px' }}>
            <div className="hero-content" style={{ maxWidth: 720 }}>
              <div className="hero-badge">
                <span className="hero-badge-text">On-chain Leaderboard</span>
              </div>
              <h1 className="hero-title" style={{ fontSize: 'clamp(32px, 6vw, 52px)' }}>
                HyBlock Leaderboard
              </h1>
              <p className="hero-description">
                View top players by reading on-chain events and scores. No login required.
              </p>
            </div>
          </section>

          <LeaderboardTable entries={entries} isLoading={isLoading} error={error} onRefresh={load} />
        </div>
      </main>
    </div>
  )
}
