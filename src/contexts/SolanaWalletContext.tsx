'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { 
  clusterApiUrl, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionInstruction 
} from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Solana network configuration
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK as any);

// BetStudio wallet address for receiving payments
const BETSTUDIO_WALLET = process.env.NEXT_PUBLIC_BETSTUDIO_WALLET || '';

// USDC Token Mint addresses
const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet USDC
const USDC_MINT = SOLANA_NETWORK === 'mainnet-beta' ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
const USDC_DECIMALS = 6;

interface SolanaContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  walletAddress: string | null;
  balance: number | null;
  usdcBalance: number | null;
  connecting: boolean;
  disconnect: () => Promise<void>;
  sendPayment: (amountSOL: number, memo?: string) => Promise<string | null>;
  sendUSDCPayment: (amountUSDC: number, memo?: string) => Promise<string | null>;
  getBalance: () => Promise<number | null>;
  getUSDCBalance: () => Promise<number | null>;
}

const SolanaContext = createContext<SolanaContextType | undefined>(undefined);

function SolanaWalletContextProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, connecting, disconnect, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = React.useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = React.useState<number | null>(null);

  const walletAddress = useMemo(() => {
    return publicKey ? publicKey.toBase58() : null;
  }, [publicKey]);

  // Fetch balances when connected
  React.useEffect(() => {
    if (connected && publicKey) {
      getBalance();
      getUSDCBalance();
    } else {
      setBalance(null);
      setUsdcBalance(null);
    }
  }, [connected, publicKey]);

  const getBalance = async (): Promise<number | null> => {
    if (!publicKey || !connection) return null;
    
    try {
      const bal = await connection.getBalance(publicKey);
      const solBalance = bal / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      return solBalance;
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return null;
    }
  };

  const getUSDCBalance = async (): Promise<number | null> => {
    if (!publicKey || !connection) return null;
    
    try {
      const usdcMint = new PublicKey(USDC_MINT);
      const tokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
      
      try {
        const account = await getAccount(connection, tokenAccount);
        const balance = Number(account.amount) / Math.pow(10, USDC_DECIMALS);
        setUsdcBalance(balance);
        return balance;
      } catch {
        // Token account doesn't exist yet
        setUsdcBalance(0);
        return 0;
      }
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      return null;
    }
  };

  const sendPayment = async (amountSOL: number, memo?: string): Promise<string | null> => {
    if (!publicKey || !connected || !BETSTUDIO_WALLET) {
      console.error('Wallet not connected or BetStudio wallet not configured');
      return null;
    }

    try {
      const recipientPubkey = new PublicKey(BETSTUDIO_WALLET);
      const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      // Add memo if provided (for order identification)
      if (memo) {
        const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        transaction.add({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(memo),
        });
      }

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      // Refresh balance after payment
      await getBalance();

      return signature;
    } catch (error) {
      console.error('SOL Payment error:', error);
      throw error;
    }
  };

  const sendUSDCPayment = async (amountUSDC: number, memo?: string): Promise<string | null> => {
    if (!publicKey || !connected || !BETSTUDIO_WALLET) {
      console.error('Wallet not connected or BetStudio wallet not configured');
      return null;
    }

    try {
      const usdcMint = new PublicKey(USDC_MINT);
      const recipientPubkey = new PublicKey(BETSTUDIO_WALLET);
      
      // Get sender's token account
      const senderTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
      
      // Get recipient's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(usdcMint, recipientPubkey);
      
      // Calculate amount in smallest units (6 decimals for USDC)
      const amount = Math.round(amountUSDC * Math.pow(10, USDC_DECIMALS));

      const transaction = new Transaction();

      // Check if recipient token account exists, if not create it
      try {
        await getAccount(connection, recipientTokenAccount);
      } catch {
        // Account doesn't exist, add instruction to create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            recipientTokenAccount,
            recipientPubkey,
            usdcMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Add memo if provided
      if (memo) {
        const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        transaction.add({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(memo),
        });
      }

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('USDC Transaction failed');
      }

      // Refresh balances after payment
      await getBalance();
      await getUSDCBalance();

      return signature;
    } catch (error) {
      console.error('USDC Payment error:', error);
      throw error;
    }
  };

  const value: SolanaContextType = {
    connected,
    publicKey,
    walletAddress,
    balance,
    usdcBalance,
    connecting,
    disconnect,
    sendPayment,
    sendUSDCPayment,
    getBalance,
    getUSDCBalance,
  };

  return (
    <SolanaContext.Provider value={value}>
      {children}
    </SolanaContext.Provider>
  );
}

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaWalletContextProvider>
            {children}
          </SolanaWalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useSolanaWallet() {
  const context = useContext(SolanaContext);
  if (context === undefined) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
}

// Re-export useWallet for direct access to wallet modal
export { useWallet } from '@solana/wallet-adapter-react';
