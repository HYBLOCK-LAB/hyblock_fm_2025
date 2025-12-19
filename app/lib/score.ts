import { ethers } from 'ethers'
import { QUIZ_GAME_ABI } from './contract'
import {
  calcCreatorReward,
  calcPlayerReward,
  CREATOR_REWARD_BEST,
  CREATOR_REWARD_HIGH,
  CREATOR_REWARD_LOW,
  PLAYER_REWARD_CORRECT,
  PLAYER_REWARD_WRONG,
} from './scoreRules'

type Provider = ethers.JsonRpcProvider

const getProvider = (rpcUrl?: string): Provider => {
  const url =
    rpcUrl ||
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.SEPOLIA_RPC_URL

  if (!url) {
    throw new Error('RPC URL is not configured. Set NEXT_PUBLIC_SEPOLIA_RPC_URL or SEPOLIA_RPC_URL.')
  }
  return new ethers.JsonRpcProvider(url)
}

const zeroPadQuestionId = (questionId: number) => ethers.zeroPadValue(ethers.toBeHex(questionId), 32)

export interface AnsweredRow {
  questionId: number
  questionText: string
  myAnswer: number | null
  correctAnswer: number | null
  isRevealed: boolean
  earned: number
}

export interface CreatedRow {
  questionId: number
  questionText: string
  isRevealed: boolean
  correctAnswer: number | null
  correctCount: number
  wrongCount: number
  earned: number
}

export interface ScoreBreakdown {
  answered: AnsweredRow[]
  created: CreatedRow[]
  totalScore: number
}

export const fetchScoreBreakdown = async (userAddress: string, rpcUrl?: string): Promise<ScoreBreakdown> => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.')
  }

  const provider = getProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, QUIZ_GAME_ABI, provider)
  const iface = new ethers.Interface(QUIZ_GAME_ABI)
  const answerSubmittedEvent = iface.getEvent('AnswerSubmitted')
  const answerSubmittedTopic = answerSubmittedEvent?.topicHash
  if (!answerSubmittedTopic) {
    throw new Error('Failed to read AnswerSubmitted topic hash.')
  }

  const lowercaseUser = userAddress.toLowerCase()
  const questionCountBig = await contract.questionCount()
  const questionCount = Number(questionCountBig)

  const answered: AnsweredRow[] = []
  const created: CreatedRow[] = []

  for (let i = 0; i < questionCount; i++) {
    const [state, question] = await Promise.all([
      contract.getQuestionState(i),
      contract.getQuestion(i),
    ])

    const isCreator = state.creator?.toLowerCase?.() === lowercaseUser
    const hasAnswered = await contract.hasPlayerAnswered(i, userAddress)

    // Answered rows
    if (hasAnswered) {
      let myAnswer: number | null = null
      let correctAnswer: number | null = null
      let earned = 0

      try {
        const submitted = await contract.playerAnswers(i, userAddress)
        myAnswer = typeof submitted === 'bigint' ? Number(submitted) : submitted
      } catch {
        myAnswer = null
      }

      if (state.isRevealed) {
        try {
          const ans = await contract.getCorrectAnswer(i)
          correctAnswer = typeof ans === 'bigint' ? Number(ans) : ans
        } catch {
          correctAnswer = null
        }

        if (correctAnswer !== null && myAnswer !== null) {
          earned = calcPlayerReward(myAnswer === correctAnswer, true)
        }
      }

      answered.push({
        questionId: i,
        questionText: question.questionText,
        myAnswer,
        correctAnswer,
        isRevealed: state.isRevealed,
        earned,
      })
    }

    // Created rows
    if (isCreator) {
      let correctAnswer: number | null = null
      let correctCount = 0
      let wrongCount = 0
      let earned = 0

      if (state.isRevealed) {
        try {
          const ans = await contract.getCorrectAnswer(i)
          correctAnswer = typeof ans === 'bigint' ? Number(ans) : ans
        } catch {
          correctAnswer = null
        }

        if (correctAnswer !== null) {
          const logs = await provider.getLogs({
            address: contractAddress,
            topics: [answerSubmittedTopic, null, zeroPadQuestionId(i)],
            fromBlock: 0n,
          })
          logs.forEach((log) => {
            const parsed = iface.parseLog(log)
            if (!parsed) return
            const answer = parsed.args.answer
            const answerNum = typeof answer === 'bigint' ? Number(answer) : answer
            if (answerNum === correctAnswer) {
              correctCount++
            } else {
              wrongCount++
            }
          })

          earned = calcCreatorReward(correctCount, wrongCount)
        }
      }

      created.push({
        questionId: i,
        questionText: question.questionText,
        isRevealed: state.isRevealed,
        correctAnswer,
        correctCount,
        wrongCount,
        earned,
      })
    }
  }

  // Sort by question id (newest last)
  answered.sort((a, b) => a.questionId - b.questionId)
  created.sort((a, b) => a.questionId - b.questionId)

  let totalScore = 0
  try {
    const score = await contract.getPlayerScore(userAddress)
    totalScore = Number(score)
  } catch {
    totalScore = 0
  }

  return { answered, created, totalScore }
}

export const scoreRuleCopy = {
  player: {
    correct: PLAYER_REWARD_CORRECT,
    wrong: PLAYER_REWARD_WRONG,
  },
  creator: {
    best: CREATOR_REWARD_BEST,
    high: CREATOR_REWARD_HIGH,
    low: CREATOR_REWARD_LOW,
  },
}
