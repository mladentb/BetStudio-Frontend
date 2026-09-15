'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, Trash2, Building2, Check, ArrowRight, Percent, Wallet, Copy, ExternalLink } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import { SolanaPayment } from '@/components/solana';
import api from '@/lib/api';

// Solana wallet address for receiving payments
const SOLANA_WALLET_ADDRESS = 'BETxSqBHHKBRbeYbhLryd1ydDuxsmGiq26m6B2NjCeDj';

// Bank account details
const BANK_DETAILS = {
  bank_name: 'Banca Intesa',
  account_holder: 'BetStudio d.o.o.',
  iban: 'RS35160005400000000000',
  swift: 'DBDBRSBG',
  reference_prefix: 'BS-'
};

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, clearCart, checkout, isLoading, refetch } = useCart();
  const { rates, currency } = useCurrency();
  const { t } = useLanguage();
  const [selectedPayment, setSelectedPayment] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<'SOL' | 'USDC'>('SOL');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);
  const [cartData, setCartData] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [copied, setCopied] = useState('');

  const PAYMENT_METHODS = [
    { 
      id: 'solana', 
      name: 'Crypto (SOL/USDC)', 
      icon: Wallet, 
      description: 'Pay with Solana wallet',
      color: 'purple'
    },
    { 
      id: 'bank_transfer', 
      name: t('cart.bankTransfer'), 
      icon: Building2, 
      description: 'Wire transfer / Invoice',
      color: 'blue'
    },
  ];

  // Fetch cart with discount info
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const { data } = await api.get('/cart');
        setCartData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCartData();
  }, [items]);

  const subtotal = cartData?.subtotal || 0;
  const discountPercent = cartData?.discount_percent || 0;
  const discountAmount = cartData?.discount_amount || 0;
  const tax = cartData?.tax || 0;
  const total = cartData?.total || 0;

  // Calculate crypto amounts
  const solRate = rates.SOL || 0.0067;
  const usdcRate = rates.USDC || 1.08; // 1 EUR = ~1.08 USDC
  const totalInSOL = total * solRate;
  const totalInUSDC = total * usdcRate;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleCheckout = async () => {
    if (!selectedPayment) return alert(t('cart.selectPayment'));
    
    setIsCheckingOut(true);
    
    try {
      if (selectedPayment === 'solana') {
        // Create pending order for crypto payment
        const { data } = await api.post('/orders/create-pending', {
          payment_method: selectedCrypto === 'SOL' ? 'solana' : 'usdc',
          crypto_currency: selectedCrypto
        });
        setPendingOrder(data.order);
      } else if (selectedPayment === 'bank_transfer') {
        // Create order with bank transfer - status will be pending
        const result = await checkout('bank_transfer');
        setOrderComplete({
          ...result,
          payment_method: 'bank_transfer'
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || t('common.error'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSolanaPaymentSuccess = async (signature: string) => {
    if (!pendingOrder) return;

    try {
      const { data } = await api.post(`/orders/${pendingOrder.id}/confirm-solana`, {
        tx_signature: signature,
        crypto_currency: selectedCrypto
      });
      
      clearCart();
      setOrderComplete({
        order: data.order,
        payment_method: 'solana',
        tx_signature: signature
      });
    } catch (err: any) {
      console.error('Failed to confirm payment:', err);
      alert('Payment received! TX: ' + signature + '\nContact support if order not confirmed.');
    }
  };

  const handleSolanaPaymentError = (error: string) => {
    alert(t('common.error') + ': ' + error);
    setPendingOrder(null);
  };

  // Order Complete Screen
  if (orderComplete) {
    const isBankTransfer = orderComplete.payment_method === 'bank_transfer';
    const isCrypto = orderComplete.payment_method === 'solana';

    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="card p-8 text-center">
          <div className={cn(
            'h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6',
            isBankTransfer ? 'bg-blue-100' : 'bg-green-100'
          )}>
            {isBankTransfer ? (
              <Building2 className="h-10 w-10 text-blue-600" />
            ) : (
              <Check className="h-10 w-10 text-green-600" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isBankTransfer ? 'Order Created!' : t('cart.purchaseSuccess') + '!'}
          </h1>
          
          <p className="text-gray-500 mb-2">
            Order #: <span className="font-mono font-bold">{orderComplete.order?.order_number}</span>
          </p>

          {isCrypto && orderComplete.tx_signature && (
            <p className="text-sm text-gray-500 mb-4">
              TX: <a 
                href={`https://solscan.io/tx/${orderComplete.tx_signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline font-mono"
              >
                {orderComplete.tx_signature.slice(0, 20)}...
              </a>
            </p>
          )}

          {/* Bank Transfer Instructions */}
          {isBankTransfer && (
            <div className="mt-6 text-left bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Transfer Instructions
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-white dark:bg-dark-800 rounded">
                  <span className="text-gray-500">Bank:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{BANK_DETAILS.bank_name}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white dark:bg-dark-800 rounded">
                  <span className="text-gray-500">Recipient:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{BANK_DETAILS.account_holder}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white dark:bg-dark-800 rounded">
                  <span className="text-gray-500">IBAN:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-900 dark:text-white">{BANK_DETAILS.iban}</span>
                    <button onClick={() => copyToClipboard(BANK_DETAILS.iban, 'iban')} className="text-blue-600 hover:text-blue-700">
                      {copied === 'iban' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-white dark:bg-dark-800 rounded">
                  <span className="text-gray-500">SWIFT/BIC:</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">{BANK_DETAILS.swift}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white dark:bg-dark-800 rounded">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-bold text-lg text-blue-600">€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300 dark:border-yellow-700">
                  <span className="text-yellow-700 dark:text-yellow-300">Reference:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-yellow-800 dark:text-yellow-200">
                      {BANK_DETAILS.reference_prefix}{orderComplete.order?.order_number}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(`${BANK_DETAILS.reference_prefix}${orderComplete.order?.order_number}`, 'ref')} 
                      className="text-yellow-700 hover:text-yellow-800"
                    >
                      {copied === 'ref' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-blue-600 dark:text-blue-400">
                ⚠️ Important: Include the reference number in your payment. 
                Your order will be activated within 24h of receiving payment.
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center mt-8">
            <button onClick={() => router.push('/my-games')} className="btn-primary flex items-center gap-2">
              {t('nav.myGames')} <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => router.push('/')} className="btn-secondary">
              {t('nav.home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
          <ShoppingCart className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cart.title')}</h1>
          <p className="text-gray-500">{t('cart.itemsCount', { count: items.length })}</p>
        </div>
        {discountPercent > 0 && (
          <div className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Percent className="h-4 w-4" />
            {discountPercent}% {t('cart.discount')}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('cart.empty')}</h3>
          <p className="text-gray-500 mb-6">{t('cart.emptyDesc')}</p>
          <button onClick={() => router.push('/upcoming')} className="btn-primary">
            {t('cart.browseGames')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const game = item.game;
              const sportSlug = game?.league?.sport?.slug || 'rukomet';
              const SportIcon = getSportIcon(sportSlug);
              const colors = getSportColors(sportSlug);

              return (
                <div key={item.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', colors.bg)}>
                        <SportIcon className={cn('h-6 w-6', colors.text)} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{game?.league?.sport?.name} • {game?.league?.name}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{game?.home_team} vs {game?.away_team}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(game?.game_datetime)} {formatTime(game?.game_datetime)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">€{Number(item.price).toFixed(2)}</p>
                      <button
                        onClick={() => removeFromCart(item.game_id)}
                        className="text-red-500 hover:text-red-600 mt-2 flex items-center gap-1 text-sm"
                      >
                        <Trash2 className="h-4 w-4" /> {t('cart.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button onClick={clearCart} className="text-red-500 hover:text-red-600 text-sm">
              {t('cart.clearCart')}
            </button>
          </div>

          {/* Checkout Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-6 space-y-6">
              {/* Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('cart.summary')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('cart.subtotal')}</span>
                    <span className="text-gray-900 dark:text-white">€{subtotal.toFixed(2)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {t('cart.discount')} ({discountPercent}%)
                      </span>
                      <span>-€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('cart.tax')}</span>
                    <span className="text-gray-900 dark:text-white">€{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                    <span className="text-gray-900 dark:text-white">{t('cart.total')}</span>
                    <span className="text-primary-600">€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Show Solana Payment if pending order exists */}
              {selectedPayment === 'solana' && pendingOrder ? (
                <div className="space-y-4">
                  {/* Crypto Amount Display */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                    <p className="text-sm text-purple-600 dark:text-purple-400">Amount to pay:</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 font-mono">
                      {selectedCrypto === 'SOL' ? `◎${totalInSOL.toFixed(4)}` : `$${totalInUSDC.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-gray-500">≈ €{total.toFixed(2)}</p>
                  </div>

                  <SolanaPayment
                    amountSOL={selectedCrypto === 'SOL' ? totalInSOL : totalInUSDC}
                    amountEUR={total}
                    orderId={pendingOrder.order_number}
                    currency={selectedCrypto}
                    onSuccess={handleSolanaPaymentSuccess}
                    onError={handleSolanaPaymentError}
                  />

                  <button 
                    onClick={() => setPendingOrder(null)} 
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to payment methods
                  </button>
                </div>
              ) : (
                <>
                  {/* Payment Methods */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('cart.paymentMethod')}</h3>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          key={method.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                            selectedPayment === method.id
                              ? method.color === 'purple' 
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-200'
                                : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200'
                              : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                          )}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={selectedPayment === method.id}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="sr-only"
                          />
                          <method.icon className={cn(
                            'h-6 w-6',
                            selectedPayment === method.id 
                              ? method.color === 'purple' ? 'text-purple-500' : 'text-blue-500'
                              : 'text-gray-400'
                          )} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
                            <p className="text-xs text-gray-500">{method.description}</p>
                          </div>
                          {selectedPayment === method.id && (
                            <Check className={cn(
                              'h-5 w-5',
                              method.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
                            )} />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Crypto Currency Selector (when Solana selected) */}
                  {selectedPayment === 'solana' && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">Select currency:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCrypto('SOL')}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all',
                            selectedCrypto === 'SOL'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                          )}
                        >
                          ◎ SOL
                        </button>
                        <button
                          onClick={() => setSelectedCrypto('USDC')}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all',
                            selectedCrypto === 'USDC'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                          )}
                        >
                          $ USDC
                        </button>
                      </div>
                      <p className="text-center text-sm text-purple-600 dark:text-purple-400 mt-3 font-mono">
                        {selectedCrypto === 'SOL' ? `◎${totalInSOL.toFixed(4)}` : `$${totalInUSDC.toFixed(2)}`}
                      </p>
                    </div>
                  )}

                  {/* Bank Transfer Info (when selected) */}
                  {selectedPayment === 'bank_transfer' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> After checkout, you'll receive bank transfer instructions. 
                        Your order will be activated once payment is confirmed (usually within 24h).
                      </p>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={!selectedPayment || isCheckingOut || isLoading}
                    className={cn(
                      'w-full py-3 flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-50',
                      selectedPayment === 'solana'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'
                    )}
                  >
                    {isCheckingOut ? t('common.loading') : (
                      <>
                        {selectedPayment === 'solana' ? 'Connect Wallet & Pay' : t('cart.checkout')}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              <p className="text-xs text-gray-500 text-center">
                Secure payment • 256-bit encryption
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
