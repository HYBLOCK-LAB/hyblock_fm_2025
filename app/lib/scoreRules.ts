export const PLAYER_REWARD_CORRECT = 7
export const PLAYER_REWARD_WRONG = 3
export const CREATOR_REWARD_BEST = 10
export const CREATOR_REWARD_HIGH = 6
export const CREATOR_REWARD_LOW = 4

export const isBalancedBand = (correctCount: number, wrongCount: number) => {
  const total = correctCount + wrongCount
  if (total === 0) return false
  const correctPct = (correctCount * 100) / total
  return correctCount === wrongCount || (correctPct >= 40 && correctPct <= 70)
}

export const calcCreatorReward = (correctCount: number, wrongCount: number): number => {
  if (correctCount + wrongCount === 0) return 0
  if (isBalancedBand(correctCount, wrongCount)) return CREATOR_REWARD_BEST
  if (correctCount > wrongCount) return CREATOR_REWARD_HIGH
  return CREATOR_REWARD_LOW
}

export const calcPlayerReward = (isCorrect: boolean, isRevealed: boolean): number => {
  if (!isRevealed) return 0
  return isCorrect ? PLAYER_REWARD_CORRECT : PLAYER_REWARD_WRONG
}
