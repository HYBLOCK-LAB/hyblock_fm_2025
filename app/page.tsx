'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import WalletConnection from './components/WalletConnection'
import Registration from './components/Registration'
import QuizGame from './components/QuizGame'
import ContractError from './components/ContractError'
import Header from './components/Header'
import AdminQuestionForm from './components/AdminQuestionForm'
import Card from './components/ui/Card'
import Button from './components/ui/Button'
import FeatureCard from './components/ui/FeatureCard'
import { BrainIcon, ChainIcon, TrophyIcon, ArrowRightIcon, WalletIcon } from './components/icons'
import { QuizGameContract } from './lib/contract'

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<QuizGameContract | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [contractError, setContractError] = useState<boolean>(false)
  const [playerName, setPlayerName] = useState<string>('')
  const [score, setScore] = useState<number>(0)
  const [isOwner, setIsOwner] = useState<boolean>(false)

  const checkRegistration = async (address: string, gameContract: QuizGameContract) => {
    try {
      const registered = await gameContract.hasRegistered(address)
      setIsRegistered(registered)
    } catch (error) {
      console.error('Error checking registration:', error)
      setIsRegistered(false)
    }
  }

  const handleWalletConnected = async (
    newProvider: ethers.BrowserProvider,
    newSigner: ethers.JsonRpcSigner,
    address: string
  ) => {
    setProvider(newProvider)
    setSigner(newSigner)
    setUserAddress(address)

    try {
      // Initialize contract
      const gameContract = new QuizGameContract(newSigner)
      setContract(gameContract)

      // Check if user is registered
      await checkRegistration(address, gameContract)
    } catch (error: any) {
      console.error('Contract initialization failed:', error)
      setContract(null)
      setContractError(true)
    }
  }

  const handleRegistrationComplete = () => {
    setIsRegistered(true)
  }

  const handleDisconnect = () => {
    setProvider(null)
    setSigner(null)
    setContract(null)
    setUserAddress('')
    setIsRegistered(false)
    setContractError(false)
    setIsOwner(false)
  }

  const handleRetry = async () => {
    if (signer && userAddress) {
      setContractError(false)
      await handleWalletConnected(provider!, signer, userAddress)
    }
  }

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        const address = await newSigner.getAddress();
        await handleWalletConnected(newProvider, newSigner, address);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Determine owner privilege
  useEffect(() => {
    const checkOwner = async () => {
      if (!contract || !userAddress) {
        setIsOwner(false)
        return
      }
      try {
        const owner = await contract.getOwner()
        setIsOwner(owner.toLowerCase() === userAddress.toLowerCase())
      } catch (err) {
        console.error('Failed to fetch owner address:', err)
        setIsOwner(false)
      }
    }
    checkOwner()
  }, [contract, userAddress])

  return (
    <div className="page-container">
      {/* Header */}
      <Header
        isConnected={!!userAddress}
        account={userAddress}
        score={score}
        onConnect={connectWallet}
        onDisconnect={handleDisconnect}
      />

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
          {!provider || !signer ? (
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
                    <Button className="btn-primary btn-large" onClick={connectWallet}>
                      <WalletIcon size={20} />
                      Connect MetaMask
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
          ) : contractError || !contract ? (
            <ContractError onRetry={handleRetry} />
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
              onScoreUpdate={(newScore) => setScore(newScore)}
            />
          )}
        </div>
      </main>
    </div>
  )
}
