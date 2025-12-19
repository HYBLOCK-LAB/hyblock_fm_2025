'use client'

import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useAccount, useConnectorClient } from 'wagmi'
import { QuizGameContract } from '../lib/contract'

interface QuizConnection {
  contract: QuizGameContract | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  account: string | null
  error: string | null
  isLoading: boolean
}

export function useQuizContract(): QuizConnection {
  const { address, isConnected } = useAccount()
  const { data: connectorClient } = useConnectorClient()
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<QuizGameContract | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const account = address ?? null

  useEffect(() => {
    let cancelled = false

    const wireUp = async () => {
      if (!connectorClient || !address || !isConnected) {
        setProvider(null)
        setSigner(null)
        setContract(null)
        setError(null)
        return
      }

      setIsLoading(true)
      try {
        const eip1193Provider = connectorClient.transport as unknown as ethers.Eip1193Provider
        const nextProvider = new ethers.BrowserProvider(
          eip1193Provider,
          connectorClient.chain?.id
        )
        const nextSigner = await nextProvider.getSigner(address)
        const nextContract = new QuizGameContract(nextSigner)

        if (!cancelled) {
          setProvider(nextProvider)
          setSigner(nextSigner)
          setContract(nextContract)
          setError(null)
        }
      } catch (err: any) {
        if (!cancelled) {
          const message = err?.shortMessage || err?.message || 'Failed to initialize contract.'
          setError(message)
          setProvider(null)
          setSigner(null)
          setContract(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    wireUp()

    return () => {
      cancelled = true
    }
  }, [address, connectorClient, isConnected])

  return useMemo(
    () => ({
      contract,
      provider,
      signer,
      account,
      error,
      isLoading,
    }),
    [account, contract, error, isLoading, provider, signer]
  )
}
