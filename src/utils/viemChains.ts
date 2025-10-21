// src/utils/viemChains.ts
import { 
  base, 
  baseSepolia, 
  ink, 
  inkSepolia, 
  optimism, 
  optimismSepolia, 
  arbitrum,
  arbitrumSepolia,
  soneium, 
  soneiumMinato,
  unichain,
  unichainSepolia,
  lisk,
  liskSepolia,
} from 'viem/chains';
import { defineChain } from 'viem';
import { chainConfig } from 'viem/op-stack';
import type { Chain } from 'viem';

// Custom chains not in viem/chains
export const teaSepolia = defineChain({
  id: 10218,
  name: 'Tea Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Tea',
    symbol: 'TEA',
  },
  rpcUrls: {
    default: { 
      http: [process.env.NEXT_PUBLIC_TEA_SEPOLIA_RPC_URL || 'https://tea-sepolia.g.alchemy.com/public'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'Tea Explorer', 
      url: process.env.NEXT_PUBLIC_TEA_BLOCK_EXPLORER || 'https://sepolia.tea.xyz' 
    },
  },
  testnet: true,
});

export const monadTestnet = defineChain({
  ...chainConfig,
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { 
      http: [process.env.MONAD_TESTNET_RPC_URL || 'https://testnet-rpc.monad.xyz'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'Monad Explorer', 
      url: 'https://testnet-explorer.monad.xyz' 
    },
  },
  testnet: true,
});

export const megaethTestnet = defineChain({
  ...chainConfig,
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { 
      http: [process.env.MEGAETH_TESTNET_RPC_URL || 'https://carrot.megaeth.com/rpc'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'MegaETH Explorer', 
      url: 'https://explorer.megaeth.com' 
    },
  },
  testnet: true,
});

export const abstractTestnet = defineChain({
  ...chainConfig,
  id: 11124,
  name: 'Abstract Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { 
      http: [process.env.ABSTRACT_TESTNET_RPC_URL || 'https://api.testnet.abs.xyz'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'Abstract Explorer', 
      url: 'https://explorer.testnet.abs.xyz' 
    },
  },
  testnet: true,
});

export const humanityTestnet = defineChain({
  id: 1942999413,
  name: 'Humanity Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { 
      http: ['https://rpc.testnet.humanity.org'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'Humanity Explorer', 
      url: 'https://explorer.testnet.humanity.org' 
    },
  },
  testnet: true,
});

export const chainbaseTestnet = defineChain({
  id: 8453, // Note: Same as Base, might need clarification
  name: 'Chainbase Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { 
      http: ['https://rpc.testnet.chainbase.com'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'Chainbase Explorer', 
      url: 'https://explorer.testnet.chainbase.com' 
    },
  },
  testnet: true,
});

// Map chain IDs to viem chain objects
export const VIEM_CHAINS: Record<number, Chain> = {
  // Mainnets
  8453: base,
  1868: soneium,
  57073: ink,
  10: optimism,
  42161: arbitrum,
  1135: lisk,
  
  // Testnets
  84532: baseSepolia,
  1946: soneiumMinato,
  763373: inkSepolia,
  11155420: optimismSepolia,
  421614: arbitrumSepolia,
  1301: unichainSepolia,
  4202: liskSepolia,
  10218: teaSepolia,
  10143: monadTestnet,
  6342: megaethTestnet,
  11124: abstractTestnet,
  1942999413: humanityTestnet,
};

/**
 * Get viem chain object by chain ID
 */
export const getViemChain = (chainId: number): Chain | undefined => {
  return VIEM_CHAINS[chainId];
};

/**
 * Check if chain is supported by viem
 */
export const isViemChainSupported = (chainId: number): boolean => {
  return chainId in VIEM_CHAINS;
};