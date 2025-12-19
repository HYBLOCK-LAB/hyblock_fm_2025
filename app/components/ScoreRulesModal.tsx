'use client'

import { ReactNode } from 'react'

interface ScoreRulesModalProps {
  open: boolean
  onClose: () => void
  footer?: ReactNode
}

export default function ScoreRulesModal({ open, onClose, footer }: ScoreRulesModalProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="title-3" style={{ margin: 0 }}>Score rules</h3>
          <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={onClose}>
            Close
          </button>
        </div>
        <div className="body-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <strong>Players</strong>
            <ul className="text-secondary" style={{ margin: '6px 0 0 16px', padding: 0, listStyle: 'disc' }}>
              <li>Correct answer: +7 points</li>
              <li>Wrong answer: +3 points</li>
            </ul>
          </div>
          <div>
            <strong>Creators (per revealed question)</strong>
            <ul className="text-secondary" style={{ margin: '6px 0 0 16px', padding: 0, listStyle: 'disc' }}>
              <li>Balanced reveal (40-70% correct, or tie): +10 points</li>
              <li>Correct &gt; Wrong (outside band): +6 points</li>
              <li>Wrong &gt; Correct: +4 points</li>
            </ul>
          </div>
          <div className="caption text-tertiary">
            Scores are applied when answers are revealed on-chain. Only revealed questions affect totals.
          </div>
          {footer}
        </div>
      </div>
    </div>
  )
}
