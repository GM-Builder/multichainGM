export const TEA_SEPOLIA_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_TEA_SEPOLIA_CHAIN_ID || "10218", 10);
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const SONEIUM_TESTNET_CHAIN_ID = 1946;
export const INK_TESTNET_CHAIN_ID = 763373;
export const OP_SEPOLIA_CHAIN_ID = 11155420;
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MEGAETH_TESTNET_CHAIN_ID = 6342;
export const UNICHAIN_SEPOLIA_CHAIN_ID = 1301;
export const ABSTRACT_TESTNET_CHAIN_ID = 11124;
export const LISK_SEPOLIA_CHAIN_ID = 4202;
export const HUMANITY_TESTNET_CHAIN_ID = 1942999413;
export const CHAINBASE_TESTNET_CHAIN_ID = 8453;

export interface ChainConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  contractAddress: string;
  logoUrl: string;
  status: string;
  isTestnet?: boolean;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [TEA_SEPOLIA_CHAIN_ID]: {
    chainId: `0x${TEA_SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: "Tea Sepolia",
    nativeCurrency: {
      name: "Tea",
      symbol: "TEA",
      decimals: 18,
    },
    rpcUrls: [process.env.NEXT_PUBLIC_TEA_SEPOLIA_RPC_URL || "https://tea-sepolia.g.alchemy.com/public"],
    blockExplorerUrls: [process.env.NEXT_PUBLIC_TEA_BLOCK_EXPLORER || "https://sepolia.tea.xyz"],
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xaF8471a2968a30a63Cdced851cDA2B7ce9e5dB90",
    logoUrl: "/assets/chains/tea.png", 
    status: "Ready!",
    isTestnet: true,
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: "Base Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"],
    contractAddress: process.env.BASE_SEPOLIA_CONTRACT_ADDRESS || "0xA55F30904bC3404AF50F652eAC686651E3dD9DF8",
    logoUrl: "/assets/chains/base.png",
    status: "Ready!",
    isTestnet: true,
  },
  [SONEIUM_TESTNET_CHAIN_ID]: {
    chainId: `0x${SONEIUM_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: "Soneium Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.SONEIUM_TESTNET_RPC_URL || "https://rpc.minato.soneium.org"],
    blockExplorerUrls: ["https://explorer-testnet.soneium.org"],
    contractAddress: process.env.SONEIUM_TESTNET_CONTRACT_ADDRESS || "0x36E52b17856ABa9A9a330fAad6DcC6D8514D76D7",
    logoUrl: "/assets/chains/soneium.png",
    status: "Ready!",
    isTestnet: true,
  },
  [INK_TESTNET_CHAIN_ID]: {
    chainId: `0x${INK_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: "Ink Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.INK_TESTNET_RPC_URL || "https://rpc-gel-sepolia.inkonchain.com"],
    blockExplorerUrls: ["https://explorer-sepolia.inkonchain.com"],
    contractAddress: process.env.INK_TESTNET_CONTRACT_ADDRESS || "0x36E52b17856ABa9A9a330fAad6DcC6D8514D76D7",
    logoUrl: "/assets/chains/ink.png",
    status: "Ready!",
    isTestnet: true,
  },
  [OP_SEPOLIA_CHAIN_ID]: {
    chainId: `0x${OP_SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: "OP Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.OP_SEPOLIA_RPC_URL || "https://sepolia.optimism.io"],
    blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"],
    contractAddress: process.env.OP_SEPOLIA_CONTRACT_ADDRESS || "0x36E52b17856ABa9A9a330fAad6DcC6D8514D76D7",
    logoUrl: "/assets/chains/optimism.png",
    status: "Ready!",
    isTestnet: true,
  },
  [ARBITRUM_SEPOLIA_CHAIN_ID]: {
    chainId: `0x${ARBITRUM_SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: "Arbitrum Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://sepolia.arbiscan.io"],
    contractAddress: process.env.ARBITRUM_SEPOLIA_CONTRACT_ADDRESS || "0x36E52b17856ABa9A9a330fAad6DcC6D8514D76D7",
    logoUrl: "/assets/chains/arbitrum.png",
    status: "Ready!",
    isTestnet: true,
  },
  [MONAD_TESTNET_CHAIN_ID]: {
    chainId: `0x${MONAD_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: "Monad Testnet",
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: [process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz"],
    blockExplorerUrls: ["https://testnet-explorer.monad.xyz"],
    contractAddress: process.env.MONAD_TESTNET_CONTRACT_ADDRESS || "0x36E52b17856ABa9A9a330fAad6DcC6D8514D76D7",
    logoUrl: "/assets/chains/monad.png",
    status: "Ready!",
    isTestnet: true,
  },
  [MEGAETH_TESTNET_CHAIN_ID]: {
    chainId: `0x${MEGAETH_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: "MegaETH Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.MEGAETH_TESTNET_RPC_URL || "https://carrot.megaeth.com/rpc"],
    blockExplorerUrls: ["https://explorer.megaeth.com"],
    contractAddress: process.env.MEGAETH_TESTNET_CONTRACT_ADDRESS || "0x36E52b17856ABa9A9a330fAad6DcC6D8514D76D7",
    logoUrl: "/assets/chains/megaeth.png",
    status: "Ready!",
    isTestnet: true,
  },
  [UNICHAIN_SEPOLIA_CHAIN_ID]: {
    chainId: `0x${UNICHAIN_SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: "Unichain Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.UNICHAIN_SEPOLIA_RPC_URL || "https://sepolia.unichain.org"],
    blockExplorerUrls: ["https://sepolia.uniscan.xyz"],
    contractAddress: process.env.UNICHAIN_SEPOLIA_CONTRACT_ADDRESS || "0x922E8F1D06d2401f7BDcf81673e13A150Ea5690d",
    logoUrl: "/assets/chains/unichain.png",
    status: "Ready!",
    isTestnet: true,
  },
  [ABSTRACT_TESTNET_CHAIN_ID]: {
    chainId: `0x${ABSTRACT_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: "Abstract Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.ABSTRACT_TESTNET_RPC_URL || "https://api.testnet.abs.xyz"],
    blockExplorerUrls: ["https://explorer.testnet.abs.xyz"],
    contractAddress: process.env.ABSTRACT_TESTNET_CONTRACT_ADDRESS || "0x660C371DBb36e63c6201575c63de676066093Cd9",
    logoUrl: "/assets/chains/abstract.png",
    status: "Ready!",
    isTestnet: true,
  },
  [LISK_SEPOLIA_CHAIN_ID]: {
    chainId: `0x${LISK_SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: "Lisk Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com"],
    blockExplorerUrls: ["https://sepolia-blockscout.lisk.com"],
    contractAddress: process.env.LISK_SEPOLIA_CONTRACT_ADDRESS || "0xD3118812285A9848b0382A228C56958bee58D8B8",
    logoUrl: "/assets/chains/lisk.png",
    status: "Ready!",
    isTestnet: true,
  }
};

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xaF8471a2968a30a63Cdced851cDA2B7ce9e5dB90";
export const TEA_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_TEA_SEPOLIA_RPC_URL || "https://tea-sepolia.g.alchemy.com/public";
export const TEA_SEPOLIA_CHAIN = SUPPORTED_CHAINS[TEA_SEPOLIA_CHAIN_ID];

export const CHECKIN_FEE = process.env.NEXT_PUBLIC_CHECKIN_FEE || "0.000029";

export const DAY_IN_MS = 86400000;

export const DEPLOY_BLOCK = parseInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "1155300", 10);

export const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  return SUPPORTED_CHAINS[chainId] || undefined;
};

export const isChainSupported = (chainId: number): boolean => {
  return chainId in SUPPORTED_CHAINS;
};

export const getSupportedChainIds = (): number[] => {
  return Object.keys(SUPPORTED_CHAINS).map(Number);
};

export const getContractAddress = (chainId: number): string => {
  const chain = getChainConfig(chainId);
  return chain?.contractAddress || CONTRACT_ADDRESS;
};

export const getChainName = (chainId: number): string => {
  return SUPPORTED_CHAINS[chainId]?.chainName || `Unknown Chain (${chainId})`;
};

export const getNativeCurrencySymbol = (chainId: number): string => {
  return SUPPORTED_CHAINS[chainId]?.nativeCurrency?.symbol || 'ETH';
};

export const isTestnetChain = (chainId: number): boolean => {
  const chainConfig = SUPPORTED_CHAINS[chainId];
  if (!chainConfig) return false;
  
  return chainConfig.isTestnet === true ||
         chainConfig.chainName.toLowerCase().includes('testnet') ||
         chainConfig.chainName.toLowerCase().includes('sepolia');
};

export const getMainnetChainIds = (): number[] => {
  return getSupportedChainIds().filter(chainId => !isTestnetChain(chainId));
};

export const getTestnetChainIds = (): number[] => {
  return getSupportedChainIds().filter(chainId => isTestnetChain(chainId));
};

export const formatChainId = (chainId: number): string => {
  return `0x${chainId.toString(16)}`;
};

export const getChainRpcUrl = (chainId: number): string => {
  const chain = getChainConfig(chainId);
  return chain?.rpcUrls[0] || '';
};

export const getChainExplorerUrl = (chainId: number): string => {
  const chain = getChainConfig(chainId);
  return chain?.blockExplorerUrls[0] || '';
};