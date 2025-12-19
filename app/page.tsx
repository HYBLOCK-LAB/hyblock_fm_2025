'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Registration from './components/Registration'
import QuizGame from './components/QuizGame'
import ContractError from './components/ContractError'
import Header from './components/Header'
import AdminQuestionForm from './components/AdminQuestionForm'
import Card from './components/ui/Card'
import Button from './components/ui/Button'
import FeatureCard from './components/ui/FeatureCard'
import { BrainIcon, ChainIcon, TrophyIcon, WalletIcon } from './components/icons'
import { clearStoredScore, getStoredScore, setStoredScore } from './lib/scoreStore'
import { useQuizContract } from './hooks/useQuizContract'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { contract, provider, error: contractInitError } = useQuizContract()
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [contractError, setContractError] = useState<boolean>(false)
  const [playerName, setPlayerName] = useState<string>('')
  const [score, setScore] = useState<number>(getStoredScore())
  const [isOwner, setIsOwner] = useState<boolean>(false)

  const userAddress = address || ''

  const checkRegistration = async () => {
    if (!contract || !userAddress) return
    try {
      const registered = await contract.hasRegistered(userAddress)
      setIsRegistered(registered)
      if (registered) {
        const name = await contract.getMyName()
        setPlayerName(name)
      } else {
        setPlayerName('')
      }
    } catch (error) {
      console.error('Error checking registration:', error)
      setIsRegistered(true)
      setPlayerName('')
    }
  }

  const handleRegistrationComplete = () => {
    setIsRegistered(true)
    if (contract) {
      contract.getMyName().then(setPlayerName).catch(() => setPlayerName(''))
    }
  }

  useEffect(() => {
    const syncScore = () => setScore(getStoredScore())
    syncScore()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', syncScore)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', syncScore)
      }
    }
  }, [])

  useEffect(() => {
    setContractError(!!contractInitError)
  }, [contractInitError])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!contract || !userAddress) return
      try {
        await checkRegistration()
      } catch (err) {
        console.error('Failed to initialize contract connection:', err)
        if (!cancelled) setContractError(true)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [contract, userAddress])

  useEffect(() => {
    const checkOwner = async () => {
      if (!contract || !userAddress) {
        setIsOwner(false)
        return
      }
      try {
        const owner = await contract.getOwner()
        setIsOwner(owner.toLowerCase() === userAddress.toLowerCase())
      } catch (err: any) {
        console.error('Failed to fetch owner address:', err)
        setIsOwner(false)
      }
    }
    checkOwner()
  }, [contract, userAddress])

  useEffect(() => {
    if (!isConnected) {
      setIsRegistered(false)
      setContractError(false)
      setPlayerName('')
      setIsOwner(false)
      setScore(0)
      clearStoredScore()
    }
  }, [isConnected])

  const handleRetry = async () => {
    setContractError(false)
    await checkRegistration()
  }

  return (
    <div className="page-container">
      {/* Header */}
      <Header />

      <main className="main-content">
        <div className="container">
          {/* Admin: create questions */}
          {contract && isOwner && !contractError && (
            <AdminQuestionForm contract={contract} />
          )}

          {/* Welcome Message */}
          {userAddress && playerName && (
            <div className="welcome-section">
              <div className="welcome-card">
                <h2 className="welcome-title">
                  Welcome back, <span className="gradient-text">{playerName}</span>
                </h2>
                <p className="welcome-subtitle">Ready to test your blockchain knowledge?</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!isConnected ? (
            <div className="landing-section">
              {/* Hero Section */}
              <div className="hero-section">
                <div className="hero-content">
                  <div className="hero-badge">
                    <span className="hero-badge-text">Powered by Ethereum</span>
                  </div>
                  <h1 className="hero-title">
                    <span className="gradient-text">HyBlock</span> Quiz DApp
                  </h1>
                  <p className="hero-subtitle">
                    Test your blockchain knowledge and earn rewards on-chain
                  </p>
                  <p className="hero-description">
                    Decentralized quiz platform built on Sepolia testnet with smart contract integration
                  </p>
                  
                  <div className="hero-actions">
                    <Button className="btn-primary btn-large" onClick={() => openConnectModal?.()}>
                      <WalletIcon size={20} />
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="features-section">
                <div className="features-header">
                  <h2 className="features-title">Why Choose HyBlock?</h2>
                  <p className="features-subtitle">Experience the future of decentralized learning</p>
                </div>
                
                <div className="features-grid">
                  <FeatureCard 
                    icon={<BrainIcon />} 
                    title="Test Knowledge" 
                    description="Challenge yourself with comprehensive blockchain questions and real-world scenarios" 
                  />
                  <FeatureCard 
                    icon={<ChainIcon />} 
                    title="On-Chain Scores" 
                    description="Your progress is permanently and transparently recorded on Ethereum blockchain" 
                  />
                  <FeatureCard 
                    icon={<TrophyIcon />} 
                    title="Compete & Learn" 
                    description="Learn while competing with others in a truly decentralized ecosystem" 
                  />
                </div>
              </div>
            </div>
          ) : contractError ? (
            <ContractError onRetry={handleRetry} />
          ) : !contract ? (
            <Card className="registration-card" style={{ margin: '12px 0' }}>
              <p className="body-2 text-secondary" style={{ margin: 0 }}>
                Connecting to your wallet...
              </p>
            </Card>
          ) : !isRegistered ? (
            <Registration 
              contract={contract}
              onRegistrationComplete={(name) => {
                handleRegistrationComplete();
                setPlayerName(name);
              }}
            />
          ) : (
            <QuizGame 
              contract={contract}
              userAddress={userAddress}
              onScoreUpdate={(newScore) => {
                setScore(newScore)
                setStoredScore(newScore)
              }}
              provider={provider}
            />
          )}
        </div>
      </main>
    </div>
  )
}
