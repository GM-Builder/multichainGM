import React, { useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { motion } from 'framer-motion';
import CustomConnectModal from './CustomConnectModal';

interface ConnectWalletButtonProps {
  connectWallet: () => Promise<void>;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  connectWallet
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/30 text-cyan-400 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
      >
        <FaWallet /> Connect Wallet
      </motion.button>

      <CustomConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        connectWallet={connectWallet}
      />
    </>
  );
};

export default ConnectWalletButton;