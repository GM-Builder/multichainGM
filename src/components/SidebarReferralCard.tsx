import React from 'react';
import { motion } from 'framer-motion';
import { FaGift, FaCopy } from 'react-icons/fa';

interface SidebarReferralCardProps {
  canUseReferral: boolean;
  myReferralsCount: number;
  userReferredBy: string | null;
  onCopyLink: () => void;
  onCardClick: () => void;
  onSwitchToBase: () => void;
  formatAddress: (address: string) => string;
}

export const SidebarReferralCard: React.FC<SidebarReferralCardProps> = ({
  canUseReferral,
  myReferralsCount,
  userReferredBy,
  onCopyLink,
  onCardClick,
  onSwitchToBase,
  formatAddress,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="overflow-hidden rounded-2xl"
    >
      {canUseReferral ? (
        <>
          {/* Main Card - Clickable */}
          <div
            onClick={onCardClick}
            className="p-6 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 cursor-pointer hover:bg-[#0B0E14]/80 transition-all group rounded-t-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg group-hover:shadow-cyan-500/20 transition-shadow">
                  <FaGift className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Referral Program</h3>
                  {myReferralsCount > 0 && (
                    <p className="text-xs text-cyan-400 font-medium">
                      {myReferralsCount} {myReferralsCount === 1 ? 'Referral' : 'Referrals'}
                    </p>
                  )}
                </div>
              </div>

              {/* Click indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Referred By Info */}
            {userReferredBy && (
              <div className="mb-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-medium mb-1">
                  Referred by
                </p>
                <code className="text-xs font-mono text-gray-300">
                  {formatAddress(userReferredBy)}
                </code>
              </div>
            )}

            <p className="text-sm text-gray-400 mb-4">
              Invite friends and secure your exclusive spot for future rewards!
            </p>

            <p className="text-xs text-cyan-400 font-medium group-hover:text-cyan-300 transition-colors">
              Click to view dashboard →
            </p>
          </div>

          {/* Copy Link Button - Separate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyLink();
            }}
            className="w-full px-4 py-3 bg-[#0B0E14]/80 hover:bg-[#0B0E14] border-x border-b border-white/5 rounded-b-2xl font-medium text-white flex items-center justify-center gap-2 transition-all"
          >
            <FaCopy className="text-cyan-500" />
            Copy Referral Link
          </button>
        </>
      ) : (
        <div className="p-6 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <FaGift className="text-xl text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Referral System</h3>
              <p className="text-xs text-amber-400">Base Network Required</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Switch to Base network to access referral features
          </p>

          <button
            onClick={onSwitchToBase}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            Switch to Base
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default SidebarReferralCard;