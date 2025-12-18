'use client'

import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { QuizGameContract } from '../lib/contract'
import Card from './ui/Card'
import Button from './ui/Button'

interface AdminQuestionFormProps {
  contract: QuizGameContract
}

// 32-byte 랜덤 salt 생성
const generateSalt = () => ethers.hexlify(ethers.randomBytes(32))

export default function AdminQuestionForm({ contract }: AdminQuestionFormProps) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [salt, setSalt] = useState<string>(generateSalt())
  const [revealNow, setRevealNow] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextQuestionId, setNextQuestionId] = useState<number | null>(null)

  // 미리 다음 questionId를 보여준다.
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await contract.getQuestionCount()
        setNextQuestionId(Number(count))
      } catch (err) {
        console.error('Failed to load question count', err)
      }
    }
    fetchCount()
  }, [contract])

  const formattedSalt = useMemo(() => {
    if (!salt.startsWith('0x')) return `0x${salt}`
    return salt
  }, [salt])

  const handleOptionChange = (index: number, value: string) => {
    setOptions(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const resetForm = (nextId?: number) => {
    setQuestionText('')
    setOptions(['', '', '', ''])
    setCorrectAnswer(0)
    setSalt(generateSalt())
    setRevealNow(true)
    if (typeof nextId === 'number') {
      setNextQuestionId(nextId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('')

    if (!questionText.trim()) {
      setError('문제를 입력해주세요.')
      return
    }
    if (options.some(opt => !opt.trim())) {
      setError('모든 보기(4개)를 입력해주세요.')
      return
    }
    if (correctAnswer < 0 || correctAnswer > 3) {
      setError('정답 인덱스는 0~3이어야 합니다.')
      return
    }
    if (formattedSalt.length !== 66) {
      setError('salt는 32바이트(0x 포함 66자) 헥사 문자열이어야 합니다.')
      return
    }

    try {
      setIsSubmitting(true)
      const answerHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['uint8', 'bytes32'], [correctAnswer, formattedSalt])
      )

      // 현재 questionCount가 곧 신규 questionId
      const currentCount = await contract.getQuestionCount()
      const newQuestionId = Number(currentCount)

      const tx = await contract.addQuestion(
        questionText.trim(),
        options as [string, string, string, string],
        answerHash
      )
      await tx.wait()

      if (revealNow) {
        const revealTx = await contract.revealAnswer(newQuestionId, correctAnswer, formattedSalt)
        await revealTx.wait()
      }

      setStatus(
        `문제 #${newQuestionId + 1} 등록${revealNow ? ' 및 공개' : ''} 완료. salt를 안전하게 보관하세요: ${formattedSalt}`
      )
      resetForm(newQuestionId + 1)
    } catch (err: any) {
      console.error('Failed to add question', err)
      const msg =
        err?.code === 'ACTION_REJECTED' || err?.code === 4001
          ? '트랜잭션이 지갑에서 거절되었습니다.'
          : '문제 등록에 실패했습니다. 입력값과 권한(Owner)을 확인하세요.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="registration-card" style={{ margin: '24px auto', maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <div className="overline text-tertiary">ADMIN</div>
          <h2 className="title-2" style={{ margin: '6px 0' }}>퀴즈 출제</h2>
          <p className="body-2 text-secondary" style={{ margin: 0 }}>
            Owner만 사용할 수 있습니다. 정답과 salt로 해시를 만든 뒤 문제를 등록합니다.
          </p>
        </div>
        <div className="status-badge status-waiting">
          다음 ID: {nextQuestionId !== null ? `#${nextQuestionId + 1}` : '...'}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="body-2 text-secondary" style={{ display: 'block', marginBottom: 6 }}>문제</label>
          <textarea
            className="input-field"
            style={{ minHeight: 100, resize: 'vertical' }}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="블록체인 관련 문제를 입력하세요."
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {options.map((opt, idx) => (
            <div key={idx}>
              <label className="body-2 text-secondary" style={{ display: 'block', marginBottom: 6 }}>
                보기 {idx + 1}
              </label>
              <input
                className="input-field"
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`옵션 ${idx + 1}`}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="body-2 text-secondary" style={{ display: 'block', marginBottom: 6 }}>정답 (0~3)</label>
            <input
              className="input-field"
              type="number"
              min={0}
              max={3}
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </div>
          <div style={{ flex: '2 1 320px' }}>
            <label className="body-2 text-secondary" style={{ display: 'block', marginBottom: 6 }}>
              Salt (bytes32 hex)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-field"
                type="text"
                value={formattedSalt}
                onChange={(e) => setSalt(e.target.value)}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSalt(generateSalt())}
                style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
              >
                새 salt
              </Button>
            </div>
            <p className="caption text-tertiary" style={{ marginTop: 6 }}>
              해시 계산 및 리빌에 꼭 필요합니다. 안전하게 저장하세요.
            </p>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={revealNow}
            onChange={(e) => setRevealNow(e.target.checked)}
            disabled={isSubmitting}
          />
          <span className="body-2 text-secondary">등록 직후 정답 리빌하기</span>
        </label>

        {error && (
          <div className="error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {status && (
          <div className="status-badge status-correct" style={{ marginBottom: 16, display: 'inline-flex' }}>
            {status}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? '등록 중...' : '문제 등록'}
        </Button>
      </form>
    </Card>
  )
}
