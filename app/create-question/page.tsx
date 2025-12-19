'use client'

import Header from '../components/Header'
import CreateQuestionForm from '../components/CreateQuestionForm'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useQuizContract } from '../hooks/useQuizContract'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export default function CreateQuestionPage() {
  const { contract, account, error } = useQuizContract()
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  return (
    <div className="page-container">
      <Header />

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

          {!isConnected && (
            <Card className="registration-card" style={{ margin: '12px 0' }}>
              <p className="body-2 text-secondary" style={{ marginBottom: 12 }}>
                Connect a wallet to start creating questions.
              </p>
              <Button variant="primary" onClick={() => openConnectModal?.()}>
                Connect Wallet
              </Button>
            </Card>
          )}

          <CreateQuestionForm contract={contract} account={account} />
        </div>
      </main>
    </div>
  )
}
