import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaExclamationCircle } from 'react-icons/fa';
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={!isRegistering ? handleDecline : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-8 text-center">
                {!isRegistering && (
                  <button
                    onClick={handleDecline}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <FaTimes className="text-white" />
                  </button>
                )}
                
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  Join via Referral
                </h2>
                <p className="text-cyan-100 text-sm">
                  You've been invited to GannetX
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                
                {/* Referrer Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referred by</p>
                      <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {formatAddress(referrerAddress)}
                      </code>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    What you'll get:
                  </h3>
                  <div className="space-y-2">
                    {[
                      'Access to multichain ecosystem',
                      'Exclusive rewards and benefits',
                      'Build your own referral network',
                      'Early access to new features'
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <FaCheck className="text-green-600 dark:text-green-400 text-xs" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">Note:</span> You'll be switched to Base network to complete registration.
                  </p>
                </div>

                {/* Status/Error Messages */}
                <AnimatePresence>
                  {(status || error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-xl border ${
                        error
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {error ? (
                          <FaExclamationCircle className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <div className="mt-0.5">
                            <svg className="animate-spin h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                        <p className={`text-sm ${error ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                          {error || status}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDecline}
                    disabled={isRegistering}
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? 'Processing...' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering || !userAddress}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
                  >
                    {isRegistering ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Accept Invitation'
                    )}
                  </button>
                </div>

                {/* Helper Text */}
                {!userAddress && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Please connect your wallet to continue
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