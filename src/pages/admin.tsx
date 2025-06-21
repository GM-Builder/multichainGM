import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { 
  FaLeaf, FaSpinner, FaCheckCircle, FaClock, FaWallet, 
  FaExclamationTriangle, FaStar, FaRegStar, FaFilter, FaTimes,
  FaExchangeAlt, FaMoon, FaSun, FaChevronDown, FaBell,
  FaUsersCog, FaCog, FaChartLine, FaChartArea, FaUsers,
  FaMoneyBillWave, FaShieldAlt, FaLock, FaUnlock, FaCopy,
  FaExternalLinkAlt, FaSignOutAlt, FaHome, FaGlobe, FaTrophy,
  FaArrowUp, FaArrowDown, FaTrash, FaEdit, FaLifeRing
} from 'react-icons/fa';
import { MdOutlineRefresh } from "react-icons/md";
import { 
  SUPPORTED_CHAINS, 
  getSupportedChainIds,
  getContractAddress,
  isChainSupported,
  getChainConfig,
  TEA_SEPOLIA_CHAIN_ID,
  ChainConfig
} from '@/utils/constants';
import { 
  getProvider,
  getContract,
  connectWallet,
  switchToChain,
  formatAddress,
  formatTimestamp,
  formatTimeRemaining,
  getCurrentChainId
} from '@/utils/web3';
import ChainLogo from '@/components/ChainLogo';

// Deployer address - only this address can access admin functions
const DEPLOYER_ADDRESS = "0xEB862Fca835B0522b2c22fcd4959627d2851f6c0";

// TypeScript interfaces for contract data
interface SystemMetrics {
  isCircuitActive: boolean;
  isEmergencyActive: boolean;
  currentKeeper: string;
  currentVault: string;
  currentTax: ethers.BigNumber;
  vaultBalance: ethers.BigNumber;
  totalCrystalCount: ethers.BigNumber;
  totalNavigatorCount: ethers.BigNumber;
  currentDayIndex: ethers.BigNumber;
  contractAge: ethers.BigNumber;
}

interface TopPerformanceMetrics {
  maxDailyBeaconsCount: ethers.BigNumber;
  maxDailyBeaconsOnDay: ethers.BigNumber;
  totalTaxCollectedAmount: ethers.BigNumber;
  averageDailyBeacons: ethers.BigNumber;
  activeDaysCount: ethers.BigNumber;
}

interface DailyStatistics {
  beaconCount: ethers.BigNumber;
  taxCollected: ethers.BigNumber;
  isToday: boolean;
  isValidDay: boolean;
}

interface BatchDailyStatistics {
  beaconCounts: ethers.BigNumber[];
  taxAmounts: ethers.BigNumber[];
  dayIndexes: ethers.BigNumber[];
}

interface ChainData {
  chainId: number;
  systemMetrics: SystemMetrics | null;
  topMetrics: TopPerformanceMetrics | null;
  dailyStats: DailyStatistics | null;
  historicalStats: BatchDailyStatistics | null;
  isLoading: boolean;
  error: string | null;
}

const AdminDashboard: React.FC = () => {
  // Connection states
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'controls' | 'settings'>('overview');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('gm-admin-theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState<boolean>(false);
  
  // Loading and message states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Access control
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(false);
  
  // Multi-chain data
  const [chainsData, setChainsData] = useState<Record<number, ChainData>>({});
  const [selectedChainId, setSelectedChainId] = useState<number>(TEA_SEPOLIA_CHAIN_ID);
  
  // Form states
  const [newKeeperAddress, setNewKeeperAddress] = useState<string>('');
  const [newVaultAddress, setNewVaultAddress] = useState<string>('');
  const [newTaxAmount, setNewTaxAmount] = useState<string>('');
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [confirmationAction, setConfirmationAction] = useState<{
    name: string;
    handler: () => Promise<void>;
    description: string;
    danger: boolean;
  } | null>(null);
  
  // Refs
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Initialize dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Check wallet connection on load
  useEffect(() => {
    checkExistingConnection();
  }, []);

  // Check access when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkAdminAccess();
    } else {
      setIsAuthorized(false);
    }
  }, [isConnected, address]);

  // Load data when authorized and chain selected
  useEffect(() => {
    if (isAuthorized && selectedChainId && signer) {
      loadChainData(selectedChainId);
    }
  }, [isAuthorized, selectedChainId, signer]);

  const checkExistingConnection = async () => {
    try {
      const localProvider = getProvider();
      if (!localProvider) return;
      
      const accounts = await localProvider.listAccounts();
      if (accounts.length > 0) {
        const localSigner = localProvider.getSigner();
        const localAddress = accounts[0];
        const network = await localProvider.getNetwork();
        const localChainId = network.chainId;
        
        setIsConnected(true);
        setAddress(localAddress);
        setSigner(localSigner);
        setProvider(localProvider);
        setCurrentChainId(localChainId);
        
        if (isChainSupported(localChainId)) {
          setSelectedChainId(localChainId);
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const checkAdminAccess = async () => {
    if (!address) {
      setIsAuthorized(false);
      return;
    }

    setIsCheckingAccess(true);
    try {
      const userAddress = address.toLowerCase();
      const deployerAddress = DEPLOYER_ADDRESS.toLowerCase();
      
      if (userAddress === deployerAddress) {
        setIsAuthorized(true);
        setSuccessMessage("Admin access granted");
      } else {
        setIsAuthorized(false);
        setErrorMessage(`Access denied. Only the deployer (${formatAddress(DEPLOYER_ADDRESS)}) can access admin functions.`);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsAuthorized(false);
      setErrorMessage("Failed to verify admin access.");
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const loadChainData = async (chainId: number) => {
    if (!signer) return;

    setChainsData(prev => ({
      ...prev,
      [chainId]: {
        ...prev[chainId],
        chainId,
        isLoading: true,
        error: null
      }
    }));

    try {
      // Create contract instance for the specific chain
      const contractAddress = getContractAddress(chainId);
      const GMOnchainABI = require("../abis/GMOnchainABI.json");
      
      // Use chain-specific RPC provider
      const chainConfig = getChainConfig(chainId);
      const rpcProvider = new ethers.providers.JsonRpcProvider(chainConfig?.rpcUrls[0]);
      const contract = new ethers.Contract(contractAddress, GMOnchainABI, rpcProvider);

      const [systemMetrics, topMetrics] = await Promise.all([
        contract.getSystemMetrics(),
        contract.getTopPerformanceMetrics()
      ]);

      // Get current day and daily stats
      const currentDay = systemMetrics.currentDayIndex;
      const dailyStats = await contract.getDailyStatistics(currentDay);

      // Load historical data for last 30 days
      const startDay = Math.max(0, currentDay.toNumber() - 29);
      let historicalStats = null;
      
      try {
        historicalStats = await contract.getDailyStatisticsBatch(startDay, currentDay.toNumber());
      } catch (error) {
        console.warn(`Failed to load historical data for chain ${chainId}:`, error);
      }

      setChainsData(prev => ({
        ...prev,
        [chainId]: {
          chainId,
          systemMetrics,
          topMetrics,
          dailyStats,
          historicalStats,
          isLoading: false,
          error: null
        }
      }));
    } catch (error: any) {
      console.error(`Error loading data for chain ${chainId}:`, error);
      setChainsData(prev => ({
        ...prev,
        [chainId]: {
          ...prev[chainId],
          chainId,
          isLoading: false,
          error: error.message || 'Failed to load chain data'
        }
      }));
    }
  };

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      const { signer: newSigner, address: newAddress, chainId, provider: newProvider } = await connectWallet();
      
      setIsConnected(true);
      setAddress(newAddress);
      setSigner(newSigner);
      setProvider(newProvider);
      setCurrentChainId(chainId);
      
      if (isChainSupported(chainId)) {
        setSelectedChainId(chainId);
      }
      
      setSuccessMessage("Wallet connected successfully");
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setErrorMessage(error.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
      setIsWalletModalOpen(false);
    }
  };

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      setIsLoading(true);
      await switchToChain(chainId);
      
      // Wait for network switch
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newProvider = getProvider();
      if (newProvider) {
        const newSigner = newProvider.getSigner();
        const network = await newProvider.getNetwork();
        
        setCurrentChainId(network.chainId);
        setSigner(newSigner);
        setSelectedChainId(chainId);
        
        setSuccessMessage(`Switched to ${getChainConfig(chainId)?.chainName}`);
      }
    } catch (error: any) {
      console.error("Error switching network:", error);
      setErrorMessage(error.message || "Failed to switch network");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setCurrentChainId(null);
    setIsAuthorized(false);
    setChainsData({});
    setIsAccountMenuOpen(false);
    setSuccessMessage("Wallet disconnected");
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('gm-admin-theme', newTheme ? 'dark' : 'light');
  };

  const refreshData = async () => {
    if (!isAuthorized || !selectedChainId) return;
    await loadChainData(selectedChainId);
  };

  const openConfirmation = (name: string, handler: () => Promise<void>, description: string, danger = true) => {
    setConfirmationAction({ name, handler, description, danger });
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmationAction) return;
    
    setProcessingAction(confirmationAction.name);
    try {
      await confirmationAction.handler();
      setSuccessMessage(`${confirmationAction.name} completed successfully`);
      await refreshData();
    } catch (error: any) {
      console.error(`Error in ${confirmationAction.name}:`, error);
      setErrorMessage(error.message || `Failed to ${confirmationAction.name.toLowerCase()}`);
    } finally {
      setProcessingAction(null);
      setIsConfirmationModalOpen(false);
      setConfirmationAction(null);
    }
  };

  // Admin action handlers - these require signer for current chain
  const getContractForCurrentChain = async () => {
    if (!signer || !currentChainId) {
      throw new Error("No signer or current chain available");
    }
    return getContract(signer, currentChainId);
  };

  const handleEngageCircuit = async () => {
    const contract = await getContractForCurrentChain();
    const tx = await contract.engageCircuitBreaker();
    await tx.wait();
  };

  const handleReleaseCircuit = async () => {
    const contract = await getContractForCurrentChain();
    const tx = await contract.releaseCircuitBreaker();
    await tx.wait();
  };

  const handleToggleEmergency = async () => {
    const contract = await getContractForCurrentChain();
    const tx = await contract.toggleEmergencyProtocol();
    await tx.wait();
  };

  const handleTransferKeeper = async () => {
    if (!newKeeperAddress) throw new Error("Keeper address required");
    const contract = await getContractForCurrentChain();
    const tx = await contract.transferKeeperRole(newKeeperAddress);
    await tx.wait();
    setNewKeeperAddress('');
  };

  const handleRedirectVault = async () => {
    if (!newVaultAddress) throw new Error("Vault address required");
    const contract = await getContractForCurrentChain();
    const tx = await contract.redirectVault(newVaultAddress);
    await tx.wait();
    setNewVaultAddress('');
  };

  const handleAdjustTax = async () => {
    if (!newTaxAmount) throw new Error("Tax amount required");
    const contract = await getContractForCurrentChain();
    const taxWei = ethers.utils.parseEther(newTaxAmount);
    const tx = await contract.adjustChannelTax(taxWei);
    await tx.wait();
    setNewTaxAmount('');
  };

  const handleDrainVault = async () => {
    const contract = await getContractForCurrentChain();
    const tx = await contract.drainVault();
    await tx.wait();
  };

  const handleRecoverAsset = async () => {
    if (!tokenAddress || !tokenAmount) throw new Error("Token address and amount required");
    const contract = await getContractForCurrentChain();
    const tx = await contract.recoverAsset(tokenAddress, tokenAmount);
    await tx.wait();
    setTokenAddress('');
    setTokenAmount('');
  };

  const handleDestroyNode = async () => {
    const contract = await getContractForCurrentChain();
    const tx = await contract.destroyNode();
    await tx.wait();
  };

  // Get current chain data
  const currentChainData = chainsData[selectedChainId];
  const systemMetrics = currentChainData?.systemMetrics;
  const topMetrics = currentChainData?.topMetrics;
  const dailyStats = currentChainData?.dailyStats;
  const historicalStats = currentChainData?.historicalStats;

  // Format helpers
  const formatEth = (wei: ethers.BigNumber | undefined): string => {
    if (!wei) return "0";
    return ethers.utils.formatEther(wei);
  };

  const formatNumber = (num: ethers.BigNumber | number | undefined): string => {
    if (!num) return "0";
    const value = typeof num === 'number' ? num : num.toNumber();
    return new Intl.NumberFormat().format(value);
  };

  // Components
  const StatusAlert: React.FC<{ type: 'error' | 'success'; message: string; onClose: () => void }> = ({ type, message, onClose }) => (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-xl shadow-sm ${
        type === 'error' 
          ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50'
          : 'bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50'
      }`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        type === 'error' 
          ? 'bg-red-100 dark:bg-red-900/50'
          : 'bg-green-100 dark:bg-green-900/50'
      }`}>
        {type === 'error' ? (
          <FaExclamationTriangle className={`w-3 h-3 text-red-600 dark:text-red-400`} />
        ) : (
          <FaCheckCircle className={`w-3 h-3 text-green-600 dark:text-green-400`} />
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${
          type === 'error' 
            ? 'text-red-700 dark:text-red-300'
            : 'text-green-700 dark:text-green-300'
        }`}>{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
        <FaTimes className="w-4 h-4" />
      </button>
    </motion.div>
  );

  const Sidebar = () => {
    const menuItems = [
      { id: 'overview', name: 'Overview', icon: FaHome },
      { id: 'analytics', name: 'Analytics', icon: FaChartArea },
      { id: 'controls', name: 'Controls', icon: FaCog },
      { id: 'settings', name: 'Settings', icon: FaUsersCog }
    ];

    return (
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <FaLeaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-white">GM Admin</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 lg:hidden rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Chain Selector */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Network
            </div>
            <div className="relative">
              <select
                value={selectedChainId}
                onChange={(e) => {
                  const chainId = parseInt(e.target.value);
                  setSelectedChainId(chainId);
                  if (chainId !== currentChainId && isAuthorized) {
                    handleSwitchNetwork(chainId);
                  }
                }}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getSupportedChainIds().map(chainId => (
                  <option key={chainId} value={chainId}>
                    {getChainConfig(chainId)?.chainName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  disabled={!isAuthorized}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTab === item.id
                      ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 backdrop-blur-xl border border-blue-200/50 dark:border-blue-700/50'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:backdrop-blur-xl'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              <div className="flex items-center">
                {isDarkMode ? (
                  <FaMoon className="w-5 h-5 mr-3" />
                ) : (
                  <FaSun className="w-5 h-5 mr-3" />
                )}
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Header = () => (
    <header className={`fixed top-0 left-0 right-0 z-20 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between px-4 ${
      isSidebarOpen ? 'lg:pl-64' : ''
    }`}>
      <div className="flex items-center">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 lg:hidden rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-bold text-gray-800 dark:text-white lg:hidden">
          GM Protocol Admin
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Current Network Indicator */}
        {isConnected && currentChainId && (
          <div className="hidden sm:flex items-center p-1 pr-3 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-full border border-gray-200/30 dark:border-gray-700/30">
            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2">
              {currentChainId && isChainSupported(currentChainId) ? (
                <ChainLogo 
                  logoUrl={getChainConfig(currentChainId)?.logoUrl || ''}
                  altText={getChainConfig(currentChainId)?.chainName || ''}
                  size="sm"
                  fallbackIcon="🔗"
                />
              ) : (
                <FaExclamationTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {currentChainId && isChainSupported(currentChainId) 
                ? getChainConfig(currentChainId)?.chainName 
                : "Unsupported"}
            </span>
          </div>
        )}

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-full relative border border-gray-200/30 dark:border-gray-700/30 transition-colors"
          >
            <FaBell className="w-5 h-5" />
            {systemMetrics?.isCircuitActive || systemMetrics?.isEmergencyActive ? (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            ) : null}
          </button>
          
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg"
              >
                <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">System Status</h3>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {systemMetrics?.isCircuitActive && (
                    <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 flex items-start">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                        <FaLock className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Circuit Breaker Active</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contract interactions are paused</p>
                      </div>
                    </div>
                  )}
                  
                  {systemMetrics?.isEmergencyActive && (
                    <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 flex items-start">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                        <FaExclamationTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Emergency Mode Active</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fee-free transactions enabled</p>
                      </div>
                    </div>
                  )}
                  
                  {(!systemMetrics?.isCircuitActive && !systemMetrics?.isEmergencyActive) && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      System operating normally
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wallet Connection */}
        {!isConnected ? (
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 shadow-sm"
          >
            <FaWallet className="w-4 h-4 mr-2" />
            Connect
          </button>
        ) : (
          <div ref={accountMenuRef} className="relative">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 border border-gray-200/30 dark:border-gray-700/30"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mr-2">
                <span className="text-xs text-white font-bold">
                  {address ? address.slice(2, 4).toUpperCase() : ''}
                </span>
              </div>
              <span className="text-gray-700 dark:text-gray-300 hidden sm:block">
                {formatAddress(address || '')}
              </span>
              <FaChevronDown className="w-3 h-3 ml-2 text-gray-500" />
            </button>
            
            <AnimatePresence>
              {isAccountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg"
                >
                  <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connected as</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 break-all">{address}</p>
                    {isAuthorized && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                        Admin Access
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(address || '');
                        setSuccessMessage('Address copied to clipboard');
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <FaCopy className="w-4 h-4 mr-3" />
                      Copy Address
                    </button>
                    
                    {currentChainId && isChainSupported(currentChainId) && (
                      <a
                        href={`${getChainConfig(currentChainId)?.blockExplorerUrls?.[0]}/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <FaExternalLinkAlt className="w-4 h-4 mr-3" />
                        View on Explorer
                      </a>
                    )}
                    
                    <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-2"></div>
                    
                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <FaSignOutAlt className="w-4 h-4 mr-3" />
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );

  const WalletModal = () => (
    <AnimatePresence>
      {isWalletModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsWalletModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Connect Wallet</h2>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl transition-all duration-200 backdrop-blur-xl"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center mr-3">
                  <FaWallet className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-800 dark:text-white">MetaMask</span>
              </div>
              {isLoading ? (
                <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <FaExternalLinkAlt className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Only the deployer address can access admin functions
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ConfirmationModal = () => (
    <AnimatePresence>
      {isConfirmationModalOpen && confirmationAction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                confirmationAction.danger 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {confirmationAction.danger ? (
                  <FaExclamationTriangle className={`w-8 h-8 text-red-600 dark:text-red-400`} />
                ) : (
                  <FaEdit className={`w-8 h-8 text-blue-600 dark:text-blue-400`} />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{confirmationAction.name}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{confirmationAction.description}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmationModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors backdrop-blur-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processingAction !== null}
                className={`flex-1 py-2.5 px-4 text-white font-medium rounded-lg transition-colors ${
                  processingAction !== null
                    ? 'bg-gray-400 cursor-not-allowed'
                    : confirmationAction.danger 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processingAction !== null ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                    Processing...
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    subtitle?: string; 
    icon: React.ComponentType<any>; 
    color?: 'blue' | 'green' | 'purple' | 'amber';
    loading?: boolean;
  }> = ({ title, value, subtitle, icon: Icon, color = 'blue', loading = false }) => {
    const colorClasses: Record<'blue' | 'green' | 'purple' | 'amber', string> = {
      blue: 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      purple: 'bg-purple-100/50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      amber: 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    };

    return (
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
          <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center backdrop-blur-xl`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              {subtitle && <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-2"></div>}
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
              {subtitle && (
                <div className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const OverviewTab = () => {
    if (!isConnected) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-xl">
            <FaWallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Connect your wallet to access the GM Protocol admin dashboard and manage contract settings across multiple networks.
          </p>
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm"
          >
            <FaWallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </button>
        </motion.div>
      );
    }

    if (!isAuthorized) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-red-100/50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-xl">
            <FaExclamationTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
            Only the contract deployer can access admin functions.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Deployer Address: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{formatAddress(DEPLOYER_ADDRESS)}</code>
          </div>
          {isCheckingAccess && (
            <div className="mt-4 flex items-center justify-center">
              <FaSpinner className="animate-spin w-5 h-5 text-blue-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">Verifying access...</span>
            </div>
          )}
        </motion.div>
      );
    }

    const isDataLoading = currentChainData?.isLoading || !systemMetrics;

    return (
      <div className="space-y-6">
        {/* Header with Chain Info and Refresh */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mr-3">
                <FaLeaf className="text-white" size={16} />
              </div>
              Protocol Overview
              <div className="ml-3 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full backdrop-blur-xl border border-blue-200/50 dark:border-blue-700/50">
                {getChainConfig(selectedChainId)?.chainName}
              </div>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor and manage GM Protocol across multiple networks</p>
          </div>
          
          <button 
            onClick={refreshData}
            disabled={isDataLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm ${
              isDataLoading 
                ? 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500/10 to-emerald-500/10 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:from-blue-500/20 hover:to-emerald-500/20 border border-blue-200/50 dark:border-emerald-400/30'
            }`}
          >
            {isDataLoading ? (
              <>
                <FaSpinner className="animate-spin" size={14} />
                Loading...
              </>
            ) : (
              <>
                <MdOutlineRefresh size={14} />
                Refresh
              </>
            )}
          </button>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <MetricCard
              title="Total GMs"
              value={formatNumber(systemMetrics?.totalCrystalCount)}
              subtitle="All time beacons"
              icon={FaStar}
              color="blue"
              loading={isDataLoading}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <MetricCard
              title="Navigators"
              value={formatNumber(systemMetrics?.totalNavigatorCount)}
              subtitle="Active users"
              icon={FaUsers}
              color="green"
              loading={isDataLoading}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <MetricCard
              title="Today's GMs"
              value={formatNumber(dailyStats?.beaconCount)}
              subtitle="Current progress"
              icon={FaTrophy}
              color="purple"
              loading={isDataLoading}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <MetricCard
              title="Vault Balance"
              value={`${parseFloat(formatEth(systemMetrics?.vaultBalance)).toFixed(4)} ETH`}
              subtitle="Treasury funds"
              icon={FaMoneyBillWave}
              color="amber"
              loading={isDataLoading}
            />
          </motion.div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Contract Status</h3>
              {isDataLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Circuit Breaker</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl ${
                      systemMetrics?.isCircuitActive 
                        ? 'bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50'
                        : 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                    }`}>
                      {systemMetrics?.isCircuitActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Emergency Mode</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl ${
                      systemMetrics?.isEmergencyActive 
                        ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                        : 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                    }`}>
                      {systemMetrics?.isEmergencyActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Contract Age</span>
                    <span className="text-gray-800 dark:text-white font-medium">{formatNumber(systemMetrics?.contractAge)} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Current Tax</span>
                    <span className="text-gray-800 dark:text-white font-medium">{parseFloat(formatEth(systemMetrics?.currentTax)).toFixed(6)} ETH</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
              {!isDataLoading && currentChainId === selectedChainId ? (
                <div className="space-y-3">
                  <button
                    onClick={() => openConfirmation(
                      systemMetrics?.isCircuitActive ? "Release Circuit Breaker" : "Engage Circuit Breaker",
                      systemMetrics?.isCircuitActive ? handleReleaseCircuit : handleEngageCircuit,
                      systemMetrics?.isCircuitActive 
                        ? "Release the circuit breaker to resume normal operations?"
                        : "Engage circuit breaker to pause all contract interactions?",
                      true
                    )}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 backdrop-blur-xl ${
                      systemMetrics?.isCircuitActive
                        ? 'bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200/50 dark:hover:bg-red-900/50 border border-red-200/50 dark:border-red-800/50'
                        : 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 border border-amber-200/50 dark:border-amber-800/50'
                    }`}
                  >
                    {systemMetrics?.isCircuitActive ? <FaUnlock className="w-4 h-4 mr-2" /> : <FaLock className="w-4 h-4 mr-2" />}
                    {systemMetrics?.isCircuitActive ? 'Release Circuit' : 'Engage Circuit'}
                  </button>
                  
                  <button
                    onClick={() => openConfirmation(
                      "Toggle Emergency Mode",
                      handleToggleEmergency,
                      "Toggle emergency protocol mode?",
                      false
                    )}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200/50 dark:hover:bg-blue-900/50 rounded-lg font-medium transition-all duration-200 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50"
                  >
                    <FaShieldAlt className="w-4 h-4 mr-2" />
                    Toggle Emergency
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isDataLoading ? "Loading..." : "Switch to this network to perform actions"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Activity Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">GM Activity (Last 30 Days)</h3>
              <button 
                onClick={refreshData} 
                disabled={isDataLoading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {isDataLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <MdOutlineRefresh className="w-4 h-4" />}
              </button>
            </div>
            
            {isDataLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : historicalStats ? (
              <div className="h-64 flex items-end justify-between space-x-1">
                {historicalStats.beaconCounts.map((count, index) => {
                  const maxCount = Math.max(...historicalStats.beaconCounts.map(c => c.toNumber()));
                  const height = maxCount > 0 ? (count.toNumber() / maxCount) * 200 : 4;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-emerald-500 rounded-t opacity-80 hover:opacity-100 transition-all duration-200 cursor-pointer relative"
                        style={{ 
                          height: `${Math.max(height, 4)}px`,
                        }}
                        title={`Day ${historicalStats.dayIndexes[index].toString()}: ${count.toString()} GMs`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {count.toString()} GMs
                        </div>
                      </div>
                      {index % 5 === 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {historicalStats.dayIndexes[index].toString()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No historical data available</p>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {isDataLoading ? "..." : formatNumber(dailyStats?.beaconCount)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {isDataLoading ? "..." : formatNumber(topMetrics?.averageDailyBeacons)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {isDataLoading ? "..." : formatNumber(topMetrics?.maxDailyBeaconsCount)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Peak</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const ControlsTab = () => {
    if (!isConnected || !isAuthorized) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-red-100/50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-xl">
            <FaCog className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Access Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Connect your wallet with deployer access to manage contract controls
          </p>
          {!isConnected && (
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm"
            >
              <FaWallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </button>
          )}
        </motion.div>
      );
    }

    const canPerformActions = currentChainId === selectedChainId;

    return (
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mr-3">
              <FaCog className="text-white" size={16} />
            </div>
            Contract Controls
            <div className="ml-3 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full backdrop-blur-xl border border-blue-200/50 dark:border-blue-700/50">
              {getChainConfig(selectedChainId)?.chainName}
            </div>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage keeper roles, vault settings, and emergency controls
          </p>
          {!canPerformActions && (
            <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-lg backdrop-blur-xl">
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                ⚠️ Switch to {getChainConfig(selectedChainId)?.chainName} network to perform actions on this chain
              </p>
            </div>
          )}
        </motion.div>

        {/* Keeper Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Keeper Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Keeper
                </label>
                <div className="p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-xl border border-gray-200/30 dark:border-gray-600/30">
                  <span className="text-gray-800 dark:text-white font-mono text-sm">
                    {systemMetrics?.currentKeeper ? formatAddress(systemMetrics.currentKeeper) : "Loading..."}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Keeper Address
                </label>
                <input
                  type="text"
                  value={newKeeperAddress}
                  onChange={(e) => setNewKeeperAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/30 text-gray-800 dark:text-white transition-all"
                />
              </div>
              
              <button
                onClick={() => openConfirmation(
                  "Transfer Keeper Role",
                  handleTransferKeeper,
                  `Transfer keeper role to ${formatAddress(newKeeperAddress)}?`,
                  true
                )}
                disabled={!newKeeperAddress || !canPerformActions || processingAction !== null}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                Transfer Role
              </button>
            </div>
          </div>
        </motion.div>

        {/* Vault Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Vault Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Vault
                </label>
                <div className="p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-xl border border-gray-200/30 dark:border-gray-600/30">
                  <span className="text-gray-800 dark:text-white font-mono text-sm">
                    {systemMetrics?.currentVault ? formatAddress(systemMetrics.currentVault) : "Loading..."}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Vault Address
                </label>
                <input
                  type="text"
                  value={newVaultAddress}
                  onChange={(e) => setNewVaultAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/30 text-gray-800 dark:text-white transition-all"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => openConfirmation(
                    "Redirect Vault",
                    handleRedirectVault,
                    `Redirect vault to ${formatAddress(newVaultAddress)}?`,
                    false
                  )}
                  disabled={!newVaultAddress || !canPerformActions || processingAction !== null}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  Redirect Vault
                </button>
                
                <button
                  onClick={() => openConfirmation(
                    "Drain Vault",
                    handleDrainVault,
                    "Drain all ETH from the vault to keeper address?",
                    true
                  )}
                  disabled={!canPerformActions || processingAction !== null || !systemMetrics?.vaultBalance || systemMetrics.vaultBalance.eq(0)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  Drain Vault
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tax Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Tax Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Tax Rate
                </label>
                <div className="p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-xl border border-gray-200/30 dark:border-gray-600/30">
                  <span className="text-gray-800 dark:text-white">
                    {systemMetrics?.currentTax ? `${parseFloat(formatEth(systemMetrics.currentTax)).toFixed(6)} ETH per GM` : "Loading..."}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Tax Amount (ETH)
                </label>
                <input
                  type="number"
                  value={newTaxAmount}
                  onChange={(e) => setNewTaxAmount(e.target.value)}
                  placeholder="0.000029"
                  step="0.000001"
                  min="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/30 text-gray-800 dark:text-white transition-all"
                />
              </div>
              
              <button
                onClick={() => openConfirmation(
                  "Adjust Tax Rate",
                  handleAdjustTax,
                  `Adjust tax rate to ${newTaxAmount} ETH per GM?`,
                  false
                )}
                disabled={!newTaxAmount || !canPerformActions || processingAction !== null}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                Adjust Tax
              </button>
            </div>
          </div>
        </motion.div>

        {/* Emergency Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Emergency Controls</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-xl border border-gray-200/30 dark:border-gray-600/30">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">Asset Recovery</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      placeholder="Token Contract Address"
                      className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 text-gray-800 dark:text-white transition-all"
                    />
                    <input
                      type="text"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 text-gray-800 dark:text-white transition-all"
                    />
                    <button
                      onClick={() => openConfirmation(
                        "Recover Asset",
                        handleRecoverAsset,
                        `Recover ${tokenAmount} tokens from ${formatAddress(tokenAddress)}?`,
                        false
                      )}
                      disabled={!tokenAddress || !tokenAmount || !canPerformActions || processingAction !== null}
                      className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg text-sm transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      Recover Asset
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-lg backdrop-blur-xl border border-red-200/50 dark:border-red-800/50">
                  <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Danger Zone</h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                    Permanently destroy the contract. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => openConfirmation(
                      "Destroy Contract",
                      handleDestroyNode,
                      "⚠️ WARNING: This will PERMANENTLY DESTROY the contract. This action is IRREVERSIBLE. Are you absolutely sure?",
                      true
                    )}
                    disabled={!canPerformActions || processingAction !== null}
                    className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg text-sm transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    <FaTrash className="w-4 h-4 mr-2 inline" />
                    Destroy Contract
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'analytics':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center shadow-sm"
          >
            <FaChartArea className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Advanced Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300">Detailed analytics and reporting features coming soon...</p>
          </motion.div>
        );
      case 'controls':
        return <ControlsTab />;
      case 'settings':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center shadow-sm"
          >
            <FaUsersCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Admin Settings</h2>
            <p className="text-gray-600 dark:text-gray-300">Configuration and preferences panel coming soon...</p>
          </motion.div>
        );
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-emerald-900/10">
        <Sidebar />
        <Header />
        
        <main className={`pt-16 pb-8 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Status Alerts */}
            <div className="mb-6 space-y-3">
              <AnimatePresence>
                {errorMessage && (
                  <StatusAlert 
                    type="error" 
                    message={errorMessage} 
                    onClose={() => setErrorMessage(null)} 
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {successMessage && (
                  <StatusAlert 
                    type="success" 
                    message={successMessage} 
                    onClose={() => setSuccessMessage(null)} 
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </main>

        {/* Modals */}
        <WalletModal />
        <ConfirmationModal />
      </div>
    </div>
  );
};

export default AdminDashboard;