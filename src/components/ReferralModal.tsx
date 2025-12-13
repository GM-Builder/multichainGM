import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaCopy,
  FaUsers,
  FaExternalLinkAlt,
  FaCheck,
  FaRedo
} from 'react-icons/fa';
import { useReferrerInfo } from '@/hooks/useReferral';
import { ethers } from 'ethers';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | null;
  provider?: ethers.providers.Web3Provider | null;
  signer?: ethers.Signer | null;
}

const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  address,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const { data: myReferrals, loading: loadingReferrals, refetch } = useReferrerInfo(address);

  const referralLink = address
    ? `${window.location.origin}?ref=${address}`
    : '';

  const handleCopyLink = useCallback(() => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [referralLink]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 border-b border-white/5 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      Referral Dashboard
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Share your link and track your referrals
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">

                  {/* Share Link Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white/5 rounded-xl border border-white/5"
                  >
                    <div className="text-lg font-semibold text-white mb-4">
                      Your Referral Link
                    </div>

                    {/* Link Input + Copy */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg text-sm font-mono text-gray-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${copySuccess
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
                          }`}
                      >
                        {copySuccess ? (
                          <>
                            <FaCheck />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <FaCopy />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* Referrals List */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="text-lg font-semibold text-white">
                        Your Referrals ({myReferrals?.totalReferrals || 0})
                      </div>
                      <button
                        onClick={refetch}
                        disabled={loadingReferrals}
                        className="px-3 py-1.5 text-xs font-bold text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <FaRedo className={loadingReferrals ? 'animate-spin' : ''} />
                        REFRESH
                      </button>
                    </div>

                    {loadingReferrals ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-white/10 rounded w-3/4"></div>
                              <div className="h-3 bg-white/10 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : myReferrals?.referrals && myReferrals.referrals.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {myReferrals.referrals.map((referral, index) => (
                          <div
                            key={referral.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                                #{index + 1}
                              </div>
                              <div>
                                <code className="text-sm font-mono text-gray-200 block mb-1">
                                  {referral.referred.substring(0, 8)}...{referral.referred.substring(38)}
                                </code>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  {new Date(referral.timestamp * 1000).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`https://basescan.org/tx/${referral.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="View on Basescan"
                            >
                              <FaExternalLinkAlt className="text-xs" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                          <FaUsers className="text-2xl text-gray-600" />
                        </div>
                        <p className="text-gray-400 text-base font-medium mb-1">
                          No referrals yet
                        </p>
                        <p className="text-gray-600 text-xs">
                          Share your link to start growing your network
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReferralModal;