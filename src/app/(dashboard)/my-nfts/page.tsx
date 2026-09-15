'use client';

import { useState, useEffect } from 'react';
import { Ticket, Loader2, ExternalLink, Wallet } from 'lucide-react';
import { NFTAccessPassCard } from '@/components/solana/NFTAccessPassCard';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import api from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';

interface NFTGame {
  id: number;
  nft_mint_address: string;
  nft_metadata_uri: string;
  game: {
    id: number;
    home_team: string;
    away_team: string;
    game_datetime: string;
    league: {
      name: string;
      sport: {
        name: string;
      };
    };
  };
}

export default function MyNFTsPage() {
  const { connected, walletAddress } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [nfts, setNfts] = useState<NFTGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFTs();
  }, []);

  const fetchNFTs = async () => {
    try {
      const { data } = await api.get('/nfts/my');
      setNfts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Ticket className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moji NFT Access Pass-ovi</h1>
            <p className="text-gray-500">{nfts.length} NFT{nfts.length !== 1 ? '-a' : ''}</p>
          </div>
        </div>

        {!connected && (
          <button
            onClick={() => setVisible(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Wallet className="h-4 w-4" />
            Poveži Wallet
          </button>
        )}
      </div>

      {/* Wallet Status */}
      {connected && walletAddress && (
        <div className="card p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-purple-700 dark:text-purple-300">
              Wallet povezan: <code className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</code>
            </span>
          </div>
        </div>
      )}

      {/* NFT Grid */}
      {nfts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="h-20 w-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ticket className="h-10 w-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nemaš NFT Access Pass-ova
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Kada kupiš pristup meču sa Solana plaćanjem, dobićeš NFT koji dokazuje tvoje vlasništvo.
            Možeš ga preprodati drugom korisniku!
          </p>
          <a
            href="/upcoming"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Pogledaj mečeve
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nfts.map((nft) => (
            <NFTAccessPassCard
              key={nft.id}
              mintAddress={nft.nft_mint_address}
              name={`${nft.game.home_team} vs ${nft.game.away_team}`}
              homeTeam={nft.game.home_team}
              awayTeam={nft.game.away_team}
              league={nft.game.league.name}
              sport={nft.game.league.sport.name}
              gameDateTime={`${formatDate(nft.game.game_datetime)} ${formatTime(nft.game.game_datetime)}`}
              onTransfer={() => {
                // TODO: Implement transfer modal
                alert('Transfer funkcionalnost dolazi uskoro!');
              }}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="card p-6 bg-gray-50 dark:bg-dark-800/50">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Kako NFT Access Pass funkcioniše?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
              <span className="text-purple-600 font-bold">1</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Kupi pristup meču plaćanjem u SOL-u
            </p>
          </div>
          <div>
            <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
              <span className="text-purple-600 font-bold">2</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Dobijaš NFT u svoj wallet kao dokaz vlasništva
            </p>
          </div>
          <div>
            <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Možeš preprodati NFT - 5% royalty ide BetStudio-u
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
