'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from './ui/Button';
import { TrophyIcon, WalletIcon } from './icons';
import { getStoredScore } from '../lib/scoreStore';

interface HeaderProps {
  isConnected: boolean;
  account: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Header({ isConnected, account, onConnect, onDisconnect }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [displayScore, setDisplayScore] = useState<number>(getStoredScore());

  useEffect(() => {
    const sync = () => setDisplayScore(getStoredScore());
    sync();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', sync);
      return () => window.removeEventListener('focus', sync);
    }
  }, []);

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

          {!isConnected && (
            <Button variant="primary" onClick={onConnect} style={{ whiteSpace: 'nowrap' }}>
              Connect MetaMask
            </Button>
          )}

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
          
          {isConnected ? (
            <div className="wallet-menu">
              <div 
                className="wallet-trigger"
                onClick={() => setOpen(!open)}
              >
                <div className="wallet-status"></div>
                <WalletIcon size={18} />
                <span className="body-2 mono">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}
                </span>
              </div>
              
              {open && (
                <div className="wallet-dropdown">
                  <div style={{ marginBottom: '16px' }}>
                    <div className="title-3" style={{ marginBottom: '8px' }}>Connected Wallet</div>
                    <div className="caption text-tertiary mono" style={{ 
                      wordBreak: 'break-all',
                      padding: '12px',
                      background: 'var(--surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      {account}
                    </div>
                  </div>
                  <Button 
                    variant="danger" 
                    onClick={() => { onDisconnect(); setOpen(false); }} 
                    fullWidth
                  >
                    Disconnect Wallet
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
