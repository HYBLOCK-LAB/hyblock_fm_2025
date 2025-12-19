'use client'

import { useState } from 'react'
import Card from './ui/Card'
import { InfoIcon, TrophyIcon } from './icons'
import { LeaderboardEntry } from '../lib/leaderboard'
import ScoreRulesModal from './ScoreRulesModal'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

const medalColors = ['#facc15', '#e5e7eb', '#f97316'] // gold, silver, bronze

export default function LeaderboardTable({ entries, isLoading, error, onRefresh }: LeaderboardTableProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <Card className="registration-card" style={{ maxWidth: 900, margin: '24px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div className="overline text-tertiary">LEADERBOARD</div>
          <h2 className="title-2" style={{ margin: '6px 0' }}>Top Players</h2>
          <p className="body-2 text-secondary" style={{ margin: 0 }}>
            Reads contract data without login. Network latency may apply.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowTooltip(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <InfoIcon size={16} />
            Score rules
          </button>
          <button className="btn-secondary" onClick={onRefresh} disabled={isLoading} style={{ whiteSpace: 'nowrap' }}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1.2fr', padding: '12px 16px', color: '#9ca3af' }}>
          <div>Rank</div>
          <div>Player</div>
          <div style={{ textAlign: 'right' }}>Score</div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {isLoading ? (
            <div className="loading" style={{ padding: '32px 0' }}>
              <div className="spinner"></div>
              <span style={{ marginLeft: 12 }}>Loading...</span>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '24px 16px', color: '#9ca3af' }}>No players registered yet.</div>
          ) : (
            entries.map((entry, idx) => {
              const isTop3 = idx < 3
              return (
                <div
                  key={entry.address}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 2fr 1.2fr',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: isTop3 ? 'rgba(255,255,255,0.03)' : 'transparent',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isTop3 ? (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: medalColors[idx],
                          color: '#0b0b0f',
                          fontWeight: 700
                        }}
                      >
                        {idx + 1}
                      </div>
                    ) : (
                      <span className="title-3">{idx + 1}</span>
                    )}
                    {isTop3 && <TrophyIcon size={18} className="score-icon" />}
                  </div>
                  <div>
                    <div className="title-3">{entry.name || 'Unnamed'}</div>
                    <div className="caption text-tertiary mono" style={{ wordBreak: 'break-all' }}>
                      {entry.address}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                    {entry.score}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <ScoreRulesModal open={showTooltip} onClose={() => setShowTooltip(false)} />
    </Card>
  )
}
