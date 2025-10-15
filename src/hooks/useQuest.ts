// src/hooks/useQuest.ts
import { useState, useEffect } from 'react';
import { 
  getUserQuestProgress, 
  getQuestStats,
  getChainProgress
} from '@/services/questService';
import { UserQuestProgress, QuestStats, QuestType } from '@/types';

export function useUserQuest(address: string | null | undefined, activeQuest: QuestType = null) {
  const [data, setData] = useState<UserQuestProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserQuestProgress(address, activeQuest)
      .then(setData)
      .catch((err) => {
        console.error('Error fetching user quest progress:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [address, activeQuest]);

  const refetch = () => {
    if (!address) return;
    
    setLoading(true);
    getUserQuestProgress(address, activeQuest)
      .then(setData)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
}

export function useQuestStats() {
  const [data, setData] = useState<QuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getQuestStats()
      .then(setData)
      .catch((err) => {
        console.error('Error fetching quest stats:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useChainProgress(address: string | null | undefined) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setData({});
      setLoading(false);
      return;
    }

    setLoading(true);
    getChainProgress(address)
      .then(setData)
      .catch((err) => {
        console.error('Error fetching chain progress:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
}