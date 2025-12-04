// src/components/TokenFactory.tsx
import React, { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Settings,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Copy,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import FactoryABI from '@/abis/GannetXTokenFactory.json';
import { GANNETX_TOKEN_FACTORY_ADDRESS, BASE_CHAIN_ID } from '@/utils/constants';
import { switchToChain, getProvider } from '@/utils/web3';
import { useWalletState } from '@/hooks/useWalletState';
import { saveTokenMetadata, getTokenMetadata } from '@/utils/tokenStorage';
import { TokenMetadata } from '@/types/token';
import TokenBadge from '@/components/TokenBadge';

// ==================== TYPES ====================
interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  taxRecipient: string;
  buyTax: number;
  sellTax: number;
  maxTxAmount: string;
  maxWalletAmount: string;
  cooldownTime: number;
  burnPercentage: number;
  reflectionPercentage: number;
}

interface Features {
  hasTaxSystem: boolean;
  hasAntiBot: boolean;
  hasMaxTxLimit: boolean;
  hasMaxWallet: boolean;
  hasCooldown: boolean;
  hasBlacklist: boolean;
  isPausable: boolean;
  hasBurn: boolean;
  hasReflection: boolean;
  hasWhitelist: boolean;
}

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Rocket },
  { id: 2, name: 'Features', icon: Settings },
  { id: 3, name: 'Advanced', icon: Shield },
  { id: 4, name: 'Review', icon: CheckCircle2 },
];

const FEATURE_FEES = {
  BASE_FEE: '0.0001',
  TAX_SYSTEM_FEE: '0.0003',
  ANTI_BOT_FEE: '0.0002',
  MAX_TX_LIMIT_FEE: '0.0001',
  MAX_WALLET_FEE: '0.0001',
  COOLDOWN_FEE: '0.0001',
  BLACKLIST_FEE: '0.0002',
  PAUSABLE_FEE: '0.0001',
  BURN_FEE: '0.0002',
  REFLECTION_FEE: '0.0003',
  WHITELIST_FEE: '0.0001',
};

// ==================== MAIN COMPONENT ====================
const TokenFactory: React.FC = () => {
  const { web3State } = useWalletState();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedToken, setDeployedToken] = useState<string | null>(null);

  const [config, setConfig] = useState<TokenConfig>({
    name: '',
    symbol: '',
    decimals: 18,
    totalSupply: '1000000',
    taxRecipient: '',
    buyTax: 0,
    sellTax: 0,
    maxTxAmount: '',
    maxWalletAmount: '',
    cooldownTime: 30,
    burnPercentage: 0,
    reflectionPercentage: 0,
  });

  const [features, setFeatures] = useState<Features>({
    hasTaxSystem: false,
    hasAntiBot: false,
    hasMaxTxLimit: false,
    hasMaxWallet: false,
    hasCooldown: false,
    hasBlacklist: false,
    isPausable: false,
    hasBurn: false,
    hasReflection: false,
    hasWhitelist: false,
  });

  const totalFee = useMemo(() => {
    let fee = parseFloat(FEATURE_FEES.BASE_FEE);
    if (features.hasTaxSystem) fee += parseFloat(FEATURE_FEES.TAX_SYSTEM_FEE);
    if (features.hasAntiBot) fee += parseFloat(FEATURE_FEES.ANTI_BOT_FEE);
    if (features.hasMaxTxLimit) fee += parseFloat(FEATURE_FEES.MAX_TX_LIMIT_FEE);
    if (features.hasMaxWallet) fee += parseFloat(FEATURE_FEES.MAX_WALLET_FEE);
    if (features.hasCooldown) fee += parseFloat(FEATURE_FEES.COOLDOWN_FEE);
    if (features.hasBlacklist) fee += parseFloat(FEATURE_FEES.BLACKLIST_FEE);
    if (features.isPausable) fee += parseFloat(FEATURE_FEES.PAUSABLE_FEE);
    if (features.hasBurn) fee += parseFloat(FEATURE_FEES.BURN_FEE);
    if (features.hasReflection) fee += parseFloat(FEATURE_FEES.REFLECTION_FEE);
    if (features.hasWhitelist) fee += parseFloat(FEATURE_FEES.WHITELIST_FEE);
    return fee.toFixed(4);
  }, [features]);

  const canProceed = useMemo(() => {
    if (currentStep === 1) {
      return config.name && config.symbol && config.totalSupply;
    }
    if (currentStep === 2) {
      if (features.hasTaxSystem && !config.taxRecipient) return false;
      return true;
    }
    return true;
  }, [currentStep, config, features]);

  const handleDeploy = async () => {
    if (!web3State.signer) {
      toast.error('Please connect your wallet from the menu');
      return;
    }

    setIsDeploying(true);
    const toastId = toast.loading('Preparing deployment...');

    try {
      if (web3State.chainId !== BASE_CHAIN_ID) {
        toast.loading('Switching to Base...', { id: toastId });

        try {
          await switchToChain(BASE_CHAIN_ID);
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (switchError: any) {
          console.error('Chain switch error:', switchError);
          toast.error('Failed to switch network. Please switch to Base manually.', { id: toastId });
          return;
        }
      }

      const updatedProvider = getProvider();
      if (!updatedProvider) {
        throw new Error("Wallet provider not found after chain switch.");
      }
      const updatedSigner = updatedProvider.getSigner();

      toast.loading('Preparing your token deployment...', { id: toastId });

      const factory = new ethers.Contract(
        GANNETX_TOKEN_FACTORY_ADDRESS,
        FactoryABI,
        updatedSigner
      );

      const tokenConfig = {
        name: config.name,
        symbol: config.symbol,
        decimals: config.decimals,
        totalSupply: ethers.utils.parseEther(config.totalSupply),
        taxRecipient: config.taxRecipient || web3State.address,
        buyTax: config.buyTax * 100,
        sellTax: config.sellTax * 100,
        maxTxAmount: config.maxTxAmount ? ethers.utils.parseEther(config.maxTxAmount) : 0,
        maxWalletAmount: config.maxWalletAmount ? ethers.utils.parseEther(config.maxWalletAmount) : 0,
        cooldownTime: config.cooldownTime,
        burnPercentage: config.burnPercentage * 100,
        reflectionPercentage: config.reflectionPercentage * 100,
      };

      toast.loading('Waiting for your confirmation...', { id: toastId });

      const tx = await factory.deployToken(tokenConfig, features, {
        value: ethers.utils.parseEther(totalFee),
      });

      toast.loading('Transaction sent! Deploying your token...', { id: toastId });
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log).name === 'TokenDeployed';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('TokenDeployed event not found in transaction logs');
      }

      const parsedEvent = factory.interface.parseLog(event);
      const tokenAddress = parsedEvent.args[0];

      setDeployedToken(tokenAddress);

      const tokenMetadata: TokenMetadata = {
        address: tokenAddress,
        name: config.name,
        symbol: config.symbol,
        decimals: config.decimals,
        totalSupply: config.totalSupply,
        deployer: web3State.address || '',
        deployedAt: Date.now(),
        chainId: BASE_CHAIN_ID,
        txHash: receipt.transactionHash,
        verified: true,
        badge: 'standard',
        features: Object.entries(features)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => key.replace(/has|is/g, '').replace(/([A-Z])/g, ' $1').trim()),
      };

      saveTokenMetadata(tokenMetadata);

      toast.success('Token deployed successfully!', { id: toastId });
      setCurrentStep(5);
    } catch (error: any) {
      console.error('Deploy error:', error);

      let friendlyMessage = 'Failed to deploy token';

      if (error.code === 'ACTION_REJECTED') {
        friendlyMessage = 'Transaction cancelled in wallet';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        friendlyMessage = 'Insufficient funds for deployment fee';
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      toast.error(friendlyMessage, { id: toastId });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white pt-8">
      {/* Main Content Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Progress Steps */}
          {currentStep < 5 && (
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {STEPS.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentStep >= step.id
                          ? 'bg-cyan-500/10 border-2 border-cyan-500/50 text-cyan-400'
                          : 'bg-[#0B0E14]/60 backdrop-blur-xl text-white/30 border border-white/10'
                          }`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className={`mt-2 text-xs font-medium ${currentStep >= step.id ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {step.name}
                      </span>
                    </motion.div>
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 bg-white/10 relative overflow-hidden">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-cyan-500"
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl"
            >
              {currentStep === 1 && <Step1BasicInfo config={config} setConfig={setConfig} />}
              {currentStep === 2 && <Step2Features features={features} setFeatures={setFeatures} config={config} setConfig={setConfig} />}
              {currentStep === 3 && <Step3Advanced config={config} setConfig={setConfig} features={features} />}
              {currentStep === 4 && <Step4Review config={config} features={features} totalFee={totalFee} />}
              {currentStep === 5 && <Step5Success tokenAddress={deployedToken} config={config} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="mt-6 flex gap-4">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0B0E14]/60 backdrop-blur-xl text-white rounded-lg hover:bg-[#1A1D24] transition-all border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                  className="flex-1 flex items-center justify-center text-cyan-400 gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg font-semibold hover:bg-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !web3State.isConnected}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deploying...
                    </>
                  ) : !web3State.isConnected ? (
                    'Connect Wallet to Deploy'
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Deploy Token
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <FeeCalculator features={features} totalFee={totalFee} config={config} />
        </div>
      </div>
    </div>
  );
};

// ==================== STEP 1: BASIC INFO ====================
const Step1BasicInfo: React.FC<{
  config: TokenConfig;
  setConfig: React.Dispatch<React.SetStateAction<TokenConfig>>
}> = ({ config, setConfig }) => {
  const [errors, setErrors] = useState({
    name: '',
    symbol: '',
    totalSupply: ''
  });

  const validateName = (value: string) => {
    if (!value) return 'Token name is required';
    if (value.length < 3) return 'Name must be at least 3 characters';
    if (value.length > 50) return 'Name must be less than 50 characters';
    return '';
  };

  const validateSymbol = (value: string) => {
    if (!value) return 'Symbol is required';
    if (value.length < 2) return 'Symbol must be at least 2 characters';
    if (value.length > 10) return 'Symbol must be less than 10 characters';
    if (!/^[A-Z0-9]+$/.test(value)) return 'Symbol must contain only letters and numbers';
    return '';
  };

  const validateSupply = (value: string) => {
    if (!value) return 'Total supply is required';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num <= 0) return 'Supply must be greater than 0';
    if (num > 1000000000000) return 'Supply exceeds maximum (1 Trillion)';
    return '';
  };

  const handleNameChange = (value: string) => {
    setConfig({ ...config, name: value });
    setErrors({ ...errors, name: validateName(value) });
  };

  const handleSymbolChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setConfig({ ...config, symbol: upperValue });
    setErrors({ ...errors, symbol: validateSymbol(upperValue) });
  };

  const handleSupplyChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;

    setConfig({ ...config, totalSupply: formatted });
    setErrors({ ...errors, totalSupply: validateSupply(formatted) });
  };

  const formatSupplyDisplay = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Token Basics</h2>
        <p className="text-gray-400 text-sm">Let's start with the fundamental details of your token</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Token Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={config.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., My Awesome Token"
              maxLength={50}
              className={`w-full px-4 py-3 bg-[#0B0E14] border rounded-lg focus:ring-1 outline-none transition-all text-white placeholder-gray-500 ${errors.name
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-white/10 focus:border-[var(--cyber-cyan)] focus:ring-[var(--cyber-cyan)]'
                }`}
            />
            {config.name && (
              <div className="absolute right-3 top-3 text-xs text-gray-500">
                {config.name.length}/50
              </div>
            )}
          </div>
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-400 rounded-full" />
              {errors.name}
            </p>
          )}
          {!errors.name && config.name && (
            <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Looks good!
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Symbol <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={config.symbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              placeholder="e.g., MAT"
              maxLength={10}
              className={`w-full px-4 py-3 bg-[#0B0E14] border rounded-lg focus:ring-1 outline-none transition-all text-white placeholder-gray-500 font-mono uppercase ${errors.symbol
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-white/10 focus:border-[var(--cyber-cyan)] focus:ring-[var(--cyber-cyan)]'
                }`}
            />
            {config.symbol && (
              <div className="absolute right-3 top-3 text-xs text-gray-500">
                {config.symbol.length}/10
              </div>
            )}
          </div>
          {errors.symbol && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-400 rounded-full" />
              {errors.symbol}
            </p>
          )}
          {!errors.symbol && config.symbol && (
            <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Looks good!
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Total Supply <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={config.totalSupply}
              onChange={(e) => handleSupplyChange(e.target.value)}
              placeholder="1000000"
              className={`w-full px-4 py-3 bg-[#0B0E14] border rounded-lg focus:ring-1 outline-none transition-all text-white placeholder-gray-500 font-mono ${errors.totalSupply
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-white/10 focus:border-[var(--cyber-cyan)] focus:ring-[var(--cyber-cyan)]'
                }`}
            />
            {config.totalSupply && !isNaN(parseFloat(config.totalSupply)) && (
              <div className="absolute right-3 top-3.5 text-xs text-cyan-400 font-mono">
                {formatSupplyDisplay(config.totalSupply)}
              </div>
            )}
          </div>
          {errors.totalSupply && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-400 rounded-full" />
              {errors.totalSupply}
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">Maximum: 1,000,000,000,000 (1 Trillion)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Decimals</label>
          <select
            value={config.decimals}
            onChange={(e) => setConfig({ ...config, decimals: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white cursor-pointer"
          >
            {[6, 8, 9, 12, 18].map((d) => (
              <option key={d} value={d} className="bg-[#0B0E14]">
                {d} {d === 18 ? '(Standard)' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-gray-500">
            Standard is 18 (like ETH and most tokens)
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '1M', value: '1000000' },
            { label: '10M', value: '10000000' },
            { label: '100M', value: '100000000' },
            { label: '1B', value: '1000000000' },
            { label: '10B', value: '10000000000' },
            { label: '100B', value: '100000000000' },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleSupplyChange(preset.value)}
              className="px-3 py-1.5 text-xs bg-[#0B0E14] border border-white/10 rounded-lg text-gray-300 hover:border-[var(--cyber-cyan)] hover:text-cyan-400 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-[var(--cyber-cyan)]/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-200 font-medium">Pro Tips</p>
            <ul className="text-xs text-blue-300/80 mt-2 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>18 decimals is the standard for most ERC-20 tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Total supply will be minted to your wallet address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>You cannot change these values after deployment</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== STEP 2: FEATURES ====================
const Step2Features: React.FC<{
  features: Features;
  setFeatures: React.Dispatch<React.SetStateAction<Features>>;
  config: TokenConfig;
  setConfig: React.Dispatch<React.SetStateAction<TokenConfig>>;
}> = ({ features, setFeatures, config, setConfig }) => {
  const [taxRecipientError, setTaxRecipientError] = useState('');

  const featuresList = [
    { key: 'hasTaxSystem', name: 'Tax System', desc: 'Charge fees on buys/sells', icon: '💰', fee: FEATURE_FEES.TAX_SYSTEM_FEE },
    { key: 'hasAntiBot', name: 'Anti-Bot', desc: 'Prevent bot sniping', icon: '🤖', fee: FEATURE_FEES.ANTI_BOT_FEE },
    { key: 'hasMaxTxLimit', name: 'Max Transaction', desc: 'Limit per transaction', icon: '📊', fee: FEATURE_FEES.MAX_TX_LIMIT_FEE },
    { key: 'hasMaxWallet', name: 'Max Wallet', desc: 'Limit per wallet', icon: '👛', fee: FEATURE_FEES.MAX_WALLET_FEE },
    { key: 'hasCooldown', name: 'Cooldown', desc: 'Time between trades', icon: '⏱️', fee: FEATURE_FEES.COOLDOWN_FEE },
    { key: 'hasBlacklist', name: 'Blacklist', desc: 'Block addresses', icon: '🚫', fee: FEATURE_FEES.BLACKLIST_FEE },
    { key: 'isPausable', name: 'Pausable', desc: 'Pause trading', icon: '⏸️', fee: FEATURE_FEES.PAUSABLE_FEE },
    { key: 'hasBurn', name: 'Burn', desc: 'Auto-burn tokens', icon: '🔥', fee: FEATURE_FEES.BURN_FEE },
    { key: 'hasReflection', name: 'Reflection', desc: 'Reward holders', icon: '💎', fee: FEATURE_FEES.REFLECTION_FEE },
    { key: 'hasWhitelist', name: 'Whitelist', desc: 'Early buyer list', icon: '✅', fee: FEATURE_FEES.WHITELIST_FEE },
  ];

  const validateTaxRecipient = (value: string) => {
    if (!value) return 'Tax recipient address is required';
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return 'Invalid Ethereum address';
    return '';
  };

  const handleTaxRecipientChange = (value: string) => {
    setConfig({ ...config, taxRecipient: value });
    if (features.hasTaxSystem) {
      setTaxRecipientError(validateTaxRecipient(value));
    }
  };

  const toggleFeature = (key: string) => {
    const newFeatures = { ...features, [key]: !features[key as keyof Features] };
    setFeatures(newFeatures);

    if (key === 'hasTaxSystem' && features.hasTaxSystem) {
      setTaxRecipientError('');
    }
    if (key === 'hasTaxSystem' && !features.hasTaxSystem) {
      setTaxRecipientError(validateTaxRecipient(config.taxRecipient));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Token Features</h2>
        <p className="text-gray-400 text-sm">Select advanced features for your token</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {featuresList.map((feature) => (
          <button
            key={feature.key}
            onClick={() => toggleFeature(feature.key)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${features[feature.key as keyof Features]
              ? 'border-[var(--cyber-cyan)] bg-cyan-500/10 border border-cyan-500/30/10 shadow-[0_0_15px_var(--glow-color)]'
              : 'border-white/10 bg-[#0B0E14] hover:border-gray-600'
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{feature.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{feature.desc}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-[#0B0E14] rounded text-xs text-cyan-400 font-mono">
                    +{feature.fee} ETH
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${features[feature.key as keyof Features]
                  ? 'border-[var(--cyber-cyan)] bg-cyan-500/10 border border-cyan-500/30'
                  : 'border-gray-600'
                  }`}
              >
                {features[feature.key as keyof Features] && <CheckCircle2 className="w-4 h-4 text-[var(--navy-depth)]" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {features.hasTaxSystem && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-[#0B0E14] border border-[var(--cyber-cyan)]/30 rounded-lg space-y-4"
        >
          <h3 className="font-semibold text-cyan-400 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Tax Configuration
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tax Recipient Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.taxRecipient}
              onChange={(e) => handleTaxRecipientChange(e.target.value)}
              placeholder="0x..."
              className={`w-full px-4 py-3 bg-[#0B0E14]/60 backdrop-blur-xl border rounded-lg focus:ring-1 outline-none transition-all text-white placeholder-gray-500 font-mono text-sm ${taxRecipientError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-white/10 focus:border-[var(--cyber-cyan)] focus:ring-[var(--cyber-cyan)]'
                }`}
            />
            {taxRecipientError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {taxRecipientError}
              </p>
            )}
            {!taxRecipientError && config.taxRecipient && /^0x[a-fA-F0-9]{40}$/.test(config.taxRecipient) && (
              <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Valid address
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Buy Tax (%)</label>
              <input
                type="number"
                value={config.buyTax}
                onChange={(e) => setConfig({ ...config, buyTax: Math.min(25, Math.max(0, Number(e.target.value))) })}
                min={0}
                max={25}
                step={0.1}
                className="w-full px-4 py-3 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sell Tax (%)</label>
              <input
                type="number"
                value={config.sellTax}
                onChange={(e) => setConfig({ ...config, sellTax: Math.min(25, Math.max(0, Number(e.target.value))) })}
                min={0}
                max={25}
                step={0.1}
                className="w-full px-4 py-3 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">Maximum 25% per transaction</p>
        </motion.div>
      )}
    </div>
  );
};

// ==================== STEP 3: ADVANCED ====================
const Step3Advanced: React.FC<{
  config: TokenConfig;
  setConfig: React.Dispatch<React.SetStateAction<TokenConfig>>;
  features: Features;
}> = ({ config, setConfig, features }) => {
  const hasAnyAdvancedFeature = features.hasMaxTxLimit || features.hasMaxWallet ||
    features.hasCooldown || features.hasBurn || features.hasReflection;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Advanced Settings</h2>
        <p className="text-gray-400 text-sm">Fine-tune your token parameters</p>
      </div>

      {!hasAnyAdvancedFeature && (
        <div className="text-center py-16">
          <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium">No advanced features selected</p>
          <p className="text-sm text-gray-500 mt-2">Go back to Step 2 to enable advanced features</p>
        </div>
      )}

      {features.hasMaxTxLimit && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Transaction Amount
          </label>
          <input
            type="text"
            value={config.maxTxAmount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              setConfig({ ...config, maxTxAmount: val });
            }}
            placeholder="e.g., 10000"
            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white placeholder-gray-500 font-mono"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Maximum tokens that can be transferred in a single transaction
          </p>
        </div>
      )}

      {features.hasMaxWallet && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Wallet Amount
          </label>
          <input
            type="text"
            value={config.maxWalletAmount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              setConfig({ ...config, maxWalletAmount: val });
            }}
            placeholder="e.g., 20000"
            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white placeholder-gray-500 font-mono"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Maximum tokens a single wallet can hold
          </p>
        </div>
      )}

      {features.hasCooldown && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cooldown Time (seconds)
          </label>
          <input
            type="number"
            value={config.cooldownTime}
            onChange={(e) => setConfig({ ...config, cooldownTime: Math.min(300, Math.max(0, Number(e.target.value))) })}
            min={0}
            max={300}
            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Time users must wait between transactions (max 5 minutes)
          </p>
        </div>
      )}

      {features.hasBurn && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Burn Percentage (%)
          </label>
          <input
            type="number"
            value={config.burnPercentage}
            onChange={(e) => setConfig({ ...config, burnPercentage: Math.min(10, Math.max(0, Number(e.target.value))) })}
            min={0}
            max={10}
            step={0.1}
            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Percentage of tokens burned per transaction (max 10%)
          </p>
        </div>
      )}

      {features.hasReflection && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Reflection Percentage (%)
          </label>
          <input
            type="number"
            value={config.reflectionPercentage}
            onChange={(e) => setConfig({ ...config, reflectionPercentage: Math.min(10, Math.max(0, Number(e.target.value))) })}
            min={0}
            max={10}
            step={0.1}
            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-[var(--cyber-cyan)] focus:ring-1 focus:ring-[var(--cyber-cyan)] outline-none transition-all text-white"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Percentage distributed to holders per transaction (max 10%)
          </p>
        </div>
      )}

      {hasAnyAdvancedFeature && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200 font-medium">Important</p>
              <p className="text-xs text-yellow-300/80 mt-1">
                These settings will take effect immediately after deployment. Make sure values are within your token's total supply limits.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Continuation - Paste setelah Step3Advanced

// ==================== STEP 4: REVIEW ====================
const Step4Review: React.FC<{
  config: TokenConfig;
  features: Features;
  totalFee: string;
}> = ({ config, features, totalFee }) => {
  const enabledFeatures = Object.entries(features)
    .filter(([_, v]) => v)
    .map(([k]) => k.replace(/([A-Z])/g, ' $1').trim());

  const featureCosts = Object.entries(features)
    .filter(([_, v]) => v)
    .map(([k]) => {
      const feeKeyMap: Record<string, keyof typeof FEATURE_FEES> = {
        'hasTaxSystem': 'TAX_SYSTEM_FEE',
        'hasAntiBot': 'ANTI_BOT_FEE',
        'hasMaxTxLimit': 'MAX_TX_LIMIT_FEE',
        'hasMaxWallet': 'MAX_WALLET_FEE',
        'hasCooldown': 'COOLDOWN_FEE',
        'hasBlacklist': 'BLACKLIST_FEE',
        'isPausable': 'PAUSABLE_FEE',
        'hasBurn': 'BURN_FEE',
        'hasReflection': 'REFLECTION_FEE',
        'hasWhitelist': 'WHITELIST_FEE',
      };

      const feeKey = feeKeyMap[k as keyof typeof feeKeyMap];
      return {
        name: k.replace(/has|is/g, '').replace(/([A-Z])/g, ' $1').trim(),
        cost: FEATURE_FEES[feeKey] || '0'
      };
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Review & Deploy</h2>
        <p className="text-gray-400 text-sm">Double-check everything before deployment</p>
      </div>

      {/* Token Preview Card */}
      <div className="relative overflow-hidden rounded-xl bg-[#0B0E14]/60 border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0B0E14]/60 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-3xl font-bold text-white mb-1">{config.name}</h3>
              <p className="text-cyan-400 font-mono text-xl">${config.symbol}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-white/10 rounded-lg text-center">
                <span className="text-xs text-cyan-400 font-semibold">ERC-20</span>
              </div>
              <div className="px-3 py-1.5 bg-purple-500/10 border border-white/10 rounded-lg text-center">
                <span className="text-xs text-purple-300 font-semibold">Base</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#0B0E14]/50 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <p className="text-xs text-gray-400">Total Supply</p>
              </div>
              <p className="text-xl font-bold text-white">
                {Number(config.totalSupply).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{config.decimals} decimals</p>
            </div>

            <div className="p-4 bg-[#0B0E14]/50 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <p className="text-xs text-gray-400">Features</p>
              </div>
              <p className="text-xl font-bold text-white">
                {enabledFeatures.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active features</p>
            </div>
          </div>

          {features.hasTaxSystem && (
            <div className="mt-4 p-4 bg-[#0B0E14]/50 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <p className="text-xs text-gray-400">Tax Configuration</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-500">Buy Tax</p>
                  <p className="text-lg font-bold text-green-400">{config.buyTax}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sell Tax</p>
                  <p className="text-lg font-bold text-red-400">{config.sellTax}%</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10/50">
                <p className="text-xs text-gray-500">Recipient</p>
                <p className="text-xs font-mono text-cyan-400 mt-1 break-all">
                  {config.taxRecipient}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enabled Features */}
      {enabledFeatures.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Enabled Features
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {enabledFeatures.map((f) => (
              <div
                key={f}
                className="px-3 py-2 bg-cyan-500/10 border border-white/10 rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-xs text-cyan-400 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings Summary */}
      {(features.hasMaxTxLimit || features.hasMaxWallet || features.hasCooldown ||
        features.hasBurn || features.hasReflection) && (
          <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-lg">
            <h3 className="text-sm font-semibold text-white mb-3">Advanced Settings</h3>
            <div className="space-y-2 text-sm">
              {features.hasMaxTxLimit && config.maxTxAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Transaction</span>
                  <span className="text-white font-mono">{Number(config.maxTxAmount).toLocaleString()} tokens</span>
                </div>
              )}
              {features.hasMaxWallet && config.maxWalletAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Wallet</span>
                  <span className="text-white font-mono">{Number(config.maxWalletAmount).toLocaleString()} tokens</span>
                </div>
              )}
              {features.hasCooldown && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Cooldown</span>
                  <span className="text-white font-mono">{config.cooldownTime}s</span>
                </div>
              )}
              {features.hasBurn && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Burn Rate</span>
                  <span className="text-white font-mono">{config.burnPercentage}%</span>
                </div>
              )}
              {features.hasReflection && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Reflection</span>
                  <span className="text-white font-mono">{config.reflectionPercentage}%</span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Cost Breakdown */}
      <div className="p-5 bg-[#0B0E14] border border-white/10 rounded-lg">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          💰 Cost Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm pb-2 border-b border-white/10">
            <span className="text-gray-400">Base Deployment Fee</span>
            <span className="text-white font-mono">{FEATURE_FEES.BASE_FEE} ETH</span>
          </div>

          {featureCosts.map((f, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-400">{f.name}</span>
              <span className="text-gray-300 font-mono">+{f.cost} ETH</span>
            </div>
          ))}

          <div className="pt-3 mt-3 border-t-2 border-[var(--cyber-cyan)]/30 flex justify-between items-center">
            <span className="font-bold text-white text-base">Total Cost</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-cyan-400 font-mono">{totalFee}</p>
              <p className="text-xs text-gray-400">ETH</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Box */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-200 font-medium">Important Notice</p>
            <ul className="text-xs text-yellow-300/80 mt-2 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>Once deployed, basic settings (name, symbol, supply) cannot be changed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>You can update feature settings later via the management dashboard (fees apply)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>Additional gas fees will apply for the transaction (~$2-5)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-200 font-medium">After Deployment</p>
            <ul className="text-xs text-blue-300/80 mt-2 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Your tokens will be minted to your wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>You can add liquidity on DEXs like Uniswap or PancakeSwap</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Manage your token settings in the dashboard</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== STEP 5: SUCCESS ====================
const Step5Success: React.FC<{ tokenAddress: string | null; config: TokenConfig }> = ({ tokenAddress, config }) => {
  const [copied, setCopied] = useState(false);

  if (!tokenAddress) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No token address available</p>
      </div>
    );
  }

  const tokenMetadata = getTokenMetadata(tokenAddress);

  const copyAddress = () => {
    navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#0B0E14]/60 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.4)]">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Token Deployed Successfully!
        </h2>
        <div className="flex items-center justify-center gap-3 mb-4">
          <p className="text-xl text-gray-300">{config.name} (${config.symbol})</p>
          {tokenMetadata && <TokenBadge badge={tokenMetadata.badge} size="md" />}
        </div>
        <p className="text-gray-400 max-w-md mx-auto">
          Your token has been successfully deployed to Base and is ready to use.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0B0E14]/60 rounded-xl border border-white/10 p-6 mb-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Token Contract Address
          </h3>
        </div>

        <div className="bg-[#0B0E14]/60 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-mono text-cyan-400 break-all flex-1">
              {tokenAddress}
            </p>
            <button
              onClick={copyAddress}
              className="p-2 hover:bg-[#0B0E14]/60 backdrop-blur-xl rounded-lg transition-all flex-shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto"
      >
        <a
          href={`https://basescan.org/address/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#0B0E14]/60 backdrop-blur-xl border-2 border-[var(--cyber-cyan)]/30 text-white rounded-xl hover:bg-[var(--navy-lighter)] hover:border-[var(--cyber-cyan)] transition-all font-medium"
        >
          <ExternalLink className="w-5 h-5" />
          View on BaseScan
        </a>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-[0_0_30px_var(--glow-color)] transition-all"
        >
          Deploy Another Token
        </button>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
      >
        <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-lg">
          <p className="text-2xl font-bold text-cyan-400">✓</p>
          <p className="text-xs text-gray-400 mt-2">Verified</p>
        </div>
        <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-lg">
          <p className="text-2xl font-bold text-cyan-400">ERC-20</p>
          <p className="text-xs text-gray-400 mt-2">Standard</p>
        </div>
        <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-lg">
          <p className="text-2xl font-bold text-cyan-400">Base</p>
          <p className="text-xs text-gray-400 mt-2">Network</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-[var(--navy-light)] to-[var(--navy-depth)] border border-white/5 rounded-xl text-left"
      >
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          What's Next?
        </h3>
        <div className="space-y-3">
          {[
            { icon: '💧', text: 'Add liquidity on a DEX (Uniswap, PancakeSwap)', color: 'blue' },
            { icon: '⚙️', text: 'Configure DEX pair for tax collection', color: 'purple' },
            { icon: '📊', text: 'Manage token settings in dashboard', color: 'cyan' },
            { icon: '✅', text: 'Verify contract on BaseScan (optional)', color: 'green' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 + idx * 0.1 }}
              className="flex items-start gap-3 p-3 bg-[#0B0E14]/50 rounded-lg border border-white/10/50 hover:border-cyan-500/20 transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-300">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="max-w-2xl mx-auto"
      >
        <p className="text-sm text-gray-500">
          Need help? Check out our{' '}
          <a href="#" className="text-cyan-400 hover:underline">documentation</a>
          {' '}or join our{' '}
          <a href="#" className="text-cyan-400 hover:underline">Discord community</a>
        </p>
      </motion.div>
    </motion.div>
  );
};

// ==================== FEE CALCULATOR SIDEBAR ====================
const FeeCalculator: React.FC<{
  features: Features;
  totalFee: string;
  config: TokenConfig;
}> = ({ features, totalFee, config }) => {
  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <div className="sticky top-24 space-y-4">
      {/* Live Preview Card */}
      <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Live Preview
        </h3>

        <div className="space-y-4">
          {/* Token Info */}
          <div className="p-4 bg-[#0B0E14]/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Token</p>
            <p className="text-lg font-bold text-white truncate">{config.name || '---'}</p>
            <p className="text-sm text-cyan-400 font-mono">${config.symbol || '---'}</p>
          </div>

          {/* Supply */}
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-[#0B0E14]/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Supply</p>
              <p className="text-sm font-semibold text-white">
                {config.totalSupply ? Number(config.totalSupply).toLocaleString() : '---'}
              </p>
            </div>
            <div className="flex-1 p-3 bg-[#0B0E14]/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Decimals</p>
              <p className="text-sm font-semibold text-white">{config.decimals}</p>
            </div>
          </div>

          {/* Features Count */}
          <div className="p-3 bg-[#0B0E14]/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Enabled Features</p>
            <p className="text-2xl font-bold text-cyan-400">{enabledCount}</p>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Deployment Cost</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Base Fee</span>
            <span className="font-mono text-white">{FEATURE_FEES.BASE_FEE} ETH</span>
          </div>

          {enabledCount > 0 && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Features ({enabledCount})</span>
                <span className="font-mono text-white">
                  +{(parseFloat(totalFee) - parseFloat(FEATURE_FEES.BASE_FEE)).toFixed(4)} ETH
                </span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--cyber-cyan)]/30 to-transparent" />
            </>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-white">Total</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-cyan-400 font-mono">{totalFee}</p>
              <p className="text-xs text-gray-400">ETH</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            💡 Additional gas fees will apply for the transaction
          </p>
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-xl border border-white/10 p-4">
        <h4 className="text-sm font-semibold text-white mb-2">Need Help?</h4>
        <p className="text-xs text-gray-400 mb-3">
          Check our documentation for guides on token deployment and management.
        </p>
        <a
          href="#"
          className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
        >
          View Documentation
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default TokenFactory;












