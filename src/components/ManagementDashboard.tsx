import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  TrendingUp,
  Shield,
  Pause,
  Play,
  UserCog,
  Wallet,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DollarSign,
  BarChart3,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Zap,
  Activity,
  Info,
  RefreshCw,
  Droplet,
  Send,
  Twitter,
  Globe,
  MessageCircle,
  FileText,
  Link2,
  Clock,
  Star,
  TrendingDown,
  Plus
} from 'lucide-react';
import FactoryABI from '@/abis/GannetXTokenFactory.json';
import TokenABI from '@/abis/GannetXToken.json';
import { GANNETX_TOKEN_FACTORY_ADDRESS, BASE_RPC } from '@/utils/constants';
import { useWalletState } from '@/hooks/useWalletState';
import TokenBadge from '@/components/TokenBadge';
import { getTokenMetadata, updateTokenSocialLinks } from '@/utils/tokenStorage';
import { BadgeType } from '@/types/token';

type TokenInfo = {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  totalSupplyHuman?: string | null;
  features?: Record<string, boolean> | null;
  isFromFactory?: boolean;
  owner?: string;
  error?: string;
  badge?: BadgeType;
  deployedAt?: number;
};

const fetchUserTokens = async (address: string): Promise<TokenInfo[]> => {
  const res = await fetch(`/api/management/user-tokens?address=${address}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch');
  return json.data as TokenInfo[];
};

const ManagementDashboard: React.FC = () => {
  const { web3State, connectWallet, switchNetwork } = useWalletState();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});
  const [expandedTokens, setExpandedTokens] = useState<Record<string, boolean>>({});
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const provider = useMemo(() => new ethers.providers.JsonRpcProvider(BASE_RPC), []);
  const factoryRead = useMemo(() => new ethers.Contract(GANNETX_TOKEN_FACTORY_ADDRESS, FactoryABI as any, provider), [provider]);

  const load = useCallback(async () => {
    if (!web3State.address) return;
    setLoading(true);
    try {
      const data = await fetchUserTokens(web3State.address);
      const enrichedData = data.map(token => {
        const metadata = getTokenMetadata(token.address);
        return {
          ...token,
          badge: metadata?.badge || 'standard',
          deployedAt: metadata?.deployedAt,
        };
      });
      setTokens(enrichedData);
    } catch (e) {
      console.error('Failed to load user tokens', e);
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  }, [web3State.address]);

  useEffect(() => { load(); }, [load]);

  const ensureConnected = useCallback(async () => {
    if (!web3State.isConnected) {
      const ok = await connectWallet();
      if (!ok) return false;
    }
    return true;
  }, [web3State.isConnected, connectWallet]);

  const sendFeeThenCall = useCallback(async (feeKey: string, tokenAddress: string, callFn: (tokenContract: ethers.Contract) => Promise<any>) => {
    if (!web3State.signer) throw new Error('Signer required');

    setActionBusy(prev => ({ ...prev, [tokenAddress]: true }));
    try {
      let feeBN = ethers.constants.Zero;
      try {
        const v: ethers.BigNumber = await factoryRead[feeKey]();
        feeBN = v;
      } catch (e) {
        feeBN = ethers.constants.Zero;
      }

      if (feeBN.gt(0)) {
        const feeStr = ethers.utils.formatEther(feeBN);
        const feeTx = await web3State.signer.sendTransaction({
          to: GANNETX_TOKEN_FACTORY_ADDRESS,
          value: feeBN,
        });
        toast.loading(`Paying fee (${feeStr} ETH)...`);
        await feeTx.wait();
      }

      const tokenContract = new ethers.Contract(tokenAddress, TokenABI as any, web3State.signer);
      const result = await callFn(tokenContract);
      return result;
    } finally {
      setActionBusy(prev => ({ ...prev, [tokenAddress]: false }));
    }
  }, [web3State.signer, factoryRead]);

  const handleUpdateTaxes = useCallback(async (tokenAddress: string, buy: number, sell: number) => {
    if (!(await ensureConnected())) return;
    const toastId = toast.loading('Updating taxes...');
    try {
      const tx = await sendFeeThenCall('updateTaxFee', tokenAddress, async (contract) => {
        const buyBps = Math.round(buy * 100);
        const sellBps = Math.round(sell * 100);
        return await contract.updateTaxes(buyBps, sellBps);
      });
      await tx.wait();
      toast.success('Taxes updated!', { id: toastId });
      await load();
    } catch (e: any) {
      console.error('Tax update failed:', e);
      toast.error(e.message || 'Failed to update taxes', { id: toastId });
    }
  }, [ensureConnected, sendFeeThenCall, load]);

  const handleUpdateLimits = useCallback(async (tokenAddress: string, maxTx: string, maxWallet: string) => {
    if (!(await ensureConnected())) return;
    const toastId = toast.loading('Updating limits...');
    try {
      const tx = await sendFeeThenCall('updateLimitsFee', tokenAddress, async (contract) => {
        const maxTxBN = maxTx ? ethers.utils.parseEther(maxTx) : ethers.constants.Zero;
        const maxWalletBN = maxWallet ? ethers.utils.parseEther(maxWallet) : ethers.constants.Zero;
        return await contract.updateLimits(maxTxBN, maxWalletBN);
      });
      await tx.wait();
      toast.success('Limits updated!', { id: toastId });
      await load();
    } catch (e: any) {
      console.error('Limit update failed:', e);
      toast.error(e.message || 'Failed to update limits', { id: toastId });
    }
  }, [ensureConnected, sendFeeThenCall, load]);

  const handlePauseToggle = useCallback(async (tokenAddress: string, currentPaused: boolean) => {
    if (!(await ensureConnected())) return;
    const action = currentPaused ? 'Unpausing' : 'Pausing';
    const toastId = toast.loading(`${action} trading...`);
    try {
      const tx = await sendFeeThenCall('pauseFee', tokenAddress, async (contract) => {
        return currentPaused ? await contract.unpause() : await contract.pause();
      });
      await tx.wait();
      toast.success(`Trading ${currentPaused ? 'unpaused' : 'paused'}!`, { id: toastId });
      await load();
    } catch (e: any) {
      console.error('Pause toggle failed:', e);
      toast.error(e.message || `Failed to ${action.toLowerCase()}`, { id: toastId });
    }
  }, [ensureConnected, sendFeeThenCall, load]);

  const handleTransferOwnership = useCallback(async (tokenAddress: string, newOwner: string) => {
    if (!(await ensureConnected())) return;
    if (!ethers.utils.isAddress(newOwner)) {
      toast.error('Invalid address');
      return;
    }
    const toastId = toast.loading('Transferring ownership...');
    try {
      const tx = await sendFeeThenCall('transferOwnershipFee', tokenAddress, async (contract) => {
        return await contract.transferOwnership(newOwner);
      });
      await tx.wait();
      toast.success('Ownership transferred!', { id: toastId });
      await load();
    } catch (e: any) {
      console.error('Transfer ownership failed:', e);
      toast.error(e.message || 'Failed to transfer ownership', { id: toastId });
    }
  }, [ensureConnected, sendFeeThenCall, load]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied!');
  };

  const toggleExpand = (address: string) => {
    setExpandedTokens(prev => ({ ...prev, [address]: !prev[address] }));
  };

  const isBusy = (address: string) => !!actionBusy[address];
  const factoryTokens = tokens.filter(t => t.isFromFactory);

  if (!web3State.isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-6">Connect your wallet to manage your deployed tokens</p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-[0_0_30px_var(--glow-color)] transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="text-cyan-400" />
              <div className="font-bold text-white">Token Management</div>
            </div>
            <p className="text-gray-400">Manage and monitor your deployed tokens</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/10 rounded-lg hover:bg-[#1A1D24] hover:border-cyan-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Tokens</p>
                <p className="text-2xl font-bold text-white">{tokens.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {tokens.filter(t => t.badge && t.badge !== 'none').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Premium</p>
                <p className="text-2xl font-bold text-purple-400">
                  {tokens.filter(t => t.badge === 'premium').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-green-400">
                  {tokens.filter(t => {
                    if (!t.deployedAt) return false;
                    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                    return t.deployedAt > monthAgo;
                  }).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <AnimatePresence>
          {tokens.map((t, idx) => (
            <TokenCard
              key={t.address}
              token={t}
              index={idx}
              isExpanded={!!expandedTokens[t.address]}
              isSelected={selectedToken === t.address}
              onToggleExpand={() => toggleExpand(t.address)}
              onSelect={() => setSelectedToken(t.address)}
              onCopyAddress={() => handleCopyAddress(t.address)}
              onUpdateTaxes={(buy, sell) => handleUpdateTaxes(t.address, buy, sell)}
              onUpdateLimits={(max, wallet) => handleUpdateLimits(t.address, max, wallet)}
              onPauseToggle={() => handlePauseToggle(t.address, t.features?.isPausable || false)}
              onTransferOwnership={(newOwner) => handleTransferOwnership(t.address, newOwner)}
              busy={isBusy(t.address)}
            />
          ))}
        </AnimatePresence>

        {tokens.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#0B0E14]/60 backdrop-blur-xl flex items-center justify-center border border-white/10">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">No Tokens Deployed Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              You haven't deployed any tokens with GannetX yet. Head over to Token Factory to create your first token!
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="/deploy"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-[0_0_30px_var(--glow-color)] transition-all"
              >
                Deploy Your First Token
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const TokenCard: React.FC<{
  token: TokenInfo;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onCopyAddress: () => void;
  onUpdateTaxes: (buy: number, sell: number) => void;
  onUpdateLimits: (maxTx: string, maxWallet: string) => void;
  onPauseToggle: () => void;
  onTransferOwnership: (newOwner: string) => void;
  busy: boolean;
}> = ({ token, index, isExpanded, isSelected, onToggleExpand, onSelect, onCopyAddress, onUpdateTaxes, onUpdateLimits, onPauseToggle, onTransferOwnership, busy }) => {
  const [buyTax, setBuyTax] = useState('0');
  const [sellTax, setSellTax] = useState('0');
  const [maxTx, setMaxTx] = useState('');
  const [maxWallet, setMaxWallet] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);

  const features = token.features || {};
  const featureList = Object.entries(features)
    .filter(([_, v]) => v)
    .map(([k]) => k);

  const metadata = getTokenMetadata(token.address);

  const handleCopy = () => {
    onCopyAddress();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateHealthScore = (): number => {
    let score = 0;
    if (token.badge && token.badge !== 'none') score += 25;
    if (metadata?.socialLinks?.website) score += 15;
    if (metadata?.socialLinks?.twitter) score += 15;
    if (metadata?.socialLinks?.telegram) score += 15;
    if (metadata?.liquidityInfo?.added) score += 30;
    return score;
  };

  const healthScore = calculateHealthScore();

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Needs Attention';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden transition-all ${isSelected ? 'border-cyan-500/30 shadow-[0_0_20px_var(--glow-color)]' : 'border-white/5 hover:border-cyan-500/30/40'
        }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-white">{token.name || 'Unknown'}</h3>
              {token.badge && <TokenBadge badge={token.badge} size="sm" showLabel={false} />}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-mono text-cyan-400 truncate flex-1">
                {token.address}
              </p>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-[#0B0E14] rounded transition-all"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <a
                href={`https://basescan.org/address/${token.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-[#0B0E14] rounded transition-all"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
            {token.deployedAt && (
              <p className="text-xs text-gray-500">
                Deployed {new Date(token.deployedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-2 bg-[#0B0E14] hover:bg-[#1A1D24] rounded-lg transition-all"
              title="Quick Actions"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={onToggleExpand}
              disabled={busy}
              className="p-2 bg-[#0B0E14] border border-white/10 rounded-lg hover:bg-[#1A1D24] hover:border-cyan-500/30 transition-all disabled:opacity-50"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {token.badge && token.badge !== 'standard' && (
          <div className="mb-4 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-white/10 rounded-lg">
            <div className="flex items-center gap-2">
              <TokenBadge badge={token.badge} size="sm" />
              <p className="text-xs text-gray-400">
                {token.badge === 'premium' ? 'Premium verified token with enhanced features' : 'Verified by GannetX team'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Supply</p>
            <p className="text-sm font-semibold text-white truncate">
              {token.totalSupplyHuman || 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Symbol</p>
            <p className="text-sm font-semibold text-cyan-400">
              ${token.symbol || 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Features</p>
            <p className="text-sm font-semibold text-white">
              {featureList.length}
            </p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Health</p>
            <p className={`text-sm font-semibold ${getHealthColor(healthScore)}`}>
              {healthScore}%
            </p>
          </div>
        </div>

        {showQuickActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4"
          >
            <QuickActionsPanel token={token} onClose={() => setShowQuickActions(false)} />
          </motion.div>
        )}

        {featureList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {featureList.map((f) => (
              <span
                key={f}
                className="px-2 py-1 bg-[#0B0E14] border border-white/5 rounded text-xs text-cyan-400"
              >
                {f.replace('has', '').replace('is', '')}
              </span>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5"
          >
            <ManagementPanel
              token={token}
              features={features}
              buyTax={buyTax}
              sellTax={sellTax}
              setBuyTax={setBuyTax}
              setSellTax={setSellTax}
              maxTx={maxTx}
              setMaxTx={setMaxTx}
              maxWallet={maxWallet}
              setMaxWallet={setMaxWallet}
              newOwner={newOwner}
              setNewOwner={setNewOwner}
              onUpdateTaxes={onUpdateTaxes}
              onUpdateLimits={onUpdateLimits}
              onPauseToggle={onPauseToggle}
              onTransferOwnership={onTransferOwnership}
              busy={busy}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const QuickActionsPanel: React.FC<{ token: TokenInfo; onClose: () => void }> = ({ token, onClose }) => {
  const actions = [
    {
      icon: Droplet,
      label: 'Add Liquidity',
      description: 'Add liquidity on Uniswap',
      color: 'blue',
      onClick: () => window.open(`https://app.uniswap.org/#/add/v2/ETH/${token.address}`, '_blank'),
    },
    {
      icon: BarChart3,
      label: 'View Analytics',
      description: 'Track token performance',
      color: 'purple',
      onClick: () => window.open(`https://dexscreener.com/base/${token.address}`, '_blank'),
    },
    {
      icon: Send,
      label: 'Submit to CoinGecko',
      description: 'List on CoinGecko',
      color: 'green',
      onClick: () => window.open('https://www.coingecko.com/en/coins/new', '_blank'),
    },
    {
      icon: FileText,
      label: 'Update BaseScan',
      description: 'Update token info',
      color: 'cyan',
      onClick: () => window.open(`https://basescan.org/token/${token.address}#tokeninfo`, '_blank'),
    },
  ];

  return (
    <div className="p-4 bg-[#0B0E14]/50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">Quick Actions</h4>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="p-3 bg-[#0B0E14]/60 backdrop-blur-xl hover:bg-[#1A1D24] border border-white/5 hover:border-cyan-500/30/50 rounded-lg transition-all text-left"
          >
            <div className="flex items-start gap-2">
              <action.icon className={`w-4 h-4 text-${action.color}-400 flex-shrink-0 mt-0.5`} />
              <div>
                <p className="text-xs font-semibold text-white mb-0.5">{action.label}</p>
                <p className="text-[10px] text-gray-400">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const ManagementPanel: React.FC<{
  token: TokenInfo;
  features: Record<string, boolean>;
  buyTax: string;
  sellTax: string;
  setBuyTax: (v: string) => void;
  setSellTax: (v: string) => void;
  maxTx: string;
  setMaxTx: (v: string) => void;
  maxWallet: string;
  setMaxWallet: (v: string) => void;
  newOwner: string;
  setNewOwner: (v: string) => void;
  onUpdateTaxes: (buy: number, sell: number) => void;
  onUpdateLimits: (maxTx: string, maxWallet: string) => void;
  onPauseToggle: () => void;
  onTransferOwnership: (newOwner: string) => void;
  busy: boolean;
}> = ({ token, features, buyTax, sellTax, setBuyTax, setSellTax, maxTx, setMaxTx, maxWallet, setMaxWallet, newOwner, setNewOwner, onUpdateTaxes, onUpdateLimits, onPauseToggle, onTransferOwnership, busy }) => {

  const ManagementSection: React.FC<{ icon: any; title: string; color: string; children: React.ReactNode }> = ({ icon: Icon, title, color, children }) => (
    <div className="p-4 bg-[#0B0E14]/30 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 text-${color}-400`} />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      {features.hasTaxSystem && (
        <ManagementSection icon={DollarSign} title="Tax Management" color="yellow">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Buy Tax %</label>
              <input
                type="number"
                value={buyTax}
                onChange={(e) => setBuyTax(e.target.value)}
                min="0"
                max="25"
                step="0.1"
                className="w-full px-3 py-2 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-cyan-500/30 outline-none text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sell Tax %</label>
              <input
                type="number"
                value={sellTax}
                onChange={(e) => setSellTax(e.target.value)}
                min="0"
                max="25"
                step="0.1"
                className="w-full px-3 py-2 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-cyan-500/30 outline-none text-white"
              />
            </div>
          </div>
          <button
            onClick={() => onUpdateTaxes(parseFloat(buyTax), parseFloat(sellTax))}
            disabled={busy}
            className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all disabled:opacity-50"
          >
            {busy ? 'Processing...' : 'Update Taxes'}
          </button>
        </ManagementSection>
      )}

      {(features.hasMaxTxLimit || features.hasMaxWallet) && (
        <ManagementSection icon={BarChart3} title="Transaction Limits" color="blue">
          <div className="space-y-3 mb-3">
            {features.hasMaxTxLimit && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Transaction Amount</label>
                <input
                  type="text"
                  value={maxTx}
                  onChange={(e) => setMaxTx(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-cyan-500/30 outline-none text-white"
                />
              </div>
            )}
            {features.hasMaxWallet && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Wallet Amount</label>
                <input
                  type="text"
                  value={maxWallet}
                  onChange={(e) => setMaxWallet(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-cyan-500/30 outline-none text-white"
                />
              </div>
            )}
          </div>
          <button
            onClick={() => onUpdateLimits(maxTx, maxWallet)}
            disabled={busy}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50"
          >
            {busy ? 'Processing...' : 'Update Limits'}
          </button>
        </ManagementSection>
      )}

      {features.isPausable && (
        <ManagementSection icon={features.isPausable ? Pause : Play} title="Trading Control" color="purple">
          <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-lg mb-3">
            <span className="text-sm text-gray-400">Trading Status:</span>
            <span className={`text-sm font-semibold ${features.isPausable ? 'text-red-400' : 'text-green-400'}`}>
              {features.isPausable ? 'Paused' : 'Active'}
            </span>
          </div>
          <button
            onClick={onPauseToggle}
            disabled={busy}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${features.isPausable
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]'
              } text-white`}
          >
            {busy ? 'Processing...' : features.isPausable ? 'Resume Trading' : 'Pause Trading'}
          </button>
        </ManagementSection>
      )}

      <ManagementSection icon={UserCog} title="Ownership Transfer" color="orange">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">New Owner Address</label>
            <input
              type="text"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-cyan-500/30 outline-none text-white font-mono text-sm"
            />
          </div>
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">
                Warning: Transferring ownership is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={() => onTransferOwnership(newOwner)}
            disabled={busy || !newOwner}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all disabled:opacity-50"
          >
            {busy ? 'Processing...' : 'Transfer Ownership'}
          </button>
        </div>
      </ManagementSection>
    </div>
  );
};

export default ManagementDashboard;