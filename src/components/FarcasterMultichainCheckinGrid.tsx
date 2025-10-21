// src/components/FarcasterMultiChainCheckinGrid.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaLeaf, 
  FaSpinner, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaClock, 
  FaWallet, 
  FaExclamationTriangle,
  FaLayerGroup,
  FaGlobe,
  FaFlask,
  FaStar,
} from 'react-icons/fa';
import { 
  CHECKIN_FEE, 
  SUPPORTED_CHAINS, 
  getSupportedChainIds,
  isChainSupported,
  CONTRACT_ADDRESS,
} from '@/utils/constants';
import ChainLogo from '@/components/ChainLogo';
import { parseEther, formatEther } from 'viem';
import type { WalletClient, PublicClient } from 'viem';
import toast from 'react-hot-toast';

// ABI for checkin function
const CHECKIN_ABI = [
  {
    inputs: [],
    name: 'checkIn',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'lastCheckIn',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface FarcasterMultiChainCheckinGridProps {
  isConnected: boolean;
  currentChainId?: number | null;
  address?: `0x${string}` | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient | null;
  onCheckinSuccess?: (chainId: number, txHash: string) => void;
  networkType?: 'all' | 'mainnet' | 'testnet';
  triggerAnimation?: { chainId: number; chainName: string } | null;
  onAnimationComplete?: () => void;
}

type NetworkTabType = 'all' | 'mainnet' | 'testnet';

const FarcasterMultiChainCheckinGrid: React.FC<FarcasterMultiChainCheckinGridProps> = ({
  isConnected,
  currentChainId,
  address,
  walletClient,
  publicClient,
  onCheckinSuccess,
  networkType = 'mainnet',
  triggerAnimation,
  onAnimationComplete,
}) => {
  const [processingChainId, setProcessingChainId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successChainId, setSuccessChainId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [favoriteChains, setFavoriteChains] = useState<number[]>([]);
  const [lastCheckinTimes, setLastCheckinTimes] = useState<Record<number, number>>({});

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteChains');
    if (savedFavorites) {
      try {
        setFavoriteChains(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error parsing favorite chains', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteChains', JSON.stringify(favoriteChains));
  }, [favoriteChains]);

  // Fetch last check-in times for all chains
  useEffect(() => {
    const fetchLastCheckinTimes = async () => {
      if (!address || !publicClient) return;

      const chainIds = getSupportedChainIds();
      const times: Record<number, number> = {};

      for (const chainId of chainIds) {
        try {
          const contractAddress = CONTRACT_ADDRESS[chainId];
          if (!contractAddress) continue;

          const lastCheckin = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: CHECKIN_ABI,
            functionName: 'lastCheckIn',
            args: [address],
          }) as bigint;

          times[chainId] = Number(lastCheckin);
        } catch (error) {
          console.error(`Error fetching lastCheckin for chain ${chainId}:`, error);
          times[chainId] = 0;
        }
      }

      setLastCheckinTimes(times);
    };

    fetchLastCheckinTimes();
  }, [address, publicClient]);

  // Clear success state after 5 seconds
  useEffect(() => {
    if (successChainId) {
      const timer = setTimeout(() => setSuccessChainId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successChainId]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const toggleFavorite = (chainId: number) => {
    setFavoriteChains(prev => {
      if (prev.includes(chainId)) {
        return prev.filter(id => id !== chainId);
      } else {
        return [...prev, chainId];
      }
    });
  };

  const canCheckin = (chainId: number): boolean => {
    const lastCheckin = lastCheckinTimes[chainId] || 0;
    if (lastCheckin === 0) return true;

    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastCheckin = now - lastCheckin;
    const oneDayInSeconds = 24 * 60 * 60;

    return timeSinceLastCheckin >= oneDayInSeconds;
  };

  const getTimeUntilNextCheckin = (chainId: number): number => {
    const lastCheckin = lastCheckinTimes[chainId] || 0;
    if (lastCheckin === 0) return 0;

    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastCheckin = now - lastCheckin;
    const oneDayInSeconds = 24 * 60 * 60;
    const timeRemaining = oneDayInSeconds - timeSinceLastCheckin;

    return timeRemaining > 0 ? timeRemaining : 0;
  };

  const handleCheckin = async (chainId: number) => {
    if (!isConnected || !walletClient || !address || processingChainId !== null) {
      return;
    }

    if (!canCheckin(chainId)) {
      toast.error('You can only check-in once per day!');
      return;
    }

    try {
      setProcessingChainId(chainId);
      setErrorMessage(null);

      const contractAddress = CONTRACT_ADDRESS[chainId];
      if (!contractAddress) {
        throw new Error('Contract not deployed on this chain');
      }

      // Switch chain if needed
      if (currentChainId !== chainId) {
        toast.loading('Switching network...', { id: 'switch' });
        
        await walletClient.switchChain({ id: chainId });
        
        toast.dismiss('switch');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.loading('Sending transaction...', { id: 'checkin' });

      // Send check-in transaction
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: CHECKIN_ABI,
        functionName: 'checkIn',
        value: parseEther(CHECKIN_FEE),
        chain: walletClient.chain,
        account: address,
      });

      toast.dismiss('checkin');
      toast.loading('Waiting for confirmation...', { id: 'confirm' });

      // Wait for transaction
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
          setSuccessChainId(chainId);
          
          // Update last checkin time
          setLastCheckinTimes(prev => ({
            ...prev,
            [chainId]: Math.floor(Date.now() / 1000),
          }));

          toast.dismiss('confirm');
          toast.success('Check-in successful! 🎉');

          if (onCheckinSuccess) {
            onCheckinSuccess(chainId, hash);
          }
        } else {
          throw new Error('Transaction failed');
        }
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      
      let errorMsg = 'Check-in failed';
      
      if (error.message?.includes('User rejected')) {
        errorMsg = 'Transaction rejected';
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient balance';
      } else if (error.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      toast.dismiss();
      toast.error(errorMsg);
    } finally {
      setProcessingChainId(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Filter chains by network type
  const allChains = useMemo(() => {
    return getSupportedChainIds()
      .map(id => ({ id, ...SUPPORTED_CHAINS[id] }))
      .filter(chain => {
        if (networkType === 'mainnet') return !chain.isTestnet;
        if (networkType === 'testnet') return chain.isTestnet;
        return true;
      });
  }, [networkType]);

  const displayedChains = activeTab === 'favorites' 
    ? allChains.filter(chain => favoriteChains.includes(chain.id))
    : allChains;

  return (
    <div className="w-full space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'all' 
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Networks ({allChains.length})
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'favorites' 
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300'
          }`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites ({favoriteChains.length})
        </button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-lg p-3 text-red-600 dark:text-red-300 text-sm"
          >
            <div className="flex items-start">
              <FaExclamationTriangle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <div>{errorMessage}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty Favorites */}
      {activeTab === 'favorites' && favoriteChains.length === 0 && (
        <div className="text-center py-10 px-4 bg-gray-100 dark:bg-gray-800/20 rounded-lg border border-gray-200 dark:border-gray-700">
          <FaStar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300">No favorite networks yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tap the star icon to add favorites
          </p>
        </div>
      )}

      {/* Chain Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {displayedChains.map((chain) => {
          const isCurrentChain = currentChainId === chain.id;
          const isProcessing = processingChainId === chain.id;
          const isSuccess = successChainId === chain.id;
          const isFavorite = favoriteChains.includes(chain.id);
          const canCheck = canCheckin(chain.id);
          const timeUntilNext = getTimeUntilNextCheckin(chain.id);
          
          return (
            <motion.div 
              key={chain.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-3 md:p-4 border transition-all duration-300 ${
                isCurrentChain 
                  ? 'border-cyan-400 dark:border-cyan-700/50 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/20'
              } ${isSuccess ? 'ring-2 ring-cyan-500 ring-opacity-50' : ''} hover:shadow-md`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30">
                    <ChainLogo 
                      logoUrl={chain.logoUrl}
                      altText={chain.chainName}
                      size="md"
                      fallbackIcon="🔗"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {chain.chainName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {chain.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(chain.id)}
                  className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 transition-colors"
                >
                  <FaStar className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                </button>
              </div>
              
              {/* Info */}
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2 md:p-3 mb-3 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Fee:</span>
                  <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                    {CHECKIN_FEE} {chain.nativeCurrency.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    canCheck
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  }`}>
                    {canCheck ? 'Ready' : `Wait ${formatTime(timeUntilNext)}`}
                  </span>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => handleCheckin(chain.id)}
                disabled={!isConnected || !canCheck || isProcessing || processingChainId !== null}
                className={`w-full py-2 md:py-2.5 px-4 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center transition-all duration-300 ${
                  !isConnected || !canCheck || isProcessing || processingChainId !== null
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white shadow-sm hover:shadow'
                }`}
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                    <span>Processing...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <FaCheckCircle className="h-4 w-4 mr-2" />
                    <span>Success!</span>
                  </>
                ) : !isConnected ? (
                  <>
                    <FaWallet className="h-4 w-4 mr-2" />
                    <span>Connect Wallet</span>
                  </>
                ) : !canCheck ? (
                  <>
                    <FaClock className="h-4 w-4 mr-2" />
                    <span>{formatTime(timeUntilNext)}</span>
                  </>
                ) : (
                  <>
                    <FaLeaf className="h-4 w-4 mr-2" />
                    <span>Check In</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FarcasterMultiChainCheckinGrid;