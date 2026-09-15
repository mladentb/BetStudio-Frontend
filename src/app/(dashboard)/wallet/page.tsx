'use client';

import { useState, useEffect } from 'react';
import { Wallet, Shield, ExternalLink, Copy, Check, AlertCircle, Unlink, Loader2 } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const { connected, walletAddress, balance, disconnect } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-save wallet when connected
  useEffect(() => {
    if (connected && walletAddress && user?.id) {
      // Only save if different from current
      if (walletAddress !== user.wallet_address) {
        saveWalletAddress(walletAddress);
      }
    }
  }, [connected, walletAddress, user?.id]);

  const saveWalletAddress = async (address: string | null) => {
    setSaving(true);
    try {
      await api.put('/user/wallet', { wallet_address: address });
      await refreshUser();
    } catch (error) {
      console.error('Failed to save wallet:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const addr = walletAddress || user?.wallet_address;
    if (addr) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    await saveWalletAddress(null);
  };

  const getSolscanUrl = (address: string) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
    return `https://solscan.io/account/${address}${cluster}`;
  };

  const displayAddress = walletAddress || user?.wallet_address;
  const isConnected = connected && walletAddress;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <Wallet className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moj Wallet</h1>
          <p className="text-gray-500">Poveži Solana wallet za crypto plaćanja</p>
        </div>
        {saving && (
          <div className="ml-auto flex items-center gap-2 text-purple-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Čuvanje...</span>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="card p-6">
        {isConnected ? (
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">Wallet povezan</p>
                <p className="text-sm text-green-600 dark:text-green-500">Možeš koristiti SOL za plaćanje</p>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Wallet adresa</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-gray-100 dark:bg-dark-800 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 overflow-hidden text-ellipsis">
                    {walletAddress}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-3 bg-gray-100 dark:bg-dark-800 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                    title="Kopiraj adresu"
                  >
                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-gray-500" />}
                  </button>
                  <a
                    href={getSolscanUrl(walletAddress!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-100 dark:bg-dark-800 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                    title="Pogledaj na Solscan"
                  >
                    <ExternalLink className="h-5 w-5 text-gray-500" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Stanje</label>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">◎</span>
                    <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                      {balance !== null ? balance.toFixed(4) : '...'}
                    </span>
                    <span className="text-lg text-purple-500">SOL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-2 w-full py-3 border border-red-300 dark:border-red-800 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Unlink className="h-5 w-5" />
              Disconnectuj wallet
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="h-20 w-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Poveži svoj Solana wallet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Povezivanjem walleta možeš plaćati direktno u SOL kriptovaluti. 
              Podržavamo Phantom i druge Solana wallete.
            </p>
            
            <button
              onClick={() => setVisible(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <Wallet className="h-5 w-5" />
              Poveži Wallet
            </button>

            {user?.wallet_address && !connected && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Prethodno povezan wallet
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 font-mono mt-1">
                      {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-8)}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      Poveži wallet ponovo da nastaviš koristiti crypto plaćanja
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Sigurno plaćanje</h4>
              <p className="text-sm text-gray-500 mt-1">
                Transakcije se izvršavaju direktno na Solana blockchainu. Nikada ne čuvamo tvoje privatne ključeve.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">◎</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Niski troškovi</h4>
              <p className="text-sm text-gray-500 mt-1">
                Solana transakcije koštaju manje od $0.01, mnogo jeftinije od tradicionalnih payment procesora.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="card p-4 bg-gray-50 dark:bg-dark-800/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Mreža:</span>
          <span className="text-sm font-medium text-purple-600">
            {process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' ? 'Mainnet' : 'Devnet (testiranje)'}
          </span>
        </div>
      </div>
    </div>
  );
}
