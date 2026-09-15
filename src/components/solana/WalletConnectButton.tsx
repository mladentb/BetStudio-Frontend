'use client';

import React from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

interface WalletConnectButtonProps {
  className?: string;
  showBalance?: boolean;
}

export function WalletConnectButton({ className = '', showBalance = true }: WalletConnectButtonProps) {
  const { connected, connecting, walletAddress, balance, disconnect } = useSolanaWallet();
  const { setVisible } = useWalletModal();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatBalance = (bal: number | null) => {
    if (bal === null) return '...';
    return `${bal.toFixed(4)} SOL`;
  };

  if (connecting) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-purple-600/50 text-white rounded-lg ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Povezivanje...</span>
      </button>
    );
  }

  if (connected && walletAddress) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-purple-200 text-sm font-medium">
            {formatAddress(walletAddress)}
          </span>
          {showBalance && (
            <span className="text-purple-400 text-sm">
              ({formatBalance(balance)})
            </span>
          )}
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 ${className}`}
    >
      <Wallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </button>
  );
}
