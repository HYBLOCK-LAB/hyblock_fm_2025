'use client';

import { useState } from 'react';
import Image from 'next/image';
import Button from './ui/Button';
import Card from './ui/Card';
import { TrophyIcon, WalletIcon } from './icons';

interface HeaderProps {
  isConnected: boolean;
  account: string | null;
  score: number;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Header({ isConnected, account, score, onConnect, onDisconnect }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand" style={{ marginLeft: 0 }}>
          <div className="header-logo-wrap" aria-label="HyBlock Logo">
            <Image 
              src="/assets/logo.png" 
              alt="HyBlock" 
              fill
              sizes="(max-width: 768px) 240px, 640px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        
        <div className="header-actions">
          {isConnected && (
            <div className="score-display">
              <TrophyIcon size={18} className="score-icon" />
              <div>
                <div className="overline text-tertiary">Score</div>
                <div className="title-3">{score}</div>
              </div>
            </div>
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