import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSpinner, FaCheckCircle, FaClock, FaWallet,
  FaStar, FaRegStar, FaFilter,
  FaMoon,
  FaLayerGroup,
  FaGlobe,
  FaFlask,
} from 'react-icons/fa';
import {
  SUPPORTED_CHAINS,
  getSupportedChainIds,
  getContractAddress,
  getChainAbi,
  BASE_CHAIN_ID,
} from '@/utils/constants';
import {
  performCheckin,
  switchToChain,
  getContract,
  getProvider,
  delay
} from '@/utils/web3';
import { ethers } from 'ethers';
import ChainLogo from '@/components/ChainLogo';
import toast from 'react-hot-toast';
import SuccessAnimation from '@/components/SuccessAnimation';
import { useSuccessAnimation } from '@/components/SuccessAnimationContext';
import { useUserStats } from '@/hooks/useSubgraph';

type NetworkType = 'all' | 'mainnet' | 'testnet';
type FilterType = 'all' | 'available' | 'checked' | 'favorites';
type SortOptionType = 'name' | 'status';

interface ChainCheckinStatus {
  canCheckin: boolean;
  lastCheckin: number | null;
  timeUntilNextCheckin: number;
}

interface Chain {
  id: number;
  chainName: string;
  logoUrl: string;
  status: ChainCheckinStatus;
  chainId: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  contractAddress?: string;
  [key: string]: any;
}

interface MultiChainCheckinGridProps {
  isConnected: boolean;
  currentChainId?: number | null;
  address?: string | null;
  signer?: ethers.Signer | null;
  provider?: ethers.providers.Web3Provider | null;
  onCheckinSuccess?: (chainId: number, txHash: string) => void;
  networkType?: NetworkType;
  triggerAnimation?: { chainId: number; chainName: string } | null;
  onAnimationComplete?: () => void;
}

const SORT_OPTIONS: { value: SortOptionType; label: string }[] = [
  { value: 'name', label: 'Sort by Name' },
  { value: 'status', label: 'Sort by Status' },
];

const MultiChainCheckinGrid: React.FC<MultiChainCheckinGridProps> = ({
  isConnected,
  currentChainId,
  address,
  signer,
  provider,
  onCheckinSuccess,
  networkType: propNetworkType,
  triggerAnimation,
  onAnimationComplete,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingChainId, setProcessingChainId] = useState<number | null>(null);
  const [successChainId, setSuccessChainId] = useState<number | null>(null);
  const [favoriteChains, setFavoriteChains] = useState<number[]>([]);
  const [chainStatusMap, setChainStatusMap] = useState<Record<number, ChainCheckinStatus>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [networkType, setNetworkType] = useState<NetworkType>('all');
  const [sortOption, setSortOption] = useState<SortOptionType>('name');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [networkSwitchingChainId, setNetworkSwitchingChainId] = useState<number | null>(null);
  const [successAnimationData, setSuccessAnimationData] = useState<{
    visible: boolean;
    chainId: number | null;
    chainName: string;
  }>({
    visible: false,
    chainId: null,
    chainName: '',
  });

  const { soundEnabled } = useSuccessAnimation();
  const { data: userStats } = useUserStats(address || undefined);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };

    if (isFilterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (triggerAnimation) {
      setSuccessAnimationData({
        visible: true,
        chainId: triggerAnimation.chainId,
        chainName: triggerAnimation.chainName,
      });
    }
  }, [triggerAnimation]);


  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('favoriteChains');
      if (savedFavorites) {
        setFavoriteChains(JSON.parse(savedFavorites));
      }
    } catch (e) {
      console.error('Error parsing favorite chains', e);
      setFavoriteChains([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favoriteChains', JSON.stringify(favoriteChains));
  }, [favoriteChains]);

  useEffect(() => {
    if (successChainId) {
      const timer = setTimeout(() => setSuccessChainId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successChainId]);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setChainStatusMap(prevMap => {
        const newMap = { ...prevMap };
        let updated = false;

        Object.keys(newMap).forEach(chainIdStr => {
          const chainId = parseInt(chainIdStr);
          const status = newMap[chainId];

          if (status.timeUntilNextCheckin > 0) {
            newMap[chainId] = {
              ...status,
              timeUntilNextCheckin: status.timeUntilNextCheckin - 1
            };

            if (newMap[chainId].timeUntilNextCheckin === 0) {
              newMap[chainId].canCheckin = true;
              updated = true;
            }
          }
        });

        return updated ? newMap : prevMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && address && signer) {
      checkAllChainsStatus();
    } else {
      setChainStatusMap({});
    }
  }, [isConnected, address, signer]);

  const toggleFavorite = useCallback((chainId: number): void => {
    setFavoriteChains(prev => {
      if (prev.includes(chainId)) {
        return prev.filter(id => id !== chainId);
      } else {
        return [...prev, chainId];
      }
    });
  }, []);

  const checkAllChainsStatus = async (): Promise<void> => {
    if (!isConnected || !signer || !address) {
      console.log("Not connected or missing signer/address");
      return;
    }

    setIsLoading(true);
    const supportedChainIds = getSupportedChainIds();
    const statusMap: Record<number, ChainCheckinStatus> = {};

    try {
      supportedChainIds.forEach(chainId => {
        statusMap[chainId] = {
          canCheckin: true,
          lastCheckin: null,
          timeUntilNextCheckin: 0
        };
      });

      setChainStatusMap(statusMap);

      const BATCH_SIZE = 3;
      const DELAY_BETWEEN_REQUESTS = 500;

      for (let i = 0; i < supportedChainIds.length; i += BATCH_SIZE) {
        const batchChainIds = supportedChainIds.slice(i, i + BATCH_SIZE);

        const batchPromises = batchChainIds.map(async (chainId) => {
          try {
            await delay(Math.random() * 200);

            const contractAddress = getContractAddress(chainId);
            const abi = getChainAbi(chainId);
            if (!abi) {
              console.warn(`ABI not found for chain ${chainId}`);
              return { chainId, status: statusMap[chainId] };
            }

            const provider = new ethers.providers.JsonRpcProvider(SUPPORTED_CHAINS[chainId].rpcUrls[0]);
            const contract = new ethers.Contract(contractAddress, abi, provider);

            let canActivate = true;
            let lastBeacon = null;
            let timeRemaining = 0;

            try {
              canActivate = await contract.canActivateToday(address);

              try {
                const metrics = await contract.getNavigatorMetrics(address);
                lastBeacon = metrics.lastBeacon.toNumber() || null;

                if (!canActivate) {
                  const nextResetTime = metrics.nextResetTime.toNumber();
                  const currentTime = Math.floor(Date.now() / 1000);
                  timeRemaining = Math.max(0, nextResetTime - currentTime);
                }
              } catch (metricsError) {
                console.warn(`Couldn't get detailed metrics for chain ${chainId}:`, metricsError);
              }
            } catch (error) {
              console.error(`Error checking status for chain ${chainId}:`, error);
              return { chainId, status: statusMap[chainId] };
            }

            return {
              chainId,
              status: {
                canCheckin: canActivate,
                lastCheckin: lastBeacon,
                timeUntilNextCheckin: timeRemaining
              }
            };
          } catch (error) {
            console.error(`Error checking status for chain ${chainId}:`, error);
            return { chainId, status: statusMap[chainId] };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            statusMap[result.value.chainId] = result.value.status;
          }
        });

        setChainStatusMap({ ...statusMap });

        if (i + BATCH_SIZE < supportedChainIds.length) {
          await delay(DELAY_BETWEEN_REQUESTS);
        }
      }
    } catch (error) {
      console.error("Error checking chain statuses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckin = async (chainId: number): Promise<void> => {
    if (!isConnected || !signer || processingChainId !== null) {
      return;
    }

    setProcessingChainId(chainId);

    const toastId = toast.loading('Preparing transaction...');

    try {
      if (currentChainId !== chainId) {
        toast.loading('Switching network...', { id: toastId });
        await switchToChain(chainId);
        await delay(1000);
      }

      const updatedProvider = getProvider();
      if (!updatedProvider) throw new Error("Wallet provider not found.");
      const updatedSigner = updatedProvider.getSigner();

      const contract = getContract(updatedSigner, chainId);

      toast.loading('Waiting for your confirmation...', { id: toastId });
      const tx = await performCheckin(contract, chainId);

      setSuccessChainId(chainId);

      if (onCheckinSuccess) {
        onCheckinSuccess(chainId, tx.hash);
      }

      toast.loading('Transaction sent, waiting for confirmation...', { id: toastId });

      await tx.wait();

      toast.success('GM Sent successfully!', {
        id: toastId,
        duration: 5000,
      });

      setChainStatusMap(prev => ({
        ...prev,
        [chainId]: {
          ...prev[chainId],
          canCheckin: false,
          lastCheckin: Math.floor(Date.now() / 1000),
          timeUntilNextCheckin: 86400,
        }
      }));

    } catch (error: any) {
      console.error("Failed to perform checkin:", error);

      let friendlyMessage = "An unknown error occurred. Please try again.";

      if (error.code === 'ACTION_REJECTED') {
        friendlyMessage = "Transaction Rejected: You cancelled the request in your wallet.";
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        friendlyMessage = "Insufficient Funds: You don't have enough balance for the transaction fee.";
      } else if (error.code === 'CALL_EXCEPTION') {
        friendlyMessage = "Execution Error: The contract could not complete the transaction.";
      }

      toast.error(friendlyMessage, {
        id: toastId,
        duration: 6000,
      });

    } finally {
      setProcessingChainId(null);
      setNetworkSwitchingChainId(null);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Available";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const isTestnet = (chain: Chain): boolean => {
    return chain.chainName.toLowerCase().includes('testnet') ||
      chain.chainName.toLowerCase().includes('sepolia') ||
      chain.chainName.toLowerCase().includes('goerli') ||
      chain.chainName.toLowerCase().includes('mumbai') ||
      chain.chainName.toLowerCase().includes('alfajores') ||
      chain.chainName.toLowerCase().includes('fuji') ||
      chain.chainName.toLowerCase().includes('holesky') ||
      chain.id === 11155111 ||
      chain.id === 5 ||
      chain.id === 43113 ||
      chain.id === 17000;
  };

  const supportedChains: Chain[] = getSupportedChainIds().map(id => ({
    id,
    ...SUPPORTED_CHAINS[id],
    status: chainStatusMap[id] || {
      canCheckin: true,
      lastCheckin: null,
      timeUntilNextCheckin: 0
    }
  }));

  const getFilteredAndSortedChains = (): Chain[] => {
    let filteredChains = [...supportedChains];

    if (networkType !== 'all') {
      filteredChains = filteredChains.filter(chain => {
        if (networkType === 'testnet') {
          return isTestnet(chain);
        } else {
          return !isTestnet(chain);
        }
      });
    }

    switch (filter) {
      case 'available':
        filteredChains = filteredChains.filter(chain =>
          chain.status.canCheckin && chain.status.timeUntilNextCheckin === 0
        );
        break;
      case 'checked':
        filteredChains = filteredChains.filter(chain =>
          !chain.status.canCheckin || chain.status.timeUntilNextCheckin > 0
        );
        break;
      case 'favorites':
        filteredChains = filteredChains.filter(chain =>
          favoriteChains.includes(chain.id)
        );
        break;
    }

    switch (sortOption) {
      case 'name':
        filteredChains.sort((a, b) => a.chainName.localeCompare(b.chainName));
        break;
      case 'status':
        filteredChains.sort((a, b) => {
          if (a.status.canCheckin && !b.status.canCheckin) return -1;
          if (!a.status.canCheckin && b.status.canCheckin) return 1;

          return a.status.timeUntilNextCheckin - b.status.timeUntilNextCheckin;
        });
        break;
    }

    return filteredChains;
  };

  const filteredChains = getFilteredAndSortedChains();

  const availableChainCount = filteredChains.filter(
    chain => chain.status.canCheckin && chain.status.timeUntilNextCheckin === 0
  ).length;

  const getNetworkConfig = () => {
    switch (networkType) {
      case 'testnet':
        return {
          icon: FaFlask,
          gradient: 'from-blue-500/10 to-cyan-500/10',
          textColor: 'text-blue-600 dark:text-blue-400',
          badgeColor: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
        };
      case 'mainnet':
        return {
          icon: FaGlobe,
          gradient: 'from-cyan-500/10 to-blue-500/10',
          textColor: 'text-cyan-600 dark:text-cyan-400',
          badgeColor: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
        };
      default:
        return {
          icon: FaLayerGroup,
          gradient: 'from-blue-500/8 to-cyan-500/8',
          textColor: 'text-slate-700 dark:text-slate-300',
          badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
        };
    }
  };

  const networkConfig = getNetworkConfig();
  const NetworkIcon = networkConfig.icon;

  return (
    <div className="w-full pt-10 pb-20">
      {/* NETWORK TABS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-row justify-between items-center gap-2 md:gap-4 mb-6"
      >
        {/* Network Tabs - Left */}
        <div className="flex-1 overflow-x-auto no-scrollbar min-w-0">
          <div className="inline-flex bg-[#0B0E14]/60 p-1.5 rounded-full backdrop-blur-xl border border-white/5 min-w-max mx-auto md:mx-0">
            <button
              onClick={() => setNetworkType('all')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${networkType === 'all'
                ? 'bg-[#1A1D24] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              <div className="flex items-center">
                <FaLayerGroup className="mr-2 h-3.5 w-3.5" />
                All
              </div>
            </button>
            <button
              onClick={() => setNetworkType('mainnet')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${networkType === 'mainnet'
                ? 'bg-[#1A1D24] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              <div className="flex items-center">
                <FaGlobe className="mr-2 h-3.5 w-3.5" />
                Mainnet
              </div>
            </button>
            <button
              onClick={() => setNetworkType('testnet')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${networkType === 'testnet'
                ? 'bg-[#1A1D24] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              <div className="flex items-center">
                <FaFlask className="mr-2 h-3.5 w-3.5" />
                Testnet
              </div>
            </button>
          </div>
        </div>

        {/* Filter & Actions - Right */}
        <div className="flex-shrink-0 flex gap-2">
          {/* Filter Dropdown */}
          <div className="relative z-30 hidden md:block" ref={filterMenuRef}>
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="group flex items-center gap-2 px-3 py-2 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-lg text-xs font-medium text-gray-300 hover:border-white/10 hover:text-white transition-all duration-300"
            >
              <FaFilter className="text-cyan-400" size={11} />
              <span>{filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isFilterMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {isFilterMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-0 mt-2 w-40 bg-[#0B0E14]/95 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl z-20 overflow-hidden"
                >
                  <div className="py-1">
                    {['all', 'available', 'checked', 'favorites'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFilter(option as FilterType);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`group relative block w-full text-left px-3 py-2 text-xs font-medium transition-all duration-200 ${filter === option
                          ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                          }`}
                      >
                        <span className="relative z-10">
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Sort Dropdown */}
          <div className="relative hidden md:block" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="pl-3 pr-8 py-2 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-lg text-xs font-medium text-gray-300 hover:border-white/10 hover:text-white focus:outline-none transition-all duration-300 cursor-pointer whitespace-nowrap relative"
              aria-expanded={isSortDropdownOpen}
            >
              {SORT_OPTIONS.find(opt => opt.value === sortOption)?.label || 'Sort'}

              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isSortDropdownOpen && (
              <div className="absolute z-40 mt-2 w-full min-w-[150px] overflow-hidden rounded-lg shadow-2xl focus:outline-none bg-[#0B0E14]/95 backdrop-blur-md border border-white/10">
                {SORT_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setSortOption(option.value);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`px-3 py-2 text-xs cursor-pointer transition-all duration-200 ${sortOption === option.value
                      ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400 font-medium'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Refresh Button */}
          <button
            onClick={checkAllChainsStatus}
            disabled={isLoading || !isConnected}
            className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 overflow-hidden ${isLoading
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 cursor-wait'
              : !isConnected
                ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                : 'bg-[#0B0E14]/60 text-gray-300 border border-white/5 hover:border-white/10 hover:text-white active:scale-95'
              }`}
          >
            <div className="relative z-10 flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={12} />
                  <span className="hidden md:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden md:inline">Refresh</span>
                </>
              )}
            </div>
          </button>
        </div>
      </motion.div>

      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-xl p-6 mb-8 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <FaWallet className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Wallet Required</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Connect your wallet to say GM on multiple blockchain networks and start your daily journey.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isConnected && filteredChains.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12 px-6 bg-white/40 dark:bg-slate-800/20 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <FaMoon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {filter === 'favorites'
              ? "No favorite chains yet. Add some by clicking the star icon."
              : filter === 'available'
                ? `No available chains to say GM right now in ${networkType === 'testnet' ? 'testnet' : networkType === 'mainnet' ? 'mainnet' : 'any'} networks.`
                : filter === 'checked'
                  ? "You haven't said GM on any chains yet."
                  : "No chains match your filters."}
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredChains.map((chain, index) => {
          const chainStatus = chain.status;
          const isCurrentChain = currentChainId === chain.id;
          const isProcessing = processingChainId === chain.id;
          const isSuccess = successChainId === chain.id;
          const isFavorite = favoriteChains.includes(chain.id);
          const canActivateNow = chainStatus.canCheckin && chainStatus.timeUntilNextCheckin === 0;
          const isSwitchingToThisChain = networkSwitchingChainId === chain.id;

          return (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className={`
              rounded-xl overflow-hidden backdrop-blur-xl transition-all duration-300
              relative
              ${isCurrentChain
                  ? 'border-2 border-cyan-400/50 bg-[#0B0E14]/80 shadow-lg shadow-cyan-500/20'
                  : 'border border-white/5 bg-[#0B0E14]/60 hover:border-white/10'
                } 
              ${isSuccess ? 'ring-2 ring-cyan-400/40' : ''}
            `}
              style={{
                isolation: 'isolate',
                minHeight: '200px'
              }}
            >
              <div className="p-4 flex flex-col justify-between h-full relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${isCurrentChain
                        ? 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900/30'
                        : 'bg-gray-100 dark:bg-slate-700/50'
                        } transition-all duration-300`}>
                        <ChainLogo
                          logoUrl={chain.logoUrl}
                          altText={chain.chainName}
                          fill={true}
                          fallbackIcon="🔗"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{chain.chainName}</h3>
                        <div className="flex items-center mt-1">
                          {chainStatus.timeUntilNextCheckin > 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/30 flex items-center gap-1">
                              <FaClock className="w-2 h-2" />
                              {formatTime(chainStatus.timeUntilNextCheckin)}
                            </span>
                          ) : chainStatus.canCheckin ? (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-700/30">
                              Ready
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/30">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(chain.id)}
                      className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 transition-all duration-200 p-1 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      aria-label={`Toggle favorite for ${chain.chainName}`}
                    >
                      {isFavorite ? (
                        <FaStar className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                      ) : (
                        <FaRegStar className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isConnected && canActivateNow && !isProcessing && !isLoading) {
                      handleCheckin(chain.id);
                    }
                  }}
                  className={`w-full mt-3 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all duration-300 rounded-xl ${!isConnected || !canActivateNow || processingChainId !== null || isLoading
                    ? 'bg-[#0B0E14]/60 border border-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-[#0B0E14]/60 border border-white/20 hover:bg-cyan-500/20 text-white hover:border-cyan-500/30'
                    }`}
                  disabled={!isConnected || !canActivateNow || processingChainId !== null || isLoading}
                >
                  {isProcessing || isSwitchingToThisChain ? (
                    <>
                      <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                      <span>{isSwitchingToThisChain ? 'Switching...' : 'Sending...'}</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <FaCheckCircle className="h-4 w-4 mr-2" />
                      <span>GM Sent!</span>
                    </>
                  ) : !isConnected ? (
                    <>
                      <FaWallet className="h-4 w-4 mr-2" />
                      <span>Connect Wallet</span>
                    </>
                  ) : (
                    <span>GM on {chain.chainName}</span>
                  )}
                </button>
              </div>
              {successAnimationData.visible &&
                successAnimationData.chainId === chain.id && (
                  <div className="absolute inset-0 z-50 pointer-events-none">
                    <SuccessAnimation
                      isVisible={true}
                      checkinCount={1}
                      streak={userStats?.currentStreak || 0}
                      chainName={successAnimationData.chainName}
                      position="card"
                      soundEnabled={true}
                      onComplete={() => {
                        setSuccessAnimationData({
                          visible: false,
                          chainId: null,
                          chainName: ''
                        });
                        if (onAnimationComplete) {
                          onAnimationComplete();
                        }
                      }}
                    />
                  </div>
                )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiChainCheckinGrid;