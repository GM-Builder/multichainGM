// src/services/subgraphService.ts

import { createSubgraphClient } from '@/utils/apolloClient';
import {
  GET_GLOBAL_STATS,
  GET_LEADERBOARD,
  GET_USER_STATS,
  GET_USER_CHECKINS,
  GET_DAILY_STATS,
  GET_USER_RANKING,
} from '@/graphql/queries';
import { ChainName, SUPPORTED_CHAINS } from '@/utils/subgraph';
import {
  RawDailyStatsResponse,
  RawGlobalStatsResponse,
  RawLeaderboardResponse,
  RawUserStatsResponse,
  RawNavigatorEntry,
  RawCheckin,
  RawUserCheckinsResponse,
  RawUserRankingResponse,
} from '@/types';

export interface ChainNavigatorStats {
  chain: ChainName;
  address: string;
  totalCheckins: number;
  currentStreak: number;
  maxStreak: number;
  totalTaxPaid: number;
  firstBeaconTimestamp: number;
  lastBeaconTimestamp: number;
}

interface AggregationInput {
  chain: ChainName;
  address: string;
  totalCheckins: number;
  currentStreak: number;
  maxStreak: number;
  totalTaxPaid: number;
}

export interface GlobalStats {
  totalNavigators: number;
  totalCheckins: number;
  totalTaxCollected: number;
  chains: Array<{
    chain: ChainName;
    totalNavigators: number;
    totalCheckins: number;
    totalTaxCollected: number;
  }>;
}

export interface Navigator {
  address: string;
  totalCheckins: number;
  currentStreak: number;
  maxStreak: number;
  totalTaxPaid: number;
  chains: ChainName[];
}

export interface LeaderboardEntry {
  address: string;
  totalCheckins: number;
  maxStreak: number;
  currentStreak: number;
  totalTaxPaid: number;
  chains: ChainName[];
}

export interface UserCheckin {
  id: string;
  sequence: number;
  timestamp: number;
  tribute: number;
  dayIndex: number;
  streak: number;
  txHash: string;
  chain: ChainName;
}

export interface DailyStat {
  dayIndex: number;
  beaconCount: number;
  taxCollected: number;
  uniqueNavigators: number;
  date: number;
}

// ========================================
// SINGLE CHAIN QUERIES
// ========================================

export async function getChainGlobalStats(chain: ChainName) {
  try {
    const client = createSubgraphClient(chain);
    const { data } = await client.query<RawGlobalStatsResponse>({
      query: GET_GLOBAL_STATS,
      fetchPolicy: 'network-only',
    });

    if (!data || !data.globalStats) return null;

    return {
      chain,
      totalNavigators: parseInt(data.globalStats.totalNavigators || '0'),
      totalCheckins: parseInt(data.globalStats.totalCheckins || '0'),
      totalTaxCollected: parseFloat(data.globalStats.totalTaxCollected || '0'),
    };
  } catch (error) {
    console.error(`Error fetching stats for ${chain}:`, error);
    return null;
  }
}

export async function getChainLeaderboard(chain: ChainName, limit: number = 10): Promise<AggregationInput[]> {
  try {
    const client = createSubgraphClient(chain);
    const { data } = await client.query<RawLeaderboardResponse>({
      query: GET_LEADERBOARD,
      variables: { first: limit },
      fetchPolicy: 'network-only',
    });

    if (!data || !data.leaderboardEntries) return [];

    return data.leaderboardEntries.map((entry) => ({
      chain,
      address: entry.navigator.address,
      totalCheckins: parseInt(entry.navigator.totalCheckins || '0'),
      currentStreak: parseInt(entry.navigator.currentStreak || '0'),
      maxStreak: parseInt(entry.navigator.maxStreak || '0'),
      totalTaxPaid: parseFloat(entry.navigator.totalTaxPaid || '0'),
    }));
  } catch (error) {
    console.error(`Error fetching leaderboard for ${chain}:`, error);
    return [];
  }
}

export async function getUserStatsOnChain(chain: ChainName, address: string): Promise<ChainNavigatorStats | null> {
  try {
    const client = createSubgraphClient(chain);
    const { data } = await client.query<RawUserStatsResponse>({
      query: GET_USER_STATS,
      variables: { address: address.toLowerCase() },
      fetchPolicy: 'network-only',
    });

    if (!data || !data.navigator) return null;

    return {
      chain,
      address: data.navigator.address,
      totalCheckins: parseInt(data.navigator.totalCheckins || '0'),
      currentStreak: parseInt(data.navigator.currentStreak || '0'),
      maxStreak: parseInt(data.navigator.maxStreak || '0'),
      totalTaxPaid: parseFloat(data.navigator.totalTaxPaid || '0'),
      firstBeaconTimestamp: parseInt(data.navigator.firstBeaconTimestamp || '0'),
      lastBeaconTimestamp: parseInt(data.navigator.lastBeaconTimestamp || '0'),
    };
  } catch (error) {
    console.error(`Error fetching user stats for ${chain}:`, error);
    return null;
  }
}

export async function getUserCheckinsOnChain(
  chain: ChainName,
  address: string,
  limit: number = 30
): Promise<UserCheckin[]> {
  try {
    const client = createSubgraphClient(chain);
    const { data } = await client.query<RawUserCheckinsResponse>({
      query: GET_USER_CHECKINS,
      variables: { address: address.toLowerCase(), first: limit },
      fetchPolicy: 'network-only',
    });

    if (!data || !data.navigator || !data.navigator.checkins) return [];

    return data.navigator.checkins.map((checkin: RawCheckin) => ({
      ...checkin,
      chain,
      id: checkin.id,
      sequence: parseInt(checkin.sequence),
      timestamp: parseInt(checkin.timestamp),
      dayIndex: parseInt(checkin.dayIndex),
      streak: parseInt(checkin.streak),
      tribute: parseFloat(checkin.tribute),
    }));
  } catch (error) {
    console.error(`Error fetching user checkins for ${chain}:`, error);
    return [];
  }
}

export async function getChainDailyStats(chain: ChainName, days: number = 7): Promise<DailyStat[]> {
  try {
    const client = createSubgraphClient(chain);
    const { data } = await client.query<RawDailyStatsResponse>({
      query: GET_DAILY_STATS,
      variables: { days },
      fetchPolicy: 'network-only',
    });

    if (!data || !data.dailyStats) return [];

    interface RawDailyStatItem {
      dayIndex: string;
      beaconCount: string;
      taxCollected: string;
      uniqueNavigators: string;
      date: string;
    }

    return data.dailyStats.map((stat: RawDailyStatItem) => ({
      chain,
      dayIndex: parseInt(stat.dayIndex),
      beaconCount: parseInt(stat.beaconCount),
      taxCollected: parseFloat(stat.taxCollected),
      uniqueNavigators: parseInt(stat.uniqueNavigators),
      date: parseInt(stat.date),
    }));
  } catch (error) {
    console.error(`Error fetching daily stats for ${chain}:`, error);
    return [];
  }
}

// ========================================
// MULTI-CHAIN AGGREGATION
// ========================================

export async function getGlobalStatsAllChains(): Promise<GlobalStats> {
  const results = await Promise.all(
    SUPPORTED_CHAINS.map((chain) => getChainGlobalStats(chain))
  );

  const validResults = results.filter((r): r is Exclude<typeof r, null> => r !== null);

  return validResults.reduce(
    (acc, result) => {
      acc.totalNavigators += result.totalNavigators;
      acc.totalCheckins += result.totalCheckins;
      acc.totalTaxCollected += result.totalTaxCollected;
      acc.chains.push(result);
      return acc;
    },
    {
      totalNavigators: 0,
      totalCheckins: 0,
      totalTaxCollected: 0,
      chains: [],
    } as GlobalStats
  );
}

export async function getTop10LeaderboardAllChains(): Promise<LeaderboardEntry[]> {
  const results = await Promise.all(
    SUPPORTED_CHAINS.map((chain) => getChainLeaderboard(chain, 100))
  );

  const allNavigators = results.flat();

  const navigatorMap = new Map<string, LeaderboardEntry>();

  allNavigators.forEach((nav) => {
    const key = nav.address.toLowerCase();

    if (navigatorMap.has(key)) {
      const existing = navigatorMap.get(key)!;
      existing.totalCheckins += nav.totalCheckins;
      existing.totalTaxPaid += nav.totalTaxPaid;
      existing.maxStreak = Math.max(existing.maxStreak, nav.maxStreak);
      existing.currentStreak = Math.max(existing.currentStreak, nav.currentStreak);
      if (!existing.chains.includes(nav.chain)) {
        existing.chains.push(nav.chain);
      }
    } else {
      navigatorMap.set(key, {
        address: nav.address,
        totalCheckins: nav.totalCheckins,
        currentStreak: nav.currentStreak,
        maxStreak: nav.maxStreak,
        totalTaxPaid: nav.totalTaxPaid,
        chains: [nav.chain],
      });
    }
  });

  const aggregated = Array.from(navigatorMap.values());
  aggregated.sort((a, b) => b.totalCheckins - a.totalCheckins);

  return aggregated.slice(0, 10);
}

export async function getUserStatsAllChains(address: string): Promise<Navigator | null> {
  const results = await Promise.all(
    SUPPORTED_CHAINS.map((chain) => getUserStatsOnChain(chain, address))
  );

  const validResults = results.filter((r): r is ChainNavigatorStats => r !== null);

  if (validResults.length === 0) return null;

  const aggregated = validResults.reduce(
    (acc, result) => {
      acc.totalCheckins += result.totalCheckins;
      acc.totalTaxPaid += result.totalTaxPaid;
      acc.maxStreak = Math.max(acc.maxStreak, result.maxStreak);
      acc.currentStreak = Math.max(acc.currentStreak, result.currentStreak);
      acc.chains.push(result.chain);
      return acc;
    },
    {
      address,
      totalCheckins: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalTaxPaid: 0,
      chains: [],
    } as Navigator
  );

  return aggregated;
}

export async function getUserCheckinsAllChains(
  address: string,
  limit: number = 30
): Promise<UserCheckin[]> {
  const results = await Promise.all(
    SUPPORTED_CHAINS.map((chain) => getUserCheckinsOnChain(chain, address, limit))
  );

  const allCheckins = results.flat();

  allCheckins.sort((a, b) => b.timestamp - a.timestamp);

  return allCheckins.slice(0, limit);
}

export async function getDailyStatsAllChains(days: number = 7): Promise<DailyStat[]> {
  const results = await Promise.all(
    SUPPORTED_CHAINS.map((chain) => getChainDailyStats(chain, days))
  );

  return results.flat();
}

// ========================================
// USER RANKING
// ========================================

export async function getUserRanking(chainName: ChainName, address: string): Promise<{
  rank: number;
  totalUsers: number;
} | null> {
  try {
    const client = createSubgraphClient(chainName);
    const { data } = await client.query<RawUserRankingResponse>({
      query: GET_USER_RANKING,
      variables: { address: address.toLowerCase() },
      fetchPolicy: 'network-only',
    });

    if (!data) {
      return { rank: 0, totalUsers: 0 };
    }

    if (!data.navigator) {
      const totalUsers = parseInt(data.globalStats?.totalNavigators || '0');
      return { rank: 0, totalUsers };
    }

    const userCheckins = parseInt(data.navigator.totalCheckins || '0');
    const leaderboard = data.leaderboardEntries || [];

    let rank = 0;
    for (let i = 0; i < leaderboard.length; i++) {
      if (leaderboard[i].navigator.address.toLowerCase() === address.toLowerCase()) {
        rank = i + 1;
        break;
      }
    }

    if (rank === 0 && userCheckins > 0) {
      const usersAbove = leaderboard.filter(
        (entry) => parseInt(entry.navigator.totalCheckins || '0') > userCheckins
      ).length;
      rank = usersAbove + 1;
    }

    const totalUsers = parseInt(data.globalStats?.totalNavigators || '0');

    return { rank, totalUsers };
  } catch (error) {
    console.error(`Error fetching user ranking for ${chainName}:`, error);
    return null;
  }
}

export async function getUserRankingAllChains(address: string): Promise<{
  rank: number;
  totalUsers: number;
} | null> {
  try {
    const results = await Promise.all(
      SUPPORTED_CHAINS.map((chain) => getUserRanking(chain, address))
    );

    const validResults = results.filter(
      (r): r is NonNullable<typeof r> => r !== null && r.rank > 0
    );

    if (validResults.length === 0) {
      return { rank: 0, totalUsers: 0 };
    }

    const bestRank = Math.min(...validResults.map(r => r.rank));
    const maxTotalUsers = Math.max(...validResults.map(r => r.totalUsers));

    return {
      rank: bestRank,
      totalUsers: maxTotalUsers,
    };
  } catch (error) {
    console.error('Error fetching user ranking across all chains:', error);
    return null;
  }
}