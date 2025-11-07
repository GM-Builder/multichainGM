import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Upload
} from 'lucide-react';
import TokenABI from '@/abis/GannetXToken.json';

interface WhitelistManagerProps {
  tokenAddress: string;
  tokenName: string;
  signer: ethers.Signer | null;
  onUpdate?: () => void;
}

interface WhitelistEntry {
  address: string;
  addedAt: number;
  label?: string;
}

const WhitelistManager: React.FC<WhitelistManagerProps> = ({
  tokenAddress,
  tokenName,
  signer,
  onUpdate
}) => {
  const [whitelistAddresses, setWhitelistAddresses] = useState<WhitelistEntry[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    loadWhitelistFromStorage();
  }, [tokenAddress]);

  const loadWhitelistFromStorage = () => {
    try {
      const stored = localStorage.getItem(`whitelist_${tokenAddress}`);
      if (stored) {
        setWhitelistAddresses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load whitelist:', error);
    }
  };

  const saveWhitelistToStorage = (list: WhitelistEntry[]) => {
    try {
      localStorage.setItem(`whitelist_${tokenAddress}`, JSON.stringify(list));
    } catch (error) {
      console.error('Failed to save whitelist:', error);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!ethers.utils.isAddress(newAddress)) {
      toast.error('Invalid address');
      return;
    }

    const toastId = toast.loading('Adding to whitelist...');
    setLoading(true);

    try {
      const contract = new ethers.Contract(tokenAddress, TokenABI as any, signer);
      const tx = await contract.addToWhitelist(newAddress);
      
      toast.loading('Waiting for confirmation...', { id: toastId });
      await tx.wait();

      const newEntry: WhitelistEntry = {
        address: newAddress,
        addedAt: Date.now(),
        label: newLabel || undefined,
      };

      const updatedList = [...whitelistAddresses, newEntry];
      setWhitelistAddresses(updatedList);
      saveWhitelistToStorage(updatedList);

      toast.success('Address added to whitelist!', { id: toastId });
      setNewAddress('');
      setNewLabel('');
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Failed to add to whitelist:', error);
      toast.error(error.message || 'Failed to add address', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    const addresses = bulkAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    const invalidAddresses = addresses.filter(addr => !ethers.utils.isAddress(addr));
    
    if (invalidAddresses.length > 0) {
      toast.error(`Invalid addresses found: ${invalidAddresses.length}`);
      return;
    }

    if (addresses.length === 0) {
      toast.error('No addresses to add');
      return;
    }

    const toastId = toast.loading(`Adding ${addresses.length} addresses...`);
    setLoading(true);

    try {
      const contract = new ethers.Contract(tokenAddress, TokenABI as any, signer);
      const tx = await contract.addMultipleToWhitelist(addresses);
      
      toast.loading('Waiting for confirmation...', { id: toastId });
      await tx.wait();

      const newEntries: WhitelistEntry[] = addresses.map(addr => ({
        address: addr,
        addedAt: Date.now(),
      }));

      const updatedList = [...whitelistAddresses, ...newEntries];
      setWhitelistAddresses(updatedList);
      saveWhitelistToStorage(updatedList);

      toast.success(`${addresses.length} addresses added!`, { id: toastId });
      setBulkAddresses('');
      setShowBulkAdd(false);
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Failed to bulk add:', error);
      toast.error(error.message || 'Failed to add addresses', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWhitelist = async (address: string) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    const toastId = toast.loading('Removing from whitelist...');
    setLoading(true);

    try {
      const contract = new ethers.Contract(tokenAddress, TokenABI as any, signer);
      const tx = await contract.removeFromWhitelist(address);
      
      toast.loading('Waiting for confirmation...', { id: toastId });
      await tx.wait();

      const updatedList = whitelistAddresses.filter(entry => entry.address !== address);
      setWhitelistAddresses(updatedList);
      saveWhitelistToStorage(updatedList);

      toast.success('Address removed from whitelist!', { id: toastId });
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Failed to remove from whitelist:', error);
      toast.error(error.message || 'Failed to remove address', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success('Address copied!');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--cyber-cyan)]" />
          <h4 className="text-lg font-semibold text-white">Whitelist Management</h4>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkAdd(!showBulkAdd)}
            className="px-3 py-1.5 bg-[var(--navy-depth)] border border-[var(--cyber-cyan)]/30 rounded-lg hover:bg-[var(--navy-lighter)] hover:border-[var(--cyber-cyan)] transition-all text-sm font-medium flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk Add
          </button>
        </div>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300 font-medium mb-1">About Whitelist</p>
            <p className="text-xs text-blue-300/80">
              Whitelisted addresses are exempt from taxes, transaction limits, and cooldowns. 
              Common uses: team wallets, DEX pairs, staking contracts.
            </p>
          </div>
        </div>
      </div>

      {showBulkAdd && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 bg-[var(--navy-depth)] border border-[var(--cyber-cyan)]/20 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-white">Bulk Add Addresses</h5>
            <button
              onClick={() => setShowBulkAdd(false)}
              className="p-1 hover:bg-[var(--navy-light)] rounded transition-all"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <textarea
            value={bulkAddresses}
            onChange={(e) => setBulkAddresses(e.target.value)}
            placeholder="Enter addresses (one per line)&#10;0x1234...&#10;0x5678...&#10;0xabcd..."
            rows={6}
            className="w-full px-3 py-2 bg-[var(--navy-light)] border border-gray-700 rounded-lg focus:border-[var(--cyber-cyan)] outline-none text-white font-mono text-sm mb-3"
          />
          <button
            onClick={handleBulkAdd}
            disabled={loading || !bulkAddresses.trim()}
            className="w-full px-4 py-2 bg-gradient-to-r from-[var(--cyber-cyan)] to-blue-500 text-white rounded-lg font-medium hover:shadow-[0_0_20px_var(--glow-color)] transition-all disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add All Addresses'}
          </button>
        </motion.div>
      )}

      <div className="p-4 bg-[var(--navy-depth)] border border-[var(--cyber-cyan)]/20 rounded-lg">
        <h5 className="text-sm font-semibold text-white mb-3">Add Single Address</h5>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Wallet Address</label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-[var(--navy-light)] border border-gray-700 rounded-lg focus:border-[var(--cyber-cyan)] outline-none text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Label (Optional)</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., Team Wallet, DEX Pair"
              className="w-full px-3 py-2 bg-[var(--navy-light)] border border-gray-700 rounded-lg focus:border-[var(--cyber-cyan)] outline-none text-white text-sm"
            />
          </div>
          <button
            onClick={handleAddToWhitelist}
            disabled={loading || !newAddress}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add to Whitelist'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold text-white">
            Whitelisted Addresses ({whitelistAddresses.length})
          </h5>
        </div>

        {whitelistAddresses.length === 0 ? (
          <div className="p-6 bg-[var(--navy-depth)] border border-gray-700 rounded-lg text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p className="text-sm text-gray-400">No addresses whitelisted yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {whitelistAddresses.map((entry, idx) => (
                <motion.div
                  key={entry.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-[var(--navy-depth)] border border-[var(--cyber-cyan)]/20 rounded-lg hover:border-[var(--cyber-cyan)]/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {entry.label && (
                        <p className="text-xs text-[var(--cyber-cyan)] font-medium mb-1">
                          {entry.label}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-gray-300 truncate">
                          {entry.address}
                        </p>
                        <button
                          onClick={() => copyAddress(entry.address)}
                          className="p-1 hover:bg-[var(--navy-light)] rounded transition-all"
                        >
                          {copiedAddress === entry.address ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Added {new Date(entry.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromWhitelist(entry.address)}
                      disabled={loading}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50 group"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhitelistManager;