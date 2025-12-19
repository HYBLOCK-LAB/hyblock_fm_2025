'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import Swal from 'sweetalert2'
import Card from './ui/Card'
import Button from './ui/Button'
import { QuizGameContract } from '../lib/contract'

interface CreateQuestionFormProps {
  contract: QuizGameContract | null
  account: string | null
}

export default function CreateQuestionForm({ contract, account }: CreateQuestionFormProps) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successSalt, setSuccessSalt] = useState<string | null>(null)
  const [successHash, setSuccessHash] = useState<string | null>(null)

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessSalt(null)
    setSuccessHash(null)

    if (!contract) {
      setError('Connect your wallet to add a question.')
      return
    }

    if (!account) {
      setError('Wallet address not found. Please reconnect.')
      return
    }

    if (!questionText.trim()) {
      setError('Question text is required.')
      return
    }

    if (options.some((opt) => !opt.trim())) {
      setError('All four options are required.')
      return
    }

    if (correctAnswer < 0 || correctAnswer > 3) {
      setError('정답은 Option 1~4 중에서 선택해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      const saltBytes = ethers.zeroPadValue(account, 32) // deterministic salt from creator address
      const saltHex = ethers.hexlify(saltBytes)
      const answerHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['uint8', 'bytes32'], [correctAnswer, saltBytes])
      )

      await contract.addQuestion(
        questionText.trim(),
        options.map((opt) => opt.trim()) as [string, string, string, string],
        answerHash
      )

      setSuccessSalt(saltHex)
      setSuccessHash(answerHash)
      setQuestionText('')
      setOptions(['', '', '', ''])
      setCorrectAnswer(0)
      Swal.fire({
        icon: 'success',
        title: 'Question created',
        text: 'Quiz question has been committed on-chain. Save the salt to reveal later.',
        confirmButtonColor: '#0066ff',
        background: '#0f1118',
        color: '#ffffff',
      })
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Failed to add question.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="registration-card" style={{ maxWidth: 900, margin: '24px auto' }}>
      <div style={{ marginBottom: 12 }}>
        <div className="overline text-tertiary">Create</div>
        <h2 className="title-2" style={{ margin: '4px 0 8px' }}>Add a new quiz question</h2>
        <p className="body-2 text-secondary" style={{ margin: 0 }}>
          Commit the correct answer with a random salt. Keep the salt safe to reveal later.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="body-2">
          Question
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question"
            style={{ width: '100%', marginTop: 6, padding: 12, minHeight: 90 }}
            required
          />
        </label>

        <div className="option-grid">
          {options.map((opt, idx) => (
            <label key={idx} className="body-2" style={{ display: 'block' }}>
              Option {idx + 1}
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                style={{ width: '100%', marginTop: 6, padding: 10 }}
                required
              />
            </label>
          ))}
        </div>

        <label className="body-2" style={{ maxWidth: 260 }}>
          Correct answer
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6, padding: 10 }}
          >
            {[0,1,2,3].map((idx) => (
              <option key={idx} value={idx}>
                Option {idx + 1}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <div className="error" style={{ marginTop: 4 }}>
            {error}
          </div>
        )}

        {successSalt && successHash && (
          <Card className="registration-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="title-3" style={{ marginBottom: 8 }}>Saved values</div>
            <div className="caption text-tertiary" style={{ marginBottom: 4 }}>Salt (keep this safe for reveal):</div>
            <div className="mono" style={{ wordBreak: 'break-all', marginBottom: 10 }}>{successSalt}</div>
            <div className="caption text-tertiary" style={{ marginBottom: 4 }}>Answer hash:</div>
            <div className="mono" style={{ wordBreak: 'break-all' }}>{successHash}</div>
          </Card>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <Button type="submit" variant="primary" disabled={isSubmitting || !contract}>
            {isSubmitting ? 'Submitting...' : 'Submit question'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
