'use client';

import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Configuration
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK as any);
const BETSTUDIO_WALLET = process.env.NEXT_PUBLIC_BETSTUDIO_WALLET || '';

// Royalty percentage for secondary sales (500 = 5%)
const ROYALTY_BASIS_POINTS = 500;

export interface GameNFTMetadata {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  sportName: string;
  gameDateTime: string;
  orderNumber: string;
}

export interface MintedNFT {
  mintAddress: string;
  metadataAddress: string;
  name: string;
  uri: string;
}

/**
 * Create Metaplex instance with wallet adapter
 */
export function createMetaplex(wallet: WalletContextState): Metaplex {
  const connection = new Connection(SOLANA_RPC_URL);
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  return metaplex;
}

/**
 * Generate NFT metadata JSON for a game access pass
 */
export function generateNFTMetadata(game: GameNFTMetadata): object {
  return {
    name: `BetStudio Pass: ${game.homeTeam} vs ${game.awayTeam}`,
    symbol: 'BSPASS',
    description: `Access pass for streaming ${game.homeTeam} vs ${game.awayTeam} - ${game.leagueName} (${game.sportName}). Game date: ${game.gameDateTime}. Order: ${game.orderNumber}`,
    image: `https://betstudio.com/api/nft-image/${game.gameId}`, // Placeholder - will generate dynamic image
    external_url: `https://betstudio.com/game/${game.gameId}`,
    attributes: [
      { trait_type: 'Sport', value: game.sportName },
      { trait_type: 'League', value: game.leagueName },
      { trait_type: 'Home Team', value: game.homeTeam },
      { trait_type: 'Away Team', value: game.awayTeam },
      { trait_type: 'Game Date', value: game.gameDateTime },
      { trait_type: 'Order Number', value: game.orderNumber },
      { trait_type: 'Type', value: 'Stream Access Pass' },
    ],
    properties: {
      files: [],
      category: 'ticket',
      creators: [
        {
          address: BETSTUDIO_WALLET,
          share: 100,
        },
      ],
    },
    seller_fee_basis_points: ROYALTY_BASIS_POINTS,
  };
}

/**
 * Upload metadata to Arweave/IPFS via Metaplex
 */
export async function uploadMetadata(
  metaplex: Metaplex,
  metadata: object
): Promise<string> {
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);
  return uri;
}

/**
 * Mint a new NFT access pass
 */
export async function mintAccessPassNFT(
  metaplex: Metaplex,
  game: GameNFTMetadata,
  recipientWallet: PublicKey
): Promise<MintedNFT> {
  // Generate and upload metadata
  const metadata = generateNFTMetadata(game);
  const uri = await uploadMetadata(metaplex, metadata);

  // Mint NFT
  const { nft } = await metaplex.nfts().create({
    uri,
    name: `BetStudio Pass: ${game.homeTeam} vs ${game.awayTeam}`,
    symbol: 'BSPASS',
    sellerFeeBasisPoints: ROYALTY_BASIS_POINTS,
    tokenOwner: recipientWallet,
    creators: [
      {
        address: new PublicKey(BETSTUDIO_WALLET),
        share: 100,
      },
    ],
  });

  return {
    mintAddress: nft.address.toBase58(),
    metadataAddress: nft.metadataAddress.toBase58(),
    name: nft.name,
    uri: nft.uri,
  };
}

/**
 * Verify if a wallet owns an NFT for a specific game
 */
export async function verifyNFTOwnership(
  metaplex: Metaplex,
  walletAddress: PublicKey,
  gameId: number
): Promise<boolean> {
  try {
    // Find all NFTs owned by the wallet
    const nfts = await metaplex.nfts().findAllByOwner({ owner: walletAddress });

    // Check if any NFT matches the game
    for (const nft of nfts) {
      if (nft.symbol === 'BSPASS') {
        // Load full metadata
        const fullNft = await metaplex.nfts().load({ metadata: nft as any });
        
        // Check if this NFT is for the requested game
        const attributes = (fullNft.json?.attributes as any[]) || [];
        const gameIdAttr = attributes.find(
          (attr) => attr.trait_type === 'Game ID' && attr.value === gameId.toString()
        );
        
        if (gameIdAttr) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying NFT ownership:', error);
    return false;
  }
}

/**
 * Get all BetStudio NFTs owned by a wallet
 */
export async function getOwnedAccessPasses(
  metaplex: Metaplex,
  walletAddress: PublicKey
): Promise<MintedNFT[]> {
  try {
    const nfts = await metaplex.nfts().findAllByOwner({ owner: walletAddress });
    
    const accessPasses: MintedNFT[] = [];
    
    for (const nft of nfts) {
      if (nft.symbol === 'BSPASS') {
        accessPasses.push({
          mintAddress: nft.address.toBase58(),
          metadataAddress: nft.address.toBase58(),
          name: nft.name,
          uri: nft.uri,
        });
      }
    }

    return accessPasses;
  } catch (error) {
    console.error('Error fetching owned NFTs:', error);
    return [];
  }
}

/**
 * Transfer NFT to another wallet (for resale)
 */
export async function transferNFT(
  metaplex: Metaplex,
  mintAddress: PublicKey,
  toWallet: PublicKey
): Promise<string> {
  const { response } = await metaplex.nfts().transfer({
    nftOrSft: { address: mintAddress, tokenStandard: 0 } as any,
    toOwner: toWallet,
  });

  return response.signature;
}
