'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import Header from '../components/Header'
import CreateQuestionForm from '../components/CreateQuestionForm'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { QuizGameContract } from '../lib/contract'

export default function CreateQuestionPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<QuizGameContract | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask!')
      return
    }
    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum)
      await newProvider.send('eth_requestAccounts', [])
      const newSigner = await newProvider.getSigner()
      const addr = await newSigner.getAddress()
      const gameContract = new QuizGameContract(newSigner)
      setProvider(newProvider)
      setSigner(newSigner)
      setContract(gameContract)
      setAccount(addr)
      setError(null)
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Failed to connect wallet.'
      setError(msg)
      setProvider(null)
      setSigner(null)
      setContract(null)
      setAccount(null)
    }
  }

  const disconnect = () => {
    setProvider(null)
    setSigner(null)
    setContract(null)
    setAccount(null)
  }

  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return
      try {
        const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          const newProvider = new ethers.BrowserProvider(window.ethereum)
          const newSigner = await newProvider.getSigner()
          const gameContract = new QuizGameContract(newSigner)
          setProvider(newProvider)
          setSigner(newSigner)
          setContract(gameContract)
          setAccount(accounts[0])
        }
      } catch (err) {
        console.warn('Auto-connect failed', err)
      }
    }
    autoConnect()
  }, [])

  useEffect(() => {
    const eth = (typeof window !== 'undefined' && window.ethereum) || null
    if (!eth) return
    const onAccountsChanged = async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect()
        return
      }
      try {
        const newProvider = new ethers.BrowserProvider(eth)
        const newSigner = await newProvider.getSigner()
        const gameContract = new QuizGameContract(newSigner)
        setProvider(newProvider)
        setSigner(newSigner)
        setContract(gameContract)
        setAccount(accounts[0])
      } catch (err) {
        console.error('Failed to refresh after accountsChanged', err)
        disconnect()
      }
    }
    eth.on('accountsChanged', onAccountsChanged)
    return () => {
      eth.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [])

  return (
    <div className="page-container">
      <Header
        isConnected={!!account}
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnect}
      />

      <main className="main-content">
        <div className="container" style={{ maxWidth: 980 }}>
          <section style={{ padding: '40px 0 20px' }}>
            <div className="hero-badge">
              <span className="hero-badge-text">Create Quiz</span>
            </div>
            <h1 className="hero-title" style={{ fontSize: 'clamp(28px, 5vw, 40px)', marginBottom: 10 }}>
              Publish a new question
            </h1>
            <p className="hero-description" style={{ maxWidth: 720 }}>
              Connect your wallet and commit a quiz question with a salted answer hash. Keep the salt safe to reveal later.
            </p>
          </section>

          {error && (
            <Card className="registration-card" style={{ margin: '12px 0' }}>
              <div className="error">{error}</div>
            </Card>
          )}

          {!account && (
            <Card className="registration-card" style={{ margin: '12px 0' }}>
              <p className="body-2 text-secondary" style={{ marginBottom: 12 }}>
                Connect MetaMask to start creating questions.
              </p>
              <Button variant="primary" onClick={connectWallet}>Connect MetaMask</Button>
            </Card>
          )}

          <CreateQuestionForm contract={contract} account={account} />
        </div>
      </main>
    </div>
  )
}
