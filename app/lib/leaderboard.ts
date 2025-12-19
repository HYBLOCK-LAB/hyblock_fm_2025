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

const parseLookbackBlocks = (): bigint => {
  const defaultHours = 4 // default lookback (~4h) to avoid massive scans on free RPC tiers
  const rawBlocks = process.env.NEXT_PUBLIC_LOG_LOOKBACK_BLOCKS || process.env.LOG_LOOKBACK_BLOCKS
  if (rawBlocks) {
    try {
      const val = BigInt(rawBlocks)
      if (val > 0) return val
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

const resolveFromBlock = async (provider: ethers.JsonRpcProvider, fallback: bigint) => {
  const lookback = parseLookbackBlocks()
  if (lookback === 0n) return fallback
  const latest = await provider.getBlockNumber()
  const fromLookback = latest >= lookback ? BigInt(latest) - lookback + 1n : 0n
  return fromLookback > fallback ? fromLookback : fallback
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

  const isTinyRangeError = (err: any) => {
    const msg = err?.message || ''
    return msg.includes('10 block range') || err?.code === -32600
  }

  const fetchLogsChunked = async (
    topics: Array<string | null>,
    fromBlock: bigint | number | undefined
  ) => {
    const latest = await provider.getBlockNumber()
    const windowSize = 1500
    const from = typeof fromBlock === 'number' ? fromBlock : Number(fromBlock ?? 0)
    const results: ethers.Log[] = []
    let start = from
    while (start <= latest) {
      const end = Math.min(start + windowSize - 1, latest)
      const logs = await provider.getLogs({
        address: contractAddress,
        topics,
        fromBlock: start,
        toBlock: end,
      })
      results.push(...logs)
      start = end + 1
    }
    return results
  }

  const fromBlock = await resolveFromBlock(provider, parseStartBlock())
  const [registeredLogs, nameChangedLogs] = await Promise.all([
    provider.getLogs({ address: contractAddress, topics: [registerTopic], fromBlock }).catch(async (err: any) => {
      if (err?.code === -32005) {
        throw new Error('RPC rate limit exceeded. Please retry later or configure a dedicated RPC key.')
      }
      if (isTinyRangeError(err)) {
        return fetchLogsChunked([registerTopic], fromBlock)
      }
      throw err
    }),
    provider.getLogs({ address: contractAddress, topics: [nameChangedTopic], fromBlock }).catch(async (err: any) => {
      if (err?.code === -32005) {
        throw new Error('RPC rate limit exceeded. Please retry later or configure a dedicated RPC key.')
      }
      if (isTinyRangeError(err)) {
        return fetchLogsChunked([nameChangedTopic], fromBlock)
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
