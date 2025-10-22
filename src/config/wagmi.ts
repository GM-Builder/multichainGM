// src/config/wagmi.ts
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { Chain } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

const soneium: Chain = {
  id: 1868,
  name: 'Soneium',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.soneium.org'] },
    public: { http: ['https://rpc.soneium.org'] },
  },
  blockExplorers: {
    default: { name: 'Soneium Explorer', url: 'https://soneium.blocksout.com' },
  },
  testnet: false,
};

const ink: Chain = {
  id: 57073,
  name: 'Ink',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-gel.inkonchain.com'] },
    public: { http: ['https://rpc-gel.inkonchain.com'] },
  },
  blockExplorers: {
    default: { name: 'Ink Explorer', url: 'https://explorer.inkonchain.com' },
  },
  testnet: false,
};

export const wagmiConfig = createConfig({
  chains: [base, soneium, ink],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [soneium.id]: http('https://rpc.soneium.org'),
    [ink.id]: http('https://rpc-gel.inkonchain.com'),
  },
  connectors: [
    farcasterMiniApp(),
  ],
});
