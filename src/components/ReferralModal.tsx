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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Referral Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Share your link and track your referrals
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FaTimes className="text-gray-500 dark:text-gray-400 text-xl" />
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
                    className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Your Referral Link
                    </h3>
                    
                    {/* Link Input + Copy */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          copySuccess 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                        }`}
                      >
                        {copySuccess ? (
                          <>
                            <FaCheck />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <FaCopy />
                            <span>Copy</span>
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
                    className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Your Referrals ({myReferrals?.totalReferrals || 0})
                      </h3>
                      <button
                        onClick={refetch}
                        disabled={loadingReferrals}
                        className="px-4 py-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <FaRedo className={loadingReferrals ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                    </div>

                    {loadingReferrals ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : myReferrals?.referrals && myReferrals.referrals.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {myReferrals.referrals.map((referral, index) => (
                          <div
                            key={referral.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                #{index + 1}
                              </div>
                              <div>
                                <code className="text-sm font-mono text-gray-900 dark:text-white block mb-1">
                                  {referral.referred.substring(0, 10)}...{referral.referred.substring(38)}
                                </code>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                              className="p-3 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                              title="View on Basescan"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <FaUsers className="text-4xl text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                          No referrals yet
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
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