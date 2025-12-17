'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

interface WalletConnectionProps {
  onWalletConnected: (
    provider: ethers.BrowserProvider,
    signer: ethers.JsonRpcSigner,
    address: string
  ) => void
}

export default function WalletConnection({ onWalletConnected }: WalletConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string>('')

  const addSepoliaNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7', // 11155111 in hex
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://sepolia.infura.io/v3/'],
          blockExplorerUrls: ['https://sepolia.etherscan.io/']
        }]
      })
    } catch (error) {
      console.log('Failed to add Sepolia network:', error)
      throw error
    }
  }

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }] // 11155111 in hex
      })
    } catch (error: any) {
      // Network not added yet
      if (error.code === 4902) {
        await addSepoliaNetwork()
      } else {
        throw error
      }
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to use this application.')
      return
    }

    setIsConnecting(true)
    setError('')

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      
      // Check if we're on Sepolia (11155111)
      if (network.chainId !== BigInt(11155111)) {
        console.log('Wrong network, switching to Sepolia...')
        await switchToSepolia()
        // Refresh provider after network switch
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      console.log('Connected to Sepolia network:', address)
      onWalletConnected(provider, signer, address)
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      if (error.code === 4001) {
        setError('Connection rejected. Please approve the connection to continue.')
      } else if (error.code === 4902) {
        setError('Failed to add Sepolia network. Please try again.')
      } else {
        setError('Failed to connect wallet. Please try again.')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="card">
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', color: '#333' }}>
          Connect Your Wallet
        </h2>
        <p style={{ marginBottom: '32px', color: '#666' }}>
          Connect your MetaMask wallet to participate in the quiz.<br/>
          We'll automatically set up Sepolia testnet for you!
        </p>
        
        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <button
          className="button"
          onClick={connectWallet}
          disabled={isConnecting}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            minWidth: '200px'
          }}
        >
          {isConnecting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
              Connecting...
            </span>
          ) : (
            'Connect MetaMask'
          )}
        </button>

        <div style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
          <p>Don't have MetaMask?</p>
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#0070f3', textDecoration: 'underline' }}
          >
            Download MetaMask
          </a>
        </div>
      </div>
    </div>
  )
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}