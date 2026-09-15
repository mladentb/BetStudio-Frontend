'use client';

import React, { useState } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, Loader2, CheckCircle, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';

interface SolanaPaymentProps {
  amountSOL: number;
  amountEUR: number;
  orderId: string;
  currency?: 'SOL' | 'USDC';
  onSuccess: (signature: string) => void;
  onError: (error: string) => void;
}

export function SolanaPayment({ 
  amountSOL, 
  amountEUR, 
  orderId, 
  currency = 'SOL',
  onSuccess, 
  onError 
}: SolanaPaymentProps) {
  const { connected, walletAddress, balance, usdcBalance, sendPayment, sendUSDCPayment } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const displayAmount = amountSOL;
  const currencySymbol = currency === 'SOL' ? '◎' : '$';
  const currencyName = currency === 'SOL' ? 'SOL' : 'USDC';
  const currentBalance = currency === 'SOL' ? balance : usdcBalance;
  const hasInsufficientFunds = currentBalance !== null && currentBalance < displayAmount;

  const handlePayment = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (hasInsufficientFunds) {
      onError(`Insufficient ${currencyName} balance`);
      return;
    }

    setIsPaying(true);
    setPaymentStatus('processing');

    try {
      const memo = `BETSTUDIO:${orderId}`;
      let signature: string | null = null;

      if (currency === 'SOL') {
        signature = await sendPayment(displayAmount, memo);
      } else {
        signature = await sendUSDCPayment(displayAmount, memo);
      }

      if (signature) {
        setTxSignature(signature);
        setPaymentStatus('success');
        onSuccess(signature);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      setPaymentStatus('error');
      onError(error.message || 'Payment error');
    } finally {
      setIsPaying(false);
    }
  };

  const getSolscanUrl = (signature: string) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
    return `https://solscan.io/tx/${signature}${cluster}`;
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Success state
  if (paymentStatus === 'success' && txSignature) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Your {currencyName} transaction has been confirmed</p>
        <a
          href={getSolscanUrl(txSignature)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
        >
          <span>View on Solscan</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 dark:bg-gray-800/50 border border-purple-200 dark:border-purple-500/30 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-600/20 rounded-full flex items-center justify-center">
          <span className="text-xl">{currencySymbol}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pay with {currencyName}</h3>
          <p className="text-sm text-gray-500">Fast & secure on Solana</p>
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500">Amount:</span>
          <span className="text-gray-900 dark:text-white font-medium">€{amountEUR.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">{currencyName}:</span>
          <span className="text-purple-600 dark:text-purple-400 font-bold text-xl font-mono">
            {currencySymbol}{displayAmount.toFixed(currency === 'SOL' ? 4 : 2)}
          </span>
        </div>
      </div>

      {/* Wallet Status */}
      {connected && walletAddress && (
        <div className="bg-gray-100 dark:bg-gray-900/30 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">Connected:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-purple-600 dark:text-purple-300 font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button onClick={copyAddress} className="text-gray-400 hover:text-gray-600">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          {/* Balance */}
          {currentBalance !== null && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">{currencyName} Balance:</span>
              <span className={`text-sm font-medium font-mono ${hasInsufficientFunds ? 'text-red-500' : 'text-green-500'}`}>
                {currencySymbol}{currentBalance.toFixed(currency === 'SOL' ? 4 : 2)}
              </span>
            </div>
          )}
          
          {/* Insufficient funds warning */}
          {hasInsufficientFunds && (
            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Insufficient {currencyName} balance</span>
            </div>
          )}
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isPaying || (connected && hasInsufficientFunds)}
        className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3 ${
          isPaying || (connected && hasInsufficientFunds)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
        }`}
      >
        {isPaying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : connected ? (
          <>
            <span className="text-xl">{currencySymbol}</span>
            <span>Pay {displayAmount.toFixed(currency === 'SOL' ? 4 : 2)} {currencyName}</span>
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Payment via Solana blockchain • Instant confirmation
      </p>
    </div>
  );
}
