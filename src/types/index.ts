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

// ========================================
// SUBGRAPH TYPES (Baru Ditambahkan)
// ========================================

// Tipe Chain Name diambil dari utils/subgraph.ts, jadi kita definisikan ulang di sini jika perlu
// atau impor langsung jika memungkinkan (Asumsikan sudah diimpor: import { ChainName } from '@/utils/subgraph')

// Digunakan untuk Checkin di Navigator
export interface RawCheckin {
    id: string;
    sequence: string;
    timestamp: string;
    tribute: string;
    dayIndex: string;
    streak: string;
    txHash: string;
    blockNumber: string;
}

// 1. RAW RESPONSE TYPES (Tipe Data Mentah dari Subgraph)

// Digunakan untuk GET_GLOBAL_STATS response
export interface RawGlobalStatsResponse {
    globalStats: {
        totalNavigators: string; // Subgraph mengembalikan angka sebagai string
        totalCheckins: string;
        totalTaxCollected: string; // Eth value sebagai string
    } | null;
}

// Digunakan untuk Leaderboard & Navigator response
export interface RawNavigatorEntry {
    address: string;
    totalCheckins: string;
    currentStreak: string;
    maxStreak: string;
    totalTaxPaid: string; // Eth value sebagai string
    // Properti lain yang ada di query Anda:
    firstBeaconTimestamp?: string;
    lastBeaconTimestamp?: string;
}

// Digunakan untuk query GET_NAVIGATOR_DETAILS (yang Anda gunakan di service)
// **PERBAIKAN UTAMA ADA DI SINI**
export interface RawNavigatorWithCheckins extends RawNavigatorEntry {
    id: string; // ID navigator adalah address
    checkins: RawCheckin[];
    firstBeaconDay?: string;
    lastBeaconDay?: string;
    isActive?: boolean;
}

// Digunakan untuk GET_USER_STATS (ketika tidak me-request checkin history)
export interface RawUserStatsResponse {
    navigator: RawNavigatorEntry | null; // Navigator tanpa array checkins
}

// Digunakan untuk GET_USER_CHECKINS
export interface RawUserCheckinsResponse {
    navigator: RawNavigatorWithCheckins | null;
}

// Digunakan untuk GET_LEADERBOARD response
export interface RawLeaderboardResponse {
    leaderboardEntries: {
        navigator: RawNavigatorEntry;
        // Properti lain dari LeaderboardEntry di Subgraph, misalnya:
        totalCheckins: string; 
        maxStreak: string;
        lastUpdated: string;
    }[];
}

// Digunakan untuk GET_DAILY_STATS response
export interface RawDailyStatsResponse {
    dailyStats: {
        dayIndex: string;
        beaconCount: string;
        taxCollected: string;
        uniqueNavigators: string;
        date: string;
    }[];
}


// 2. AGGREGATED & PROCESSED TYPES (Tipe yang sudah bersih, digunakan di Frontend)

export interface AggregatedChainStats {
  chain: string; // Gunakan string karena ChainName tidak didefinisikan di sini
  totalNavigators: number;
  totalCheckins: number;
  totalTaxCollected: number;
}

// Match GlobalStats di subgraphService.ts
export interface GlobalStats {
  totalNavigators: number;
  totalCheckins: number;
  totalTaxCollected: number;
  chains: AggregatedChainStats[];
}

// Match LeaderboardEntry di subgraphService.ts
export interface LeaderboardEntry {
  address: string;
  totalCheckins: number;
  currentStreak: number;
  maxStreak: number;
  totalTaxPaid: number;
  chains: string[]; // List of chain names where navigator is active
}

// Match UserCheckin di subgraphService.ts
export interface UserCheckin {
  id: string;
  sequence: number;
  timestamp: number;
  tribute: number; // Sudah diubah ke float/number
  dayIndex: number;
  streak: number;
  txHash: string;
  chain: string;
}