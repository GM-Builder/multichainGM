import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaExclamationCircle, FaGift, FaSpinner } from 'react-icons/fa';
import { ethers } from 'ethers';
import { registerReferralAndWait, formatAddress } from '@/utils/web3';
import { BASE_CHAIN_ID } from '@/utils/constants';

interface ReferralRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  referrerAddress: string;
  userAddress: string | null;
  signer: ethers.Signer | null;
  provider: ethers.providers.Web3Provider | null;
  onSuccess?: () => void;
}

const ReferralRegisterModal: React.FC<ReferralRegisterModalProps> = ({
  isOpen,
  onClose,
  referrerAddress,
  userAddress,
  signer,
  provider,
  onSuccess,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegistering(false);
      setError(null);
      setStatus('');
    }
  }, [isOpen]);

  const handleRegister = async () => {
    // Validate wallet connection first
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!provider) {
      setError('Wallet provider not found');
      return;
    }

    if (referrerAddress.toLowerCase() === userAddress.toLowerCase()) {
      setError('You cannot refer yourself');
      return;
    }

    setIsRegistering(true);
    setError(null);
    setStatus('Preparing...');

    try {
      // Get current network
      const network = await provider.getNetwork();
      const currentChainId = network.chainId;

      // If not on Base, switch first
      if (currentChainId !== BASE_CHAIN_ID) {
        setStatus('Switching to Base network...');

        try {
          await provider.send('wallet_switchEthereumChain', [
            { chainId: `0x${BASE_CHAIN_ID.toString(16)}` }
          ]);

          // Wait for switch to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            setError('Base network not found in your wallet. Please add it manually.');
          } else if (switchError.code === 4001) {
            setError('Network switch was rejected. Please switch to Base to continue.');
          } else {
            setError('Failed to switch network. Please try again.');
          }
          setIsRegistering(false);
          return;
        }
      }

      // Get fresh provider and signer after network switch
      setStatus('Getting wallet connection...');
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('Ethereum provider not found');
      }

      const updatedProvider = new ethers.providers.Web3Provider(ethereum);
      const updatedSigner = updatedProvider.getSigner();

      // Verify we're on the correct network
      const finalNetwork = await updatedProvider.getNetwork();
      if (finalNetwork.chainId !== BASE_CHAIN_ID) {
        throw new Error('Please switch to Base network and try again');
      }

      // Now register referral on Base
      setStatus('Waiting for your confirmation...');

      await registerReferralAndWait(
        updatedSigner,
        referrerAddress,
        (progressStatus) => {
          setStatus(progressStatus);
        }
      );

      setStatus('Successfully registered!');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Registration error:', err);

      if (err.message.includes('Already referred') || err.message.includes('already has a referrer')) {
        setError('You already have a referrer');
      } else if (err.message.includes('Cannot refer yourself')) {
        setError('You cannot refer yourself');
      } else if (err.message.includes('cancelled') || err.message.includes('rejected')) {
        setError('Transaction was cancelled');
      } else if (err.message.includes('insufficient funds')) {
        setError('Insufficient funds for gas fees');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDecline = () => {
    // Only allow closing if not registering
    if (!isRegistering) {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, document.title, url.pathname + url.search);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Cannot close while registering */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm z-[100]"
            onClick={!isRegistering ? handleDecline : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-6 text-center border-b border-white/5">
                {!isRegistering && (
                  <button
                    onClick={handleDecline}
                    className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <FaTimes />
                  </button>
                )}

                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <FaGift className="text-xl text-cyan-400" />
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                  Referral Invite
                </h2>
                <p className="text-gray-400 text-sm">
                  You've been invited to join the ecosystem
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">

                {/* Referrer Info */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1 font-medium">Invited by</p>
                      <code className="text-sm font-mono text-cyan-400">
                        {formatAddress(referrerAddress)}
                      </code>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">
                    Unlock Benefits
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      'Access to multichain ecosystem',
                      'Exclusive rewards and benefits',
                      'Build your own referral network',
                      'Early access to new features'
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                          <FaCheck className="text-cyan-400 text-[8px]" />
                        </div>
                        <span className="text-sm text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                  <p className="text-xs text-blue-400 leading-relaxed">
                    <span className="font-bold mr-1">Note:</span>
                    You will be switched to the Base network to complete your registration.
                  </p>
                </div>

                {/* Status/Error Messages */}
                <AnimatePresence>
                  {(status || error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3 rounded-lg border ${error
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-cyan-500/10 border-cyan-500/20'
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        {error ? (
                          <FaExclamationCircle className="text-red-400 mt-0.5 flex-shrink-0 text-sm" />
                        ) : (
                          <div className="mt-0.5">
                            <FaSpinner className="animate-spin text-cyan-400 text-sm" />
                          </div>
                        )}
                        <p className={`text-xs ${error ? 'text-red-400' : 'text-cyan-400'}`}>
                          {error || status}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDecline}
                    disabled={isRegistering}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? 'Wait...' : 'Decline'}
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering || !userAddress}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]"
                  >
                    {isRegistering ? 'Processing...' : 'Accept Invite'}
                  </button>
                </div>

                {/* Helper Text */}
                {!userAddress && (
                  <p className="text-[10px] text-center text-gray-500">
                    Connect wallet to continue
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReferralRegisterModal;