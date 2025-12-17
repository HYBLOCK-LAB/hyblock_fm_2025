'use client'

import { useState, useEffect } from 'react'
import { QuizGameContract, QuestionData, QuestionState } from '../lib/contract'

interface QuizGameProps {
  contract: QuizGameContract | null
  userAddress: string
  onScoreUpdate?: (score: number) => void
}

interface GameState {
  playerName: string
  currentScore: number
  questionId: number
  question: QuestionData | null
  questionState: QuestionState | null
  hasAnswered: boolean
  selectedAnswer: number | null
  isSubmitting: boolean
  isCorrect: boolean | null
  showResult: boolean
}

export default function QuizGame({ contract, userAddress, onScoreUpdate }: QuizGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    playerName: '',
    currentScore: 0,
    questionId: 5, // Start from the first custom question
    question: null,
    questionState: null,
    hasAnswered: false,
    selectedAnswer: null,
    isSubmitting: false,
    isCorrect: null,
    showResult: false
  })
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Initialize game data
  useEffect(() => {
    if (contract) {
      initializeGame()
    }
  }, [contract, userAddress])

  // Set up event listeners
  useEffect(() => {
    const handleAnswerSubmitted = (player: string, questionId: bigint, isCorrect: boolean) => {
      if (player.toLowerCase() === userAddress.toLowerCase()) {
        console.log('Answer submitted event:', player, questionId, isCorrect)
        setGameState(prev => ({
          ...prev,
          isSubmitting: false,
          isCorrect,
          showResult: true
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

    if (contract) {
      contract.onAnswerSubmitted(handleAnswerSubmitted)
      contract.onScoreUpdated(handleScoreUpdated)
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
      const [name, score] = await Promise.all([
        contract.getMyName(),
        contract.getMyScore()
      ])

      // Check if question exists and load it
      const questionCount = await contract.getQuestionCount()
      if (questionCount === BigInt(0)) {
        throw new Error('No questions available')
      }

      const [questionData, questionState, hasAnswered] = await Promise.all([
        contract.getQuestion(gameState.questionId),
        contract.getQuestionState(gameState.questionId),
        contract.hasPlayerAnswered(gameState.questionId, userAddress)
      ])

      const scoreNumber = Number(score);
      onScoreUpdate?.(scoreNumber);
      
      setGameState(prev => ({
        ...prev,
        playerName: name,
        currentScore: scoreNumber,
        question: questionData,
        questionState,
        hasAnswered
      }))
    } catch (error: any) {
      console.error('Error initializing game:', error)
      setError('Failed to load quiz data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (gameState.hasAnswered || gameState.isSubmitting || gameState.showResult) return

    setGameState(prev => ({
      ...prev,
      selectedAnswer: answerIndex
    }))
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
      } else {
        setError('Failed to submit answer. Please try again.')
      }
    }
  }

  const getOptionClassName = (index: number) => {
    const baseClass = 'quiz-option'
    
    if (gameState.showResult || gameState.hasAnswered) {
      if (gameState.selectedAnswer === index) {
        return `${baseClass} ${gameState.isCorrect ? 'correct' : 'incorrect'}`
      }
    } else if (gameState.selectedAnswer === index) {
      return `${baseClass} selected`
    }
    
    return baseClass
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
          <p>There are no active quiz questions at the moment.</p>
          <button className="button" onClick={initializeGame}>
            Refresh
          </button>
        </div>
      </div>
    )
  }

  if (!gameState.questionState.isRevealed) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center' }}>
          <h3>Question Not Yet Revealed</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            The quiz administrator has not yet revealed this question. Please wait.
          </p>
          <button className="button" onClick={initializeGame}>
            Check Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Player Status */}
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
          <div>
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
        <h2 style={{ marginBottom: '24px', color: '#333' }}>
          Question #{gameState.questionId + 1}
        </h2>
        
        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '20px', lineHeight: '1.5', color: '#333' }}>
            {gameState.question.questionText}
          </h3>
        </div>

        <div style={{ marginBottom: '32px' }}>
          {gameState.question.options.map((option, index) => (
            <button
              key={index}
              className={getOptionClassName(index)}
              onClick={() => handleAnswerSelect(index)}
              disabled={gameState.hasAnswered || gameState.isSubmitting || gameState.showResult}
            >
              <strong>{String.fromCharCode(65 + index)}.</strong> {option}
            </button>
          ))}
        </div>

        {!gameState.hasAnswered && !gameState.showResult && (
          <button
            className="button"
            onClick={handleAnswerSubmit}
            disabled={gameState.selectedAnswer === null || gameState.isSubmitting}
            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
          >
            {gameState.isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Submitting Answer...
              </span>
            ) : (
              'Submit Answer'
            )}
          </button>
        )}

        {(gameState.hasAnswered || gameState.showResult) && (
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
              {gameState.hasAnswered ? 'Already Answered' : gameState.isCorrect ? 'Correct!' : 'Incorrect'}
            </h4>
            <p style={{ margin: 0, color: '#666' }}>
              {gameState.hasAnswered 
                ? 'You have already submitted your answer for this question.'
                : gameState.isCorrect 
                  ? 'Great job! You earned 10 points.' 
                  : 'Better luck next time!'
              }
            </p>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className="button button-secondary" onClick={initializeGame}>
          Refresh Quiz Data
        </button>
      </div>
    </div>
  )
}