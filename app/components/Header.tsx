'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import Button from './ui/Button'
import { TrophyIcon, WalletIcon } from './icons'
import { getStoredScore } from '../lib/scoreStore'

export default function Header() {
  const { address, isConnected } = useAccount()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [displayScore, setDisplayScore] = useState<number>(getStoredScore())

  useEffect(() => {
    const sync = () => setDisplayScore(getStoredScore())
    sync()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', sync)
      return () => window.removeEventListener('focus', sync)
    }
  }, [])

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <div className="header-brand" style={{ marginLeft: 0 }}>
            <Link href="/" className="header-logo-wrap" aria-label="HyBlock Home">
              <Image 
                src="/assets/logo.png" 
                alt="HyBlock" 
                fill
                sizes="(max-width: 768px) 240px, 640px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </Link>
          </div>
          <button
            className="header-mobile-toggle"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>

        <div className={`header-actions ${mobileMenuOpen ? 'is-open' : 'is-closed'}`}>
          <Link href="/create-question" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Create Quiz
          </Link>
          <Link href="/leaderboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Leaderboard
          </Link>

          {isConnected && (
            <Link href="/score" style={{ textDecoration: 'none' }}>
              <div className="score-display" style={{ cursor: 'pointer', color: '#ffffff' }}>
                <TrophyIcon size={18} className="score-icon" />
                <div>
                  <div className="title-3">{displayScore}</div>
                </div>
              </div>
            </Link>
          )}

          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
              const ready = mounted
              const connected = ready && account && chain

              if (!connected) {
                return (
                  <Button
                    variant="primary"
                    onClick={openConnectModal}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Connect Wallet
                  </Button>
                )
              }

              return (
                <button
                  className="wallet-trigger"
                  onClick={openAccountModal}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <div className="wallet-status"></div>
                  <WalletIcon size={18} />
                  <span className="body-2 mono">
                    {account?.displayName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </span>
                </button>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  )
}
