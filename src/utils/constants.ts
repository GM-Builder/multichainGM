import GMTestnetABI from "../abis/GMTestnetABI.json";
import GMMainnetABI from "../abis/GMMainnetABI.json"; 
import ReferralABI from "../abis/ReferralABI.json";

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
export const BASE_CHAIN_ID = 8453;
export const SONEIUM_CHAIN_ID = 1868;
export const INK_CHAIN_ID= 57073;
export const INCENTIVE_TESTNET_CHAIN_ID = 28802;

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
  abi: any;
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
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
    abi: GMTestnetABI, 
  },
  [INCENTIVE_TESTNET_CHAIN_ID]: {
    chainId: `0x${INCENTIVE_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: "Incentive Testnet",
    nativeCurrency: {
      name: "TCENT",
      symbol: "TCENT",
      decimals: 18,
    },
    rpcUrls: [process.env.INCENTIVE_TESTNET_RPC_URL || "https://rpc2.testnet.incentiv.io/"],
    blockExplorerUrls: ["https://explorer-testnet.incentiv.io/"],
    contractAddress: process.env.INCENTIVE_TESTNET_CONTRACT_ADDRESS || "0x8e171981411f2C5F65E5301fB6A78FfA286Ee383",
    logoUrl: "/assets/chains/incentive.png",
    status: "Ready!",
    isTestnet: true,
    abi: GMTestnetABI, 
  },

  

  // Mainnet
  [BASE_CHAIN_ID]: {
    chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
    chainName: "Base",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org", "https://base.llamarpc.com", "https://base-rpc.publicnode.com", ],
    blockExplorerUrls: ["https://basescan.org"],
    contractAddress: process.env.BASE_MAINNET_CONTRACT_ADDRESS || "0x8A0043A965dF6683A71a87a4B8F33e64290eB3E7",
    logoUrl: "/assets/chains/base.png",
    status: "Ready!",
    isTestnet: false,
    abi: GMMainnetABI, 
  },
  [SONEIUM_CHAIN_ID]: {
    chainId: `0x${SONEIUM_CHAIN_ID.toString(16)}`,
    chainName: "Soneium",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.SONEIUM_MAINNET_RPC_URL || "https://rpc.soneium.org", "https://soneium-mainnet.rpc.caldera.xyz/http", ],
    blockExplorerUrls: ["https://soneium.blocksout.com"],
    contractAddress: process.env.SONEIUM_MAINNET_CONTRACT_ADDRESS || "0xc636516508f8798c1d5F019A2C73BD7442213D94",
    logoUrl: "/assets/chains/soneium.png",
    status: "Ready!",
    isTestnet: false,
    abi: GMMainnetABI, 
  },
  [INK_CHAIN_ID]: {
    chainId: `0x${INK_CHAIN_ID.toString(16)}`,
    chainName: "Ink",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.INK_MAINNET_RPC_URL || "https://rpc-gel.inkonchain.com", "https://rpc-qnd.inkonchain.com", ],
    blockExplorerUrls: ["https://explorer.inkonchain.com"],
    contractAddress: process.env.INK_MAINNET_CONTRACT_ADDRESS || "0x02a9107Bf30a38fEddA30FB83cC01ff5b44dC935",
    logoUrl: "/assets/chains/ink.png",
    status: "Ready!",
    isTestnet: false,
    abi: GMMainnetABI, 
  },

};

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xaF8471a2968a30a63Cdced851cDA2B7ce9e5dB90";
export const TEA_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_TEA_SEPOLIA_RPC_URL || "https://tea-sepolia.g.alchemy.com/public";
export const GANNETX_CHAT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GANNETX_CHAT_CONTRACT_ADDRESS || "0x24cF04855f0F33f8aEBaDe075c80C24272aE1Fc5";
export const BASE_SEPOLIA_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";
export const GANNETX_TOKEN_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_GANNETX_TOKEN_FACTORY_ADDRESS || "0x1ae8Fb376EB4f2F5fCe0d30d84C28cD5582f3512";
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

export const getChainAbi = (chainId: number): any => {
  const chain = getChainConfig(chainId);
  return chain?.abi || GMTestnetABI;
};

export const SUBGRAPH_ENDPOINTS = {
  base: 'https://api.studio.thegraph.com/query/106565/gannet-x-base/version/latest',
  ink: 'https://api.studio.thegraph.com/query/106565/gannetx-ink/version/latest',
  soneium: 'https://api.studio.thegraph.com/query/106565/gannet-x-soneium/version/latest',
} as const;

export const REFERRAL_CONTRACT_CONFIG = {
  [BASE_CHAIN_ID]: {
    address: process.env.REFERRAL_CONTRACT_ADDRESS || "0x577990A6b1D9403Db0477985787F0d687E77dfB4",
    abi: ReferralABI,
  }
};

export const REFERRAL_SUBGRAPH_ENDPOINT = 
  process.env.NEXT_PUBLIC_REFERRAL_SUBGRAPH_URL || 
  'https://api.studio.thegraph.com/query/XXXXX/gannetx-referral/version/latest';

export const getReferralContractAddress = (): string => {
  return REFERRAL_CONTRACT_CONFIG[BASE_CHAIN_ID].address;
};

export const getReferralContractAbi = (): any => {
  return REFERRAL_CONTRACT_CONFIG[BASE_CHAIN_ID].abi;
};

export const isReferralSupported = (chainId: number): boolean => {
  return chainId === BASE_CHAIN_ID;
};