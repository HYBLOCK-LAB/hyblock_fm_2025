'use client'

import { useState } from 'react'
import { QuizGameContract } from '../lib/contract'
import Button from './ui/Button'
import Card from './ui/Card'
import { InfoIcon, AwardIcon } from './icons'

interface RegistrationProps {
  contract: QuizGameContract | null
  onRegistrationComplete: (name: string) => void
}

export default function Registration({ contract, onRegistrationComplete }: RegistrationProps) {
  const [playerName, setPlayerName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string>('')

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    setIsRegistering(true)
    setError('')

    let handled = false

    try {
      // Check if contract is available
      if (!contract) {
        setError('Contract not initialized. Please refresh the page.')
        return
      }

      // Set up event listener before transaction
      const handlePlayerRegistered = (player: string, name: string) => {
        console.log('Player registered:', player, name)
        if (contract) {
          contract.removeAllListeners()
        }
        handled = true
        setIsRegistering(false)
        onRegistrationComplete(playerName.trim())
      }

      contract.onPlayerRegistered(handlePlayerRegistered)

      // Submit registration transaction
      const tx = await contract.register(playerName.trim())
      console.log('Registration transaction submitted:', tx.hash)
      
      // Wait for transaction confirmation
      await tx.wait()
      console.log('Registration transaction confirmed')

      // Fallback in case event wasn't received
      if (!handled) {
        if (contract) {
          contract.removeAllListeners()
        }
        setIsRegistering(false)
        onRegistrationComplete(playerName.trim())
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      if (contract) {
        contract.removeAllListeners()
      }
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setError('Transaction rejected. Please approve the transaction to register.')
      } else if (error.message?.includes('AlreadyRegistered')) {
        setError('You are already registered. Please refresh the page.')
        // Auto-complete registration if already registered
        setTimeout(() => onRegistrationComplete(playerName.trim()), 2000)
      } else if (error.message?.includes('EmptyName')) {
        setError('Name cannot be empty. Please enter a valid name.')
      } else {
        setError('Registration failed. Please try again.')
      }
      
      setIsRegistering(false)
    }
  }

  return (
    <Card bordered className="registration-card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
          <AwardIcon size={28} />
        </div>
        <h2 className="title" style={{ marginTop: 12 }}>Join the Quiz</h2>
        <p className="subtitle muted" style={{ marginTop: 6 }}>Enter your name to start your blockchain knowledge journey</p>
      </div>

      {error && (
        <Card className="glass-card" style={{ padding: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', marginBottom: 16 }}>
          <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>
        </Card>
      )}

      <form onSubmit={handleRegistration}>
        <label className="subtitle" style={{ display: 'block', marginBottom: 8 }}>Player Name</label>
        <input
          type="text"
          className="input-field"
          placeholder="Enter your name (e.g., CryptoMaster)"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={isRegistering}
          maxLength={50}
        />
        <div className="subtitle muted" style={{ margin: '6px 0 18px' }}>This name will be stored on the blockchain</div>

        <Button type="submit" disabled={isRegistering || !playerName.trim()} fullWidth>
          {isRegistering ? 'Registering on Blockchain…' : 'Register & Start Quiz'}
        </Button>
      </form>

      <Card className="glass-card" style={{ marginTop: 18, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ marginTop: 1 }}><InfoIcon size={16} /></div>
          <div className="subtitle muted" style={{ lineHeight: 1.5 }}>
            Registration creates a permanent record on Ethereum. Please confirm the transaction in MetaMask when prompted.
          </div>
        </div>
      </Card>
    </Card>
  )
}
