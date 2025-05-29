import { ethers } from "ethers";

export interface Web3State {
  isConnected: boolean;
  address: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
}

export interface CheckinStats {
  timeUntilNextCheckin: number;
  lastCheckinTime?: number;
  totalCheckins?: number;
  canCheckin?: boolean;
}

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
  logo: string;
  status: string;
}

export interface NavigationEvent {
  tab: string;
  subtab?: string;
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTrack: number;
  isVisible: boolean;
}

export interface AmbientSound {
  name: string;
  description: string;
  icon: string;
  frequency: number;
  type: OscillatorType;
}

export type Theme = 'light' | 'dark';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ContractTransactionResponse {
  hash: string;
  wait: () => Promise<ethers.providers.TransactionReceipt>;
}

export interface NavigatorMetrics {
  lastBeacon: ethers.BigNumber;
  crystalCount: ethers.BigNumber;
  nextResetTime: ethers.BigNumber;
  canActivate: boolean;
  currentStreak: ethers.BigNumber;
  maxStreak: ethers.BigNumber;
  firstBeaconDay: ethers.BigNumber;
  totalDaysActive: ethers.BigNumber;
}