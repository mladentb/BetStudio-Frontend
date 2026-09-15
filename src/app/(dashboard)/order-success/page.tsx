'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight, Ticket, Tv, ExternalLink } from 'lucide-react';
import { NFTMinter } from '@/components/solana';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import api from '@/lib/api';
import Link from 'next/link';

interface OrderDetails {
  id: number;
  order_number: string;
  total: number;
  payment_method: string;
  solana_tx_signature?: string;
  items: {
    id: number;
    purchased_game_id: number;
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
  }[];
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { connected } = useSolanaWallet();
  
  const orderId = searchParams.get('order_id');
  const txSignature = searchParams.get('tx');
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [mintingItem, setMintingItem] = useState<number | null>(null);
  const [mintedItems, setMintedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/my-orders/${orderId}`);
      setOrder(data.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMintSuccess = (itemId: number, mintAddress: string) => {
    setMintedItems(prev => new Set(prev).add(itemId));
    setMintingItem(null);
  };

  const getSolscanUrl = (signature: string) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
    return `https://solscan.io/tx/${signature}${cluster}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Narudžbina nije pronađena
        </h1>
        <Link href="/upcoming" className="text-purple-600 hover:text-purple-700">
          Vrati se na mečeve
        </Link>
      </div>
    );
  }

  const isSolanaPayment = order.payment_method === 'solana';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Kupovina uspešna! 🎉
        </h1>
        <p className="text-gray-500">
          Narudžbina #{order.order_number}
        </p>
        
        {txSignature && (
          <a
            href={getSolscanUrl(txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-purple-600 hover:text-purple-700 transition-colors"
          >
            <span>Pogledaj transakciju na Solscan</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Purchased Items */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Kupljeni mečevi
        </h2>
        
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="border border-gray-200 dark:border-dark-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {item.game.home_team} vs {item.game.away_team}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.game.league.sport.name} • {item.game.league.name}
                  </p>
                </div>
                
                {mintedItems.has(item.id) ? (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    NFT Mintovan ✓
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                    Pristup aktivan
                  </span>
                )}
              </div>

              {/* NFT Minting Option - Only for Solana payments */}
              {isSolanaPayment && connected && !mintedItems.has(item.id) && (
                <div className="mt-4">
                  {mintingItem === item.id ? (
                    <NFTMinter
                      purchasedGameId={item.purchased_game_id}
                      game={item.game}
                      orderNumber={order.order_number}
                      onSuccess={(mintAddress) => handleMintSuccess(item.id, mintAddress)}
                      onSkip={() => setMintingItem(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setMintingItem(item.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <Ticket className="h-5 w-5" />
                      Mintuj NFT Access Pass
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* NFT Info */}
      {isSolanaPayment && connected && (
        <div className="card p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
            Zašto mintovati NFT?
          </h3>
          <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
            <li>• NFT je dokaz vlasništva na blockchainu</li>
            <li>• Možeš preprodati pristup meču drugom korisniku</li>
            <li>• 5% royalty od preprodaje ide BetStudio-u</li>
            <li>• NFT ostaje u tvom walletu zauvek</li>
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/my-games"
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
        >
          <Tv className="h-5 w-5" />
          Idi na Moje Mečeve
        </Link>
        <Link
          href="/my-nfts"
          className="flex-1 flex items-center justify-center gap-2 py-4 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          <Ticket className="h-5 w-5" />
          Moji NFT-ovi
        </Link>
      </div>
    </div>
  );
}
