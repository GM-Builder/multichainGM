import { useState, useEffect } from 'react';
import { 
  getReferrerInfo, 
  getUserReferrer,
  getTopReferrers,
  getReferralStats,
  getRecentReferrals,
  ReferrerData,
  UserReferralData,
  TopReferrer,
  ReferralStats,
  RecentReferral
} from '@/services/referralService';

export const useReferrerInfo = (address: string | null | undefined) => {
  const [data, setData] = useState<ReferrerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    getReferrerInfo(address)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [address]);

  const refetch = () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    getReferrerInfo(address)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
};

export const useUserReferrer = (address: string | null | undefined) => {
  const [data, setData] = useState<UserReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    getUserReferrer(address)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
};

export const useTopReferrers = (limit: number = 10) => {
  const [data, setData] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getTopReferrers(limit)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [limit]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    
    getTopReferrers(limit)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
};

export const useReferralStats = () => {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getReferralStats()
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    
    getReferralStats()
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
};

export const useRecentReferrals = (limit: number = 20) => {
  const [data, setData] = useState<RecentReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getRecentReferrals(limit)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [limit]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    
    getRecentReferrals(limit)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
};

export const useReferralStatsPolling = (intervalMs: number = 30000) => {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = () => {
      getReferralStats()
        .then(setData)
        .catch((err) => setError(err as Error))
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return { data, loading, error };
};

