'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, Sparkles, ExternalLink } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { createMetaplex, mintAccessPassNFT, GameNFTMetadata } from '@/lib/nftService';
import api from '@/lib/api';

interface NFTMinterProps {
  purchasedGameId: number;
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
  orderNumber: string;
  onSuccess?: (mintAddress: string) => void;
  onSkip?: () => void;
}

export function NFTMinter({ purchasedGameId, game, orderNumber, onSuccess, onSkip }: NFTMinterProps) {
  const wallet = useWallet();
  const { connected, walletAddress } = useSolanaWallet();
  const [minting, setMinting] = useState(false);
  const [mintedAddress, setMintedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    if (!wallet.publicKey || !connected) {
      setError('Wallet nije povezan');
      return;
    }

    setMinting(true);
    setError(null);

    try {
      const metaplex = createMetaplex(wallet);

      const metadata: GameNFTMetadata = {
        gameId: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        leagueName: game.league.name,
        sportName: game.league.sport.name,
        gameDateTime: game.game_datetime,
        orderNumber: orderNumber,
      };

      // Mint NFT
      const nft = await mintAccessPassNFT(metaplex, metadata, wallet.publicKey);

      // Update backend with NFT info
      await api.put(`/nfts/${purchasedGameId}/update`, {
        nft_mint_address: nft.mintAddress,
        nft_metadata_uri: nft.uri,
      });

      setMintedAddress(nft.mintAddress);
      onSuccess?.(nft.mintAddress);
    } catch (err: any) {
      console.error('Minting error:', err);
      setError(err.message || 'Greška pri mintovanju NFT-a');
    } finally {
      setMinting(false);
    }
  };

  const getSolscanUrl = (address: string) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
    return `https://solscan.io/token/${address}${cluster}`;
  };

  if (mintedAddress) {
    return (
      <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
          NFT uspešno mintovan! 🎉
        </h3>
        <p className="text-sm text-green-600 dark:text-green-500 mb-4">
          Tvoj Access Pass NFT je sada u tvom walletu
        </p>
        <a
          href={getSolscanUrl(mintedAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Pogledaj na Solscan
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Mintuj NFT Access Pass</h3>
          <p className="text-sm text-gray-500">Pretvori kupovinu u NFT koji možeš preprodati</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-white dark:bg-dark-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>{game.home_team} vs {game.away_team}</strong>
          <br />
          {game.league.sport.name} • {game.league.name}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleMint}
          disabled={minting || !connected}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50"
        >
          {minting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Mintovanje...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Mintuj NFT
            </>
          )}
        </button>
        
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={minting}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            Preskoči
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-center text-gray-500">
        NFT ti omogućava da preprodaš pristup meču. 5% royalty ide BetStudio-u.
      </p>
    </div>
  );
}
