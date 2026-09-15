'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check, Ticket, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NFTAccessPassCardProps {
  mintAddress: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  gameDateTime: string;
  imageUrl?: string;
  onTransfer?: () => void;
}

export function NFTAccessPassCard({
  mintAddress,
  name,
  homeTeam,
  awayTeam,
  league,
  sport,
  gameDateTime,
  imageUrl,
  onTransfer,
}: NFTAccessPassCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSolscanUrl = () => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
    return `https://solscan.io/token/${mintAddress}${cluster}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-1">
      {/* Holographic effect border */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-50 blur-sm animate-pulse" />
      
      <div className="relative bg-gray-900 rounded-xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-purple-400 font-medium">NFT ACCESS PASS</p>
              <p className="text-xs text-gray-500">BSPASS</p>
            </div>
          </div>
          <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
            <span className="text-xs text-green-400 font-medium">VALID</span>
          </div>
        </div>

        {/* Game Info */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">{sport} • {league}</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-xl font-bold text-white">{homeTeam}</span>
            <span className="text-purple-400 text-lg">vs</span>
            <span className="text-xl font-bold text-white">{awayTeam}</span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{gameDateTime}</span>
        </div>

        {/* NFT Address */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">NFT Mint Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-purple-300 truncate">
              {mintAddress}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400" />
              )}
            </button>
            <a
              href={getSolscanUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => window.open(getSolscanUrl(), '_blank')}
            className="flex-1 py-2 px-4 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition-colors"
          >
            View on Solscan
          </button>
          {onTransfer && (
            <button
              onClick={onTransfer}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-colors"
            >
              Transfer / Sell
            </button>
          )}
        </div>

        {/* Royalty info */}
        <p className="text-xs text-center text-gray-500">
          5% royalty on secondary sales goes to BetStudio
        </p>
      </div>
    </div>
  );
}
