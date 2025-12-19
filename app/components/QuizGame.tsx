'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { QuizGameContract, QuestionData, QuestionState, QUIZ_GAME_ABI } from '../lib/contract'
import Accordion from './ui/Accordion'
import { AnsweredIcon, CheckIcon, RefreshIcon } from './icons'
import Button from './ui/Button'

interface QuizGameProps {
  contract: QuizGameContract | null
  userAddress: string
  onScoreUpdate?: (score: number) => void
  provider?: ethers.BrowserProvider | null
}

interface GameState {
  playerName: string
  currentScore: number
  questionId: number
  question: QuestionData | null
  questionState: QuestionState | null
  correctAnswerIndex: number | null
  hasAnswered: boolean
  selectedAnswer: number | null
  isSubmitting: boolean
  isCorrect: boolean | null
  showResult: boolean
}

export default function QuizGame({ contract, userAddress, onScoreUpdate, provider }: QuizGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    playerName: '',
    currentScore: 0,
    questionId: 0, // start from the first question by default
    question: null,
    questionState: null,
    correctAnswerIndex: null,
    hasAnswered: false,
    selectedAnswer: null,
    isSubmitting: false,
    isCorrect: null,
    showResult: false
  })
  const [error, setError] = useState<string>('')
const [isLoading, setIsLoading] = useState(true)
  const [questionList, setQuestionList] = useState<
    { id: number; data: QuestionData; state: QuestionState; correct: number | null; answered: boolean }[]
  >([])
  const [userSelections, setUserSelections] = useState<Record<number, number | null>>({})
const [revealInputs, setRevealInputs] = useState<Record<number, { answer: number | null }>>({})
  const [revealingId, setRevealingId] = useState<number | null>(null)

  // Initialize game data
  useEffect(() => {
    if (contract) {
      initializeGame()
    }
  }, [contract, userAddress])

  // Set up event listeners
  useEffect(() => {
    const handleAnswerSubmitted = (player: string, questionId: bigint, answer: number | bigint) => {
      if (player.toLowerCase() === userAddress.toLowerCase()) {
        console.log('Answer submitted event:', player, questionId)
        const qId = Number(questionId)
        const answerNum =
          typeof answer === 'number'
            ? answer
            : typeof answer === 'bigint'
              ? Number(answer)
              : null
        setQuestionList((prev) =>
          prev.map((q) =>
            q.id === qId
              ? { ...q, answered: true }
              : q
          )
        )
        if (answerNum !== null && !Number.isNaN(answerNum)) {
          persistSelection(qId, answerNum)
        }
        setGameState(prev => ({
          ...prev,
          isSubmitting: false,
          hasAnswered: prev.questionId === qId ? true : prev.hasAnswered,
          showResult: false
        }))
      }
    }

    const handleScoreUpdated = (player: string, newScore: bigint) => {
      if (player.toLowerCase() === userAddress.toLowerCase()) {
        console.log('Score updated event:', player, newScore)
        const scoreNumber = Number(newScore);
        setGameState(prev => ({
          ...prev,
          currentScore: scoreNumber
        }))
        onScoreUpdate?.(scoreNumber);
      }
    }

    const handleAnswerRevealed = (questionId: bigint, correctAnswer: number | bigint) => {
      const qId = Number(questionId)
      const num =
        typeof correctAnswer === 'number'
          ? correctAnswer
          : typeof correctAnswer === 'bigint'
            ? Number(correctAnswer)
            : null
      setQuestionList((prev) =>
        prev.map((q) =>
          q.id === qId
            ? {
                ...q,
                state: { ...q.state, isRevealed: true },
                correct: num !== null ? num : q.correct,
              }
            : q
        )
      )
      setGameState((prev) =>
        prev.questionId === qId
          ? {
              ...prev,
              questionState: prev.questionState ? { ...prev.questionState, isRevealed: true } : prev.questionState,
              correctAnswerIndex: num !== null ? num : prev.correctAnswerIndex,
              isCorrect:
                prev.hasAnswered && num !== null && userSelections[qId] !== undefined && userSelections[qId] !== null
                  ? userSelections[qId] === num
                  : prev.isCorrect,
              showResult:
                prev.hasAnswered && userSelections[qId] !== undefined && userSelections[qId] !== null
                  ? true
                  : prev.showResult,
            }
          : prev
      )
      setRevealingId((prev) => (prev === qId ? null : prev))
    }

    const handleAnswerEvaluated = (player: string, questionId: bigint, isCorrect: boolean) => {
      if (player.toLowerCase() !== userAddress.toLowerCase()) return
      const qId = Number(questionId)
      setGameState((prev) =>
        prev.questionId === qId
          ? { ...prev, isCorrect, showResult: true }
          : prev
      )
    }

    if (contract) {
      contract.onAnswerSubmitted(handleAnswerSubmitted)
      contract.onScoreUpdated(handleScoreUpdated)
      contract.onAnswerRevealed(handleAnswerRevealed)
      try {
        contract.onAnswerEvaluated(handleAnswerEvaluated)
      } catch (err) {
        console.warn('Failed to attach AnswerEvaluated listener (ABI mismatch?):', err)
      }
    }

    return () => {
      if (contract) {
        contract.removeAllListeners()
      }
    }
  }, [contract, userAddress])

  const initializeGame = async () => {
    if (!contract) {
      setError('Contract not available. Please reconnect your wallet.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Load player data
      const [name, score, questionCountBig] = await Promise.all([
        contract.getMyName(),
        contract.getMyScore(),
        contract.getQuestionCount()
      ])

      const questionCount = Number(questionCountBig)
      if (questionCount === 0) {
        throw new Error('No questions available')
      }

      const total = Number(questionCount)
      const iface = new ethers.Interface(QUIZ_GAME_ABI)
      const answerEvent = iface.getEvent('AnswerRevealed')
      const answerTopic = answerEvent?.topicHash

      const fetched: {
        id: number
        data: QuestionData
        state: QuestionState
        correct: number | null
        answered: boolean
      }[] = []

      // helper to fetch correct answer from AnswerRevealed logs within a safe window
      const getCorrectAnswer = async (questionId: number): Promise<number | null> => {
        if (!provider || !answerTopic) return null
        try {
          const latest = await provider.getBlockNumber()
          const window = 5000 // per-request window to stay within RPC limit
          const maxChunks = 5   // search up to 5 windows (~25k blocks)

          let toBlock = latest
          let searched = 0
          while (toBlock >= 0 && searched < maxChunks) {
            const fromBlock = toBlock >= window ? toBlock - window + 1 : 0
            try {
              const logs = await provider.getLogs({
                address: contract.getAddress(),
                topics: [answerTopic, ethers.zeroPadValue(ethers.toBeHex(questionId), 32)],
                fromBlock,
                toBlock,
              })
              if (logs.length > 0) {
                const parsed = iface.parseLog(logs[logs.length - 1])
                const raw = parsed?.args?.correctAnswer
                const num =
                  typeof raw === 'number'
                    ? raw
                    : typeof raw === 'bigint'
                      ? Number(raw)
                      : null
                if (num !== null && !Number.isNaN(num)) {
                  return num
                }
              }
            } catch (err) {
              console.warn('Failed to fetch answer log chunk', { questionId, fromBlock, toBlock, err })
              break
            }

            if (fromBlock === 0) break
            toBlock = fromBlock - 1
            searched += 1
          }
        } catch (err) {
          console.warn('Failed to fetch answer log for question', questionId, err)
        }
        return null
      }

      for (let i = 0; i < total; i++) {
        const [state, data, answered] = await Promise.all([
          contract.getQuestionState(i),
          contract.getQuestion(i),
          contract.hasPlayerAnswered(i, userAddress)
        ])

        const correct = state.isRevealed ? await getCorrectAnswer(i) : null
        fetched.push({ id: i, data, state, correct, answered })
      }

      const activeList = fetched.filter((q) => q.state.isActive)
      const listToUse = activeList.length > 0 ? activeList : fetched // fallback to all if none active
      const latest = listToUse[listToUse.length - 1]

      const scoreNumber = Number(score);
      onScoreUpdate?.(scoreNumber);

      const loadStoredSelections = (): Record<number, number | null> => {
        if (typeof window === 'undefined' || !userAddress) return {}
        try {
          const raw = localStorage.getItem(`quiz-selections-${userAddress}`)
          if (!raw) return {}
          const parsed = JSON.parse(raw)
          return parsed && typeof parsed === 'object' ? parsed : {}
        } catch {
          return {}
        }
      }

      const storedSelections = loadStoredSelections()
      const latestSelection = storedSelections[latest.id] ?? null
      const computedIsCorrect =
        latest.state.isRevealed && latest.correct !== null && latestSelection !== null
          ? latestSelection === latest.correct
          : null

      setGameState(prev => ({
        ...prev,
        playerName: name,
        currentScore: scoreNumber,
        questionId: latest.id,
        question: latest.data,
        questionState: latest.state,
        hasAnswered: latest.answered,
        correctAnswerIndex: latest.correct,
        selectedAnswer: latestSelection,
        isCorrect: computedIsCorrect,
        showResult: computedIsCorrect !== null
      }))
      setUserSelections(storedSelections)
      setQuestionList(listToUse)
    } catch (error: any) {
      console.error('Error initializing game:', error)
      setError(error?.message || 'Failed to load quiz data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const persistSelection = (questionId: number, answerIndex: number) => {
    setUserSelections((prev) => {
      const updated = { ...prev, [questionId]: answerIndex }
      if (typeof window !== 'undefined' && userAddress) {
        try {
          localStorage.setItem(`quiz-selections-${userAddress}`, JSON.stringify(updated))
        } catch {
          // ignore storage failures
        }
      }
      return updated
    })
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (gameState.hasAnswered || gameState.isSubmitting || gameState.showResult) return

    setGameState(prev => ({
      ...prev,
      selectedAnswer: answerIndex
    }))
    persistSelection(gameState.questionId, answerIndex)
  }

  const handleRevealSelect = (questionId: number, answerIndex: number) => {
    setRevealInputs((prev) => ({
      ...prev,
      [questionId]: { answer: answerIndex }
    }))
  }

  const handleRevealSubmit = async (questionId: number) => {
    if (!contract || revealingId !== null) return
    const entry = revealInputs[questionId] || { answer: null }
    const answerNum = entry.answer
    if (answerNum === null || answerNum < 0 || answerNum > 3) {
      setError('정답은 Option 1~4 중 하나를 선택한 뒤 공개하세요.')
      return
    }

    try {
      setRevealingId(questionId)
      setError('')
      const salt = ethers.hexlify(ethers.zeroPadValue(userAddress, 32))
      const tx = await contract.revealAnswer(questionId, answerNum, salt)
      console.log('Reveal tx:', tx.hash)
      await tx.wait()
      console.log('Reveal confirmed')
    } catch (err: any) {
      console.error('Reveal failed:', err)
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Reveal transaction rejected.')
      } else {
        setError(err?.shortMessage || err?.message || 'Failed to reveal answer.')
      }
    } finally {
      setRevealingId((prev) => (prev === questionId ? null : prev))
    }
  }

  const handleAnswerSubmit = async () => {
    if (gameState.selectedAnswer === null || gameState.hasAnswered || gameState.isSubmitting || !contract) return

    setGameState(prev => ({ ...prev, isSubmitting: true }))
    setError('')

    try {
      const tx = await contract.submitAnswer(gameState.questionId, gameState.selectedAnswer)
      console.log('Answer submission transaction:', tx.hash)
      await tx.wait()
      console.log('Answer submission confirmed')
      setQuestionList((prev) =>
        prev.map((q) =>
          q.id === gameState.questionId ? { ...q, answered: true } : q
        )
      )
      setGameState((prev) => ({
        ...prev,
        isSubmitting: false,
        hasAnswered: true,
        showResult: false
      }))
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      setGameState(prev => ({ ...prev, isSubmitting: false }))
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setError('Transaction rejected. Please approve the transaction to submit your answer.')
      } else if (error.message?.includes('AlreadyAnswered')) {
        setError('You have already answered this question.')
        setGameState(prev => ({ ...prev, hasAnswered: true }))
      } else if (error.message?.includes('QuestionNotRevealed')) {
        setError('This question has not been revealed yet. Please wait for the admin to reveal the answer.')
      } else if (error.message?.includes('AlreadyRevealed')) {
        setError('This question is already revealed. Submissions are closed.')
      } else if (error.message?.includes('AnswerLimitReached')) {
        setError('Submission limit reached for this question.')
      } else {
        setError('Failed to submit answer. Please try again.')
      }
    }
  }

  const hasValidSelection = (questionId: number, options: string[]) => {
    const selection = userSelections[questionId]
    return (
      selection !== null &&
      selection !== undefined &&
      Number.isInteger(selection) &&
      selection >= 0 &&
      selection < options.length
    )
  }

  const formatSelectionLabel = (selection: number, options: string[]) =>
    `${String.fromCharCode(65 + selection)}. ${options[selection]}`

  const getOptionClassName = (index: number, isCurrent: boolean) => {
    const baseClass = 'quiz-option'
    if (!isCurrent) return baseClass
    
    const hasResult = gameState.showResult && gameState.isCorrect !== null

    if (hasResult && gameState.selectedAnswer === index) {
      return `${baseClass} ${gameState.isCorrect ? 'correct' : 'incorrect'}`
    }

    if (gameState.selectedAnswer === index) {
      return `${baseClass} selected`
    }
    
    return baseClass
  }

  const renderQuestionCard = (q: {
    id: number
    data: QuestionData
    state: QuestionState
    correct: number | null
    answered: boolean
  }) => {
    const isCurrent = q.id === gameState.questionId
    const isCreator = q.state.creator?.toLowerCase?.() === userAddress.toLowerCase()
    const revealInput = revealInputs[q.id] || { answer: null }
    const userSelection = userSelections[q.id]
    const hasUserSelection = hasValidSelection(q.id, q.data.options)

    return (
      <div className={q.state.isActive ? '' : 'question-disabled'}>
        <div style={{ marginBottom: 12 }}>
          <h4 style={{ margin: '12px 0 8px 0' }}>{q.data.questionText}</h4>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.data.options.map((opt, idx) => {
            const isCorrectOpt = q.state.isRevealed && q.correct === idx
            const revealSelected =
              isCreator && !q.state.isRevealed && revealInputs[q.id]?.answer === idx
            return (
              <div
                key={idx}
                className={`${getOptionClassName(idx, isCurrent)} ${isCorrectOpt ? 'correct' : ''} ${
                  revealSelected ? 'selected' : ''
                }`}
                style={{ cursor: isCurrent && q.state.isActive ? 'pointer' : 'default', opacity: !isCurrent ? 0.85 : 1 }}
                onClick={() => {
                  if (!isCurrent || !q.state.isActive) return
                  if (isCreator && !q.state.isRevealed) {
                    handleRevealSelect(q.id, idx)
                    return
                  }
                  if (!isCreator) {
                    handleAnswerSelect(idx)
                  }
                }}
              >
                <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
              </div>
            )
          })}
        </div>

        {!q.state.isRevealed && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#9ca3af' }}>
            Awaiting reveal. You can still view the options.
          </div>
        )}

        {q.state.isRevealed && (
          <div style={{ marginTop: 10, fontSize: 13 }}>
            {q.correct !== null ? (
              <>
                <strong>Correct answer:</strong>{' '}
                <span className="mono">
                  {String.fromCharCode(65 + q.correct)}. {q.data.options[q.correct]}
                </span>
              </>
            ) : (
              <span className="text-secondary">Correct answer revealed on-chain but not yet loaded.</span>
            )}
          </div>
        )}

        {isCurrent && isCreator && !q.state.isRevealed && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button
              variant="primary"
              onClick={() => handleRevealSubmit(q.id)}
              disabled={
                revealingId !== null ||
                revealInput.answer === null
              }
            >
              {revealingId === q.id ? 'Revealing...' : 'Reveal Answer'}
            </Button>
          </div>
        )}

        {isCurrent && !isCreator && (
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              onClick={handleAnswerSubmit}
              disabled={
                gameState.isSubmitting ||
                gameState.hasAnswered ||
                gameState.selectedAnswer === null ||
                gameState.questionState?.isRevealed
              }
              className={gameState.selectedAnswer === null ? 'btn-disabled' : ''}
            >
              {gameState.isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
            {!q.state.isRevealed && (
              <span className="body-2 text-secondary" style={{ alignSelf: 'center' }}>
                Not revealed yet; submission is stored and will be scored after reveal.
              </span>
            )}
            {q.state.isRevealed && (
              <span className="body-2 text-secondary" style={{ alignSelf: 'center' }}>
                Revealed — submissions are closed.
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: '12px' }}>Loading quiz...</span>
      </div>
    )
  }

  if (!gameState.question || !gameState.questionState) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', color: '#666' }}>
          <h3>No Quiz Available</h3>
          <p>{error || 'There are no quiz questions at the moment.'}</p>
          <button className="button" onClick={initializeGame}>
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
              Welcome, {gameState.playerName}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>
              Current Score: <strong>{gameState.currentScore} points</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={initializeGame}
              style={{ padding: '8px', width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Refresh questions"
            >
              <RefreshIcon size={18} />
            </button>
            {gameState.hasAnswered ? (
              <span className="status-badge status-correct">Completed</span>
            ) : gameState.showResult ? (
              <span className={`status-badge ${gameState.isCorrect ? 'status-correct' : 'status-incorrect'}`}>
                {gameState.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            ) : (
              <span className="status-badge status-waiting">In Progress</span>
            )}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="card">
        
        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <Accordion
          items={questionList.map((q) => {
            const selection = userSelections[q.id]
            const selectionValid = hasValidSelection(q.id, q.data.options)

            return {
              id: q.id,
              title: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="title-3">Question #{q.id + 1}</span>
                {q.state.isRevealed && (
                  <span className="revealed-chip">
                    <CheckIcon size={14} />
                    <span>Revealed</span>
                  </span>
                )}
                {q.answered && (
                  <span className="answered-chip" style={{ display: 'inline-flex' }}>
                    <AnsweredIcon size={14} />
                    <span>
                      Answered
                    </span>
                  </span>
                )}
              </div>
              <span
                className="body-2 text-secondary"
                style={{ textAlign: 'left', opacity: q.state.isActive ? 1 : 0.6 }}
              >
                {q.data.questionText.length > 80
                  ? `${q.data.questionText.slice(0, 80)}...`
                  : q.data.questionText}
              </span>
            </div>
              ),
              content: renderQuestionCard(q),
              disabled: !q.state.isActive,
            }
          })}
          singleOpen
          defaultOpenId={gameState.questionId}
          onToggle={(id, isOpen) => {
            if (!isOpen) return
            const target = questionList.find((q) => q.id === id)
            if (!target) return
            const savedSelection = userSelections[target.id] ?? null
            const computedIsCorrect =
              target.state.isRevealed && savedSelection !== null && target.correct !== null
                ? savedSelection === target.correct
                : null
            // Defer state update to avoid setState during Accordion render
            setTimeout(() => {
              setGameState((prev) => ({
                ...prev,
                questionId: target.id,
                question: target.data,
                questionState: target.state,
                hasAnswered: target.answered,
                correctAnswerIndex: target.correct,
                selectedAnswer: savedSelection,
                isCorrect: computedIsCorrect,
                showResult: computedIsCorrect !== null,
                isSubmitting: false,
              }))
            }, 0)
          }}
        />
      </div>
    </div>
  )
}
