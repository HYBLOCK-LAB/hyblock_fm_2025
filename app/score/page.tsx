'use client'

import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import ScoreRulesModal from '../components/ScoreRulesModal'
import { AnsweredRow, CreatedRow, fetchScoreBreakdown, scoreRuleCopy } from '../lib/score'
import Header from '../components/Header'
import { clearStoredScore, getStoredScore, setStoredScore } from '../lib/scoreStore'

type AccountState = 'idle' | 'connecting' | 'connected' | 'error'

const formatOption = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '—'
  return `Option ${value + 1}`
}

const formatQuestion = (text: string) => (text.length > 80 ? `${text.slice(0, 80)}...` : text)

const formatBand = (row: CreatedRow) => {
  if (!row.isRevealed) return 'Pending reveal'
  if (row.correctAnswer === null) return 'Reveal missing'
  const total = row.correctCount + row.wrongCount
  if (total === 0) return 'No submissions'
  const ratio = Math.round((row.correctCount * 100) / total)
  return `${ratio}% correct`
}

const AnsweredTable = ({ rows }: { rows: AnsweredRow[] }) => (
  <div className="table-wrapper">
    <table className="score-table">
      <thead>
        <tr>
          <th style={{ width: 90 }}>Question</th>
          <th>Text</th>
          <th style={{ width: 140 }}>My answer</th>
          <th style={{ width: 150 }}>Correct answer</th>
          <th style={{ width: 120 }}>Status</th>
          <th style={{ width: 90, textAlign: 'right' }}>Points</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', padding: '18px 0', color: '#9ca3af' }}>
              No answered questions yet.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.questionId}>
              <td>#{row.questionId + 1}</td>
              <td className="text-ellipsis">{formatQuestion(row.questionText)}</td>
              <td>{formatOption(row.myAnswer)}</td>
              <td>{row.isRevealed ? formatOption(row.correctAnswer) : 'Pending reveal'}</td>
              <td>{row.isRevealed ? 'Revealed' : 'Waiting'}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.earned}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

const CreatedTable = ({ rows }: { rows: CreatedRow[] }) => (
  <div className="table-wrapper">
    <table className="score-table">
      <thead>
        <tr>
          <th style={{ width: 90 }}>Question</th>
          <th>Text</th>
          <th style={{ width: 120 }}>Status</th>
          <th style={{ width: 150 }}>Reveal ratio</th>
          <th style={{ width: 150 }}>Correct / Wrong</th>
          <th style={{ width: 90, textAlign: 'right' }}>Points</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', padding: '18px 0', color: '#9ca3af' }}>
              No created questions yet.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.questionId}>
              <td>#{row.questionId + 1}</td>
              <td className="text-ellipsis">{formatQuestion(row.questionText)}</td>
              <td>{row.isRevealed ? 'Revealed' : 'Waiting'}</td>
              <td>{formatBand(row)}</td>
              <td>
                {row.correctCount} / {row.wrongCount}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.earned}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

export default function ScorePage() {
  const [account, setAccount] = useState<string>('')
  const [status, setStatus] = useState<AccountState>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answered, setAnswered] = useState<AnsweredRow[]>([])
  const [created, setCreated] = useState<CreatedRow[]>([])
  const [showRules, setShowRules] = useState(false)
  const [totalScore, setTotalScore] = useState(getStoredScore())

  const connect = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('Please install MetaMask.')
      return
    }
    try {
      setStatus('connecting')
      const accounts: string[] = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
      const addr = accounts?.[0]
      if (!addr) throw new Error('Unable to fetch wallet address.')
      setAccount(addr)
      setStatus('connected')
      setError(null)
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setError(err?.message || 'Failed to connect wallet.')
    }
  }

  const loadScores = async (addr: string) => {
    setLoading(true)
    setError(null)
    try {
      const { answered, created, totalScore } = await fetchScoreBreakdown(addr)
      setAnswered(answered)
      setCreated(created)
      setTotalScore(totalScore)
      setStoredScore(totalScore)
    } catch (err: any) {
      console.error('Failed to load score breakdown', err)
      setError(err?.message || 'Failed to load scores.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    setAccount('')
    setAnswered([])
    setCreated([])
    setTotalScore(0)
    setStatus('idle')
    setError(null)
    clearStoredScore()
  }

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return
      try {
        const accounts: string[] = await (window as any).ethereum.request({ method: 'eth_accounts' })
        const addr = accounts?.[0]
        if (addr) {
          setAccount(addr)
          setStatus('connected')
        }
      } catch {
        // ignore
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (account) {
      loadScores(account)
    }
  }, [account])

  useEffect(() => {
    const sync = () => setTotalScore(getStoredScore())
    sync()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', sync)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', sync)
      }
    }
  }, [])

  return (
    <div className="page-container">
      <Header
        isConnected={!!account}
        account={account}
        onConnect={connect}
        onDisconnect={handleDisconnect}
      />
      <main className="main-content">
        <div className="container">
          <section style={{ padding: '36px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 className="hero-title" style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 8 }}>
                 Your Score: {totalScore} 
                </h1>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={() => setShowRules(true)} style={{ whiteSpace: 'nowrap' }}>
                  View rules
                </Button>
                <Button variant="primary" onClick={account ? () => loadScores(account) : connect} disabled={loading}>
                  {account ? (loading ? 'Loading...' : 'Refresh') : 'Connect wallet'}
                </Button>
              </div>
            </div>
            {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
            {!account && (
              <div className="info-banner">
                Connect your wallet to view your score history.
              </div>
            )}
          </section>

          <section style={{ marginTop: 10 }}>
            <h3 className="title-3" style={{ marginBottom: 8 }}>Questions I answered</h3>
            <AnsweredTable rows={answered} />
          </section>

          <section style={{ marginTop: 28 }}>
            <h3 className="title-3" style={{ marginBottom: 8 }}>Questions I created</h3>
            <CreatedTable rows={created} />
          </section>
        </div>
      </main>

      <ScoreRulesModal open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}
