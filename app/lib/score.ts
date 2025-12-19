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

const isTinyRangeError = (err: any) => {
  const msg = err?.message || ''
  return msg.includes('10 block range') || err?.code === -32600
}

const parseLookbackBlocks = (): bigint => {
  const defaultHours = 4 // default lookback (~4h) to avoid massive scans on free RPC tiers
  const rawBlocks = process.env.NEXT_PUBLIC_LOG_LOOKBACK_BLOCKS || process.env.LOG_LOOKBACK_BLOCKS
  if (rawBlocks) {
    try {
      const val = BigInt(rawBlocks)
      if (val > 0n) return val
    } catch {
      /* ignore */
    }
  }

  const rawHours = process.env.NEXT_PUBLIC_LOG_LOOKBACK_HOURS || process.env.LOG_LOOKBACK_HOURS
  const hours = rawHours ? Number(rawHours) : defaultHours
  if (!Number.isNaN(hours) && hours > 0) {
    // Sepolia ~12s block time -> ~300 blocks/hour
    const blocks = Math.max(1, Math.round(hours * 300))
    return BigInt(blocks)
  }

  return 0n
}

const resolveFromBlock = async (provider: Provider, fallback: bigint) => {
  const lookback = parseLookbackBlocks()
  if (lookback === 0n) return fallback
  const latest = await provider.getBlockNumber()
  const fromLookback = latest >= lookback ? BigInt(latest) - lookback + 1n : 0n
  return fromLookback > fallback ? fromLookback : fallback
}

const fetchLogsChunked = async (
  provider: Provider,
  params: { address?: string; topics?: Array<string | null>; fromBlock?: bigint | number; toBlock?: bigint | number }
) => {
  const latest = await provider.getBlockNumber()
  const windowSize = 1500
  const from = typeof params.fromBlock === 'number' ? params.fromBlock : Number(params.fromBlock ?? 0)
  const results: ethers.Log[] = []

  let start = from
  while (start <= latest) {
    const end = Math.min(start + windowSize - 1, latest)
    const logs = await provider.getLogs({
      ...params,
      fromBlock: start,
      toBlock: end,
    })
    results.push(...logs)
    start = end + 1
  }
  return results
}

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
          let logs: ethers.Log[] = []
          const baseFromBlock = await resolveFromBlock(provider, 0n)
          try {
            logs = await provider.getLogs({
              address: contractAddress,
              topics: [answerSubmittedTopic, null, zeroPadQuestionId(i)],
              fromBlock: baseFromBlock,
            })
          } catch (err: any) {
            if (isTinyRangeError(err)) {
              logs = await fetchLogsChunked(provider, {
                address: contractAddress,
                topics: [answerSubmittedTopic, null, zeroPadQuestionId(i)],
                fromBlock: baseFromBlock,
              })
            } else {
              throw err
            }
          }
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
