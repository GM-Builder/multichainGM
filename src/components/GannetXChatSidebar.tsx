import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaComments,
  FaPaperPlane,
  FaClock,
  FaTimes,
  FaWallet,
  FaCheckCircle,
  FaSpinner
} from 'react-icons/fa';
import { useWalletState } from '@/hooks/useWalletState';
import GannetXABI from '@/abis/GannetXInteractiveChat.json';
import { ethers } from 'ethers';
import { BASE_CHAIN_ID, GANNETX_CHAT_CONTRACT_ADDRESS, BASE_RPC } from '@/utils/constants';
import toast from 'react-hot-toast';

const CONTRACT_ADDRESS = GANNETX_CHAT_CONTRACT_ADDRESS;
const CHECKIN_FEE = ethers.utils.parseEther('0.000001');

interface GMMessage {
  user: string;
  timestamp: number;
  message: string;
}

const shortAddr = (a?: string) => (a ? `${a.substring(0, 6)}...${a.substring(a.length - 4)}` : '');

interface GannetXChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean; // New prop for embedded mode
}

const GannetXChatModal: React.FC<GannetXChatModalProps> = ({ isOpen, onClose, isEmbedded = false }) => {
  const { web3State, connectWallet, switchNetwork } = useWalletState();
  const [recentGMs, setRecentGMs] = useState<GMMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const providerForReads = useCallback((): ethers.providers.Provider => {
    try {
      if (web3State.provider && web3State.chainId === BASE_CHAIN_ID) {
        return web3State.provider;
      }
    } catch (e) {
      console.error('Provider error:', e);
    }

    const rpc = BASE_RPC;
    return new ethers.providers.JsonRpcProvider(rpc, {
      name: 'base',
      chainId: BASE_CHAIN_ID
    });
  }, [web3State.provider, web3State.chainId]);

  const scrollToBottom = useCallback((smooth = false) => {
    try {
      const el = listRef.current;
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    } catch (e) {
      console.error('Scroll error:', e);
    }
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      setIsLoadingMessages(true);
      const provider = providerForReads();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, GannetXABI as any, provider);
      const raw: any[] = await contract.getRecentGMsPaginated(0, 80);
      const parsed = raw.map((r: any) => ({
        user: r.user,
        timestamp: Number(r.timestamp),
        message: r.message,
      }));
      const sorted = parsed.sort((a, b) => a.timestamp - b.timestamp);
      setRecentGMs(sorted);
      setTimeout(() => scrollToBottom(false), 100);
    } catch (e) {
      console.error('Failed to load recent GMs', e);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [providerForReads, scrollToBottom]);

  const refreshCooldown = useCallback(async () => {
    try {
      if (!web3State.address) {
        setTimeLeft(0);
        return;
      }

      const provider = providerForReads();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, GannetXABI as any, provider);
      const t: ethers.BigNumber = await contract.timeUntilNextCheckin(web3State.address);
      setTimeLeft(t.toNumber());
    } catch (e) {
      console.error('Failed to get cooldown', e);
    }
  }, [web3State.address, providerForReads]);

  useEffect(() => {
    if (isOpen) {
      loadRecent();
      refreshCooldown();
      const iv = setInterval(() => {
        refreshCooldown();
      }, 5000);

      return () => clearInterval(iv);
    }
  }, [isOpen, loadRecent, refreshCooldown]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (busy || !input.trim()) return;

    if (!web3State.isConnected || !web3State.address) {
      const ok = await connectWallet();
      if (!ok) return;
    }

    if (web3State.chainId !== BASE_CHAIN_ID) {
      const switched = await switchNetwork(BASE_CHAIN_ID);
      if (!switched) {
        toast.error('Please switch to Base to send message');
        return;
      }
    }

    try {
      setBusy(true);
      const signer = web3State.signer;
      if (!signer) throw new Error('No signer available');

      const contractRead = new ethers.Contract(CONTRACT_ADDRESS, GannetXABI as any, signer.provider);
      const ttl: ethers.BigNumber = await contractRead.timeUntilNextCheckin(web3State.address);
      if (ttl.toNumber() > 0) {
        toast.error(`Please wait ${ttl.toNumber()}s before sending another message`);
        setTimeLeft(ttl.toNumber());
        setBusy(false);
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, GannetXABI as any, signer);
      const tx = await contract.checkIn(input.trim(), { value: CHECKIN_FEE });
      toast.loading('Sending message...', { id: 'gm' });
      await tx.wait();
      toast.success('Message sent successfully!', { id: 'gm' });
      setInput('');
      await loadRecent();
      await refreshCooldown();
      scrollToBottom(true);
    } catch (e: any) {
      console.error('Send failed', e);
      const msg = e?.data?.message || e?.message || 'Transaction failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const colorForAddress = useCallback((addr: string) => {
    if (colorMap[addr]) return colorMap[addr];
    let h = 0;
    for (let i = 2; i < addr.length; i++) {
      h = (h * 31 + addr.charCodeAt(i)) % 360;
    }
    const color = `hsl(${h}deg 65% 50%)`;
    setColorMap(prev => ({ ...prev, [addr]: color }));
    return color;
  }, [colorMap]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getExactTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getFullDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const dateStr = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = getExactTime(timestamp);
    return `${dateStr} at ${timeStr}`;
  };

  const formatCooldown = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const isOwnMessage = (address: string) => {
    return web3State.address?.toLowerCase() === address.toLowerCase();
  };

  if (!isOpen) return null;

  const content = (
    <motion.div
      initial={isEmbedded ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
      animate={isEmbedded ? { opacity: 1 } : { scale: 1, opacity: 1 }}
      exit={isEmbedded ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={isEmbedded
        ? "flex flex-col h-full bg-transparent"
        : "relative bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-[#0B0E14]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/20">
              <FaComments className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg text-white">
                GannetX Chat
              </div>
              <p className="text-xs text-gray-400">
                Community on Base • {recentGMs.length} messages
              </p>
            </div>
          </div>

          {!isEmbedded && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 text-gray-400 hover:text-red-300 transition-all duration-200"
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>

        {/* Wallet Status */}
        <div className="mt-3">
          {web3State.isConnected && web3State.address ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg shadow-sm">
              <FaCheckCircle className="text-cyan-400 text-sm" />
              <span className="text-xs font-mono text-gray-300">
                {shortAddr(web3State.address)}
              </span>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/30 text-cyan-400 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <FaWallet className="text-sm" />
              Connect Wallet to Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain'
        }}
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FaSpinner className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : recentGMs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaComments className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-white mb-1">
                No messages yet
              </p>
              <p className="text-xs text-gray-400">
                Be the first to say hello!
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {recentGMs.map((m, i) => {
              const isOwn = isOwnMessage(m.user);
              return (
                <motion.div
                  key={`${m.user}-${m.timestamp}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Address */}
                  <div className={`mb-1.5 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    <span className="text-[11px] font-mono text-gray-400">
                      {isOwn ? 'You' : shortAddr(m.user)}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    style={{
                      background: isOwn
                        ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                        : colorForAddress(m.user)
                    }}
                    className={`rounded-2xl px-4 py-2.5 shadow-md max-w-[75%] ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
                      } group relative`}
                    title={getFullDateTime(m.timestamp)}
                  >
                    <p className="text-sm text-white leading-relaxed break-words">
                      {m.message || 'GM'}
                    </p>
                    <div className={`flex items-center gap-2 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-center gap-1">
                        <FaClock className="w-2.5 h-2.5 text-white/70" />
                        <span className="text-[10px] text-white/70">
                          {getExactTime(m.timestamp)}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/60">
                        • {formatTime(m.timestamp)}
                      </span>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {getFullDateTime(m.timestamp)}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-[#0B0E14]/40">
        {/* Cooldown Status */}
        {timeLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <FaClock className="text-sm animate-pulse" />
              <span className="text-xs font-medium">
                Cooldown: {formatCooldown(timeLeft)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Input Form */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              maxLength={120}
              disabled={busy || timeLeft > 0}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
            <span className="absolute right-3 bottom-3 text-[10px] text-gray-500 font-mono">
              {input.length}/120
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={busy || timeLeft > 0 || !input.trim()}
            className="flex items-center justify-center w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-400 rounded-xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {busy ? (
              <FaSpinner className="w-5 h-5 animate-spin" />
            ) : (
              <FaPaperPlane className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {/* Helper Text */}
        <p className="mt-2 text-[10px] text-gray-400 text-center">
          Fee: {ethers.utils.formatEther(CHECKIN_FEE)} ETH • Press Enter to send
        </p>
      </div>
    </motion.div>
  );

  if (isEmbedded) {
    return <div className="h-full w-full">{content}</div>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
};

export default GannetXChatModal;