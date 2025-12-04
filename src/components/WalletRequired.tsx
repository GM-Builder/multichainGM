import React, { useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { motion } from 'framer-motion';
import CustomConnectModal from './CustomConnectModal';

interface WalletRequiredProps {
  children: React.ReactNode;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  isConnecting: boolean;
}

const WalletRequired: React.FC<WalletRequiredProps> = ({
  children,
  isConnected,
  connectWallet,
  isConnecting
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center">
      {!isModalOpen && (
        <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg max-w-md mx-auto p-10 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-pulse"></div>

            <div className="relative h-full w-full flex items-center justify-center">
              <motion.img
                src="/icon.png"
                alt="GannetX Icon"
                initial={{ rotate: -50, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">Welcome to
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 text-transparent bg-clip-text"> GannetX</span>
          </h2>

          <p className="text-gray-400">
            Start your day with a friendly GM on the blockchain. Connect your wallet to check-in daily and join the community.
          </p>

          <div className="flex justify-center">
            <motion.button
              whileHover={{
                scale: 1.02,
                borderColor: "#22d3ee"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="w-auto px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/30 text-cyan-400 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
            >
              <FaWallet className="inline-block mr-2" /> Connect Wallet
            </motion.button>
          </div>

          <div className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full"></div>
            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full"></div>
            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full"></div>
          </div>
        </div>
      )}

      <CustomConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        connectWallet={connectWallet}
      />

      <div className="absolute -z-10 left-1/4 top-1/4 w-64 h-64 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -z-10 right-1/4 bottom-1/4 w-64 h-64 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -z-10 left-1/3 bottom-1/3 w-64 h-64 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );
};

export default WalletRequired;