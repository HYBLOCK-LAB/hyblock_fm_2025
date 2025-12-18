import { ethers } from 'ethers'
import { QUIZ_GAME_ABI } from './contract'

export interface LeaderboardEntry {
  address: string
  name: string
  score: number
}

const getProvider = (rpcUrl?: string) => {
  const url = rpcUrl || process.env.NEXT_PUBLIC_RPC_URL
  if (!url) {
    throw new Error('RPC URL가 설정되지 않았습니다. NEXT_PUBLIC_RPC_URL을 설정하세요.')
  }
  return new ethers.JsonRpcProvider(url)
}

export async function fetchLeaderboard(rpcUrl?: string): Promise<LeaderboardEntry[]> {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS가 설정되지 않았습니다.')
  }

  const provider = getProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, QUIZ_GAME_ABI, provider)
  const iface = new ethers.Interface(QUIZ_GAME_ABI)

  // PlayerRegistered 이벤트에서 주소 수집
  const registerTopic = iface.getEvent('PlayerRegistered').topicHash
  const nameChangedTopic = iface.getEvent('NameChanged').topicHash

  const [registeredLogs, nameChangedLogs] = await Promise.all([
    provider.getLogs({ address: contractAddress, topics: [registerTopic], fromBlock: 0n }),
    provider.getLogs({ address: contractAddress, topics: [nameChangedTopic], fromBlock: 0n })
  ])

  const players = new Map<string, string>() // address -> latest name (from events)

  registeredLogs.forEach((log) => {
    const parsed = iface.parseLog(log)
    const player = parsed.args.player as string
    const name = parsed.args.name as string
    players.set(player.toLowerCase(), name)
  })

  // 이름 변경 이벤트로 업데이트
  nameChangedLogs.forEach((log) => {
    const parsed = iface.parseLog(log)
    const player = parsed.args.player as string
    const newName = parsed.args.newName as string
    if (players.has(player.toLowerCase())) {
      players.set(player.toLowerCase(), newName)
    }
  })

  const addresses = Array.from(players.keys())
  if (addresses.length === 0) return []

  // 온체인 최신 정보로 정합성 확인
  const entries = await Promise.all(
    addresses.map(async (addr) => {
      try {
        const [name, score] = await Promise.all([
          contract.getPlayerName(addr),
          contract.getPlayerScore(addr)
        ])
        return {
          address: addr,
          name,
          score: Number(score)
        }
      } catch (err) {
        console.warn('Failed to fetch player data for', addr, err)
        return null
      }
    })
  )

  const filtered = entries.filter(Boolean) as LeaderboardEntry[]
  filtered.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return filtered
}
