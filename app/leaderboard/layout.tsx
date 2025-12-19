'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Header from '../components/Header'

export default function LeaderboardLayout({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)

  // Detect existing MetaMask connection so navigation keeps state
  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return
      try {
        const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0])
        }
      } catch (err) {
        console.warn('Failed to read accounts', err)
      }
    }
    init()
  }, [])

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask!')
      return
    }
    try {
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0])
      }
    } catch (err) {
      console.error('Failed to connect wallet', err)
    }
  }

  return (
    <>
      <Header
        isConnected={!!account}
        account={account}
        onConnect={connect}
        onDisconnect={() => setAccount(null)}
      />
      {children}
    </>
  )
}
