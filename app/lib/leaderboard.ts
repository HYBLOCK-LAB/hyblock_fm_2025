import { ethers } from 'ethers'
import { QUIZ_GAME_ABI } from './contract'

export interface LeaderboardEntry {
  address: string
  name: string
  score: number
}

const getProvider = (rpcUrl?: string) => {
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

const parseStartBlock = (): bigint => {
  const raw = process.env.NEXT_PUBLIC_LOG_START_BLOCK || process.env.LOG_START_BLOCK
  if (!raw) return 0n
  try {
    return BigInt(raw)
  } catch {
    return 0n
  }
}

export async function fetchLeaderboard(rpcUrl?: string): Promise<LeaderboardEntry[]> {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.')
  }

  const provider = getProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, QUIZ_GAME_ABI, provider)
  const iface = new ethers.Interface(QUIZ_GAME_ABI)
  let ownerAddress: string | null = null
  try {
    ownerAddress = (await contract.owner())?.toLowerCase?.() ?? null
  } catch {
    ownerAddress = null
  }

  const parseBlacklist = () => {
    const raw =
      process.env.NEXT_PUBLIC_LEADERBOARD_BLACKLIST ||
      process.env.LEADERBOARD_BLACKLIST ||
      process.env.NEXT_PUBLIC_EXCLUDE_ADDRESSES || // backward compatible
      ''
    return raw
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean)
  }

  const excludedSet = new Set<string>(parseBlacklist())
  if (ownerAddress) excludedSet.add(ownerAddress)

  const registerEvent = iface.getEvent('PlayerRegistered')
  const nameChangedEvent = iface.getEvent('NameChanged')
  if (!registerEvent || !nameChangedEvent || !registerEvent.topicHash || !nameChangedEvent.topicHash) {
    throw new Error('Failed to read event topic hashes.')
  }
  const registerTopic = registerEvent.topicHash
  const nameChangedTopic = nameChangedEvent.topicHash

  const fromBlock = parseStartBlock()
  const [registeredLogs, nameChangedLogs] = await Promise.all([
    provider.getLogs({ address: contractAddress, topics: [registerTopic], fromBlock }).catch((err: any) => {
      if (err?.code === -32005) {
        throw new Error('RPC rate limit exceeded. Please retry later or configure a dedicated RPC key.')
      }
      throw err
    }),
    provider.getLogs({ address: contractAddress, topics: [nameChangedTopic], fromBlock }).catch((err: any) => {
      if (err?.code === -32005) {
        throw new Error('RPC rate limit exceeded. Please retry later or configure a dedicated RPC key.')
      }
      throw err
    }),
  ])

  const players = new Map<string, string>() // address -> latest name (from events)

  registeredLogs.forEach((log) => {
    const parsed = iface.parseLog(log)
    if (!parsed) return
    const player = parsed.args.player as string
    const name = parsed.args.name as string
    players.set(player.toLowerCase(), name)
  })

  nameChangedLogs.forEach((log) => {
    const parsed = iface.parseLog(log)
    if (!parsed) return
    const player = parsed.args.player as string
    const newName = parsed.args.newName as string
    if (players.has(player.toLowerCase())) {
      players.set(player.toLowerCase(), newName)
    }
  })

  const addresses = Array.from(players.keys())
  const filteredAddresses = addresses.filter((addr) => !excludedSet.has(addr))

  if (filteredAddresses.length === 0) return []

  const entries = await Promise.all(
    filteredAddresses.map(async (addr) => {
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

  const filtered = (entries.filter(Boolean) as LeaderboardEntry[]).filter(
    (entry) => !excludedSet.has(entry.address.toLowerCase())
  )

  filtered.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return filtered
}
