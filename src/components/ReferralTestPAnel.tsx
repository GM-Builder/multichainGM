// ============================================
// src/components/ReferralTestPanel.tsx
// Testing component untuk verify integration
// ============================================

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useWalletState } from '@/hooks/useWalletState';
import {
  getReferralContract,
  getReferrer,
  getReferralCount,
  hasReferrer,
  extractReferralCode,
  validateReferralCode,
  isOnReferralChain,
} from '@/utils/web3';
import { 
  useReferrerInfo, 
  useUserReferrer,
  useReferralStats 
} from '@/hooks/useReferral';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const ReferralTestPanel: React.FC = () => {
  const { web3State } = useWalletState();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  // Hooks test
  const { data: myReferrals, loading: loadingReferrals } = useReferrerInfo(web3State.address);
  const { data: invitedBy, loading: loadingInviter } = useUserReferrer(web3State.address);
  const { data: stats } = useReferralStats();

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setTests(prev => {
      const existing = prev.findIndex(t => t.name === name);
      const newTest = { name, status, message, details };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newTest;
        return updated;
      }
      return [...prev, newTest];
    });
  };

  const runTests = async () => {
    setTesting(true);
    setTests([]);

    // Test 1: Check wallet connection
    updateTest('Wallet Connection', 'pending', 'Checking...');
    if (!web3State.isConnected || !web3State.address) {
      updateTest('Wallet Connection', 'error', 'Wallet not connected');
      setTesting(false);
      return;
    }
    updateTest('Wallet Connection', 'success', `Connected: ${web3State.address.substring(0, 10)}...`);

    // Test 2: Check network
    updateTest('Network Check', 'pending', 'Checking...');
    try {
      const onReferralChain = await isOnReferralChain();
      if (!onReferralChain) {
        updateTest('Network Check', 'warning', 'Not on Base network. Referral only works on Base.', {
          currentChain: web3State.chainId,
          requiredChain: 8453
        });
      } else {
        updateTest('Network Check', 'success', 'On Base network ✓');
      }
    } catch (error) {
      updateTest('Network Check', 'error', 'Failed to check network', error);
    }

    // Test 3: Contract address validation
    updateTest('Contract Config', 'pending', 'Checking...');
    try {
      const { getReferralContractAddress } = await import('@/utils/constants');
      const contractAddress = getReferralContractAddress();
      
      if (!contractAddress || contractAddress.includes('YourContract')) {
        updateTest('Contract Config', 'error', 'Contract address not configured', {
          address: contractAddress,
          fix: 'Update NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS in .env.local'
        });
      } else if (!ethers.utils.isAddress(contractAddress)) {
        updateTest('Contract Config', 'error', 'Invalid contract address format', {
          address: contractAddress
        });
      } else {
        updateTest('Contract Config', 'success', `Contract: ${contractAddress.substring(0, 10)}...`);
      }
    } catch (error) {
      updateTest('Contract Config', 'error', 'Failed to load contract config', error);
    }

    // Test 4: Contract instance creation
    updateTest('Contract Instance', 'pending', 'Creating...');
    try {
      if (web3State.provider) {
        const contract = getReferralContract(web3State.provider);
        updateTest('Contract Instance', 'success', 'Contract instance created ✓');
        
        // Test 4.5: Try reading from contract
        updateTest('Contract Read Test', 'pending', 'Reading contract...');
        try {
          const referrer = await contract.getReferrer(web3State.address);
          updateTest('Contract Read Test', 'success', 'Contract is readable ✓', {
            referrer: referrer === ethers.constants.AddressZero ? 'None' : referrer
          });
        } catch (readError: any) {
          updateTest('Contract Read Test', 'error', 'Cannot read from contract', {
            error: readError.message,
            fix: 'Check if contract is deployed and address is correct'
          });
        }
      }
    } catch (error: any) {
      updateTest('Contract Instance', 'error', 'Failed to create contract instance', {
        error: error.message
      });
    }

    // Test 5: Check referrer status (Smart Contract)
    updateTest('Smart Contract - Has Referrer', 'pending', 'Checking...');
    try {
      if (web3State.provider && web3State.address) {
        const userHasReferrer = await hasReferrer(web3State.provider, web3State.address);
        if (userHasReferrer) {
          const referrer = await getReferrer(web3State.provider, web3State.address);
          updateTest('Smart Contract - Has Referrer', 'success', `Referred by: ${referrer.substring(0, 10)}...`, {
            referrer
          });
        } else {
          updateTest('Smart Contract - Has Referrer', 'success', 'No referrer (available for registration)', {
            canRegister: true
          });
        }
      }
    } catch (error: any) {
      updateTest('Smart Contract - Has Referrer', 'error', 'Failed to check referrer status', {
        error: error.message
      });
    }

    // Test 6: Get referral count (Smart Contract)
    updateTest('Smart Contract - Referral Count', 'pending', 'Checking...');
    try {
      if (web3State.provider && web3State.address) {
        const count = await getReferralCount(web3State.provider, web3State.address);
        updateTest('Smart Contract - Referral Count', 'success', `You have ${count} referrals`, {
          count
        });
      }
    } catch (error: any) {
      updateTest('Smart Contract - Referral Count', 'error', 'Failed to get referral count', {
        error: error.message
      });
    }

    // Test 7: Subgraph connection
    updateTest('Subgraph Connection', 'pending', 'Checking...');
    try {
      const { REFERRAL_SUBGRAPH_ENDPOINT } = await import('@/utils/constants');
      
      if (!REFERRAL_SUBGRAPH_ENDPOINT || REFERRAL_SUBGRAPH_ENDPOINT.includes('XXXXX')) {
        updateTest('Subgraph Connection', 'error', 'Subgraph URL not configured', {
          url: REFERRAL_SUBGRAPH_ENDPOINT,
          fix: 'Update NEXT_PUBLIC_REFERRAL_SUBGRAPH_URL in .env.local'
        });
      } else {
        updateTest('Subgraph Connection', 'success', 'Subgraph URL configured ✓', {
          url: REFERRAL_SUBGRAPH_ENDPOINT
        });
      }
    } catch (error) {
      updateTest('Subgraph Connection', 'error', 'Failed to check subgraph config', error);
    }

    // Test 8: Subgraph data fetch
    updateTest('Subgraph Data - My Referrals', 'pending', 'Fetching...');
    if (loadingReferrals) {
      updateTest('Subgraph Data - My Referrals', 'pending', 'Loading...');
    } else if (myReferrals) {
      updateTest('Subgraph Data - My Referrals', 'success', `Fetched ${myReferrals.totalReferrals} referrals`, {
        data: myReferrals
      });
    } else {
      updateTest('Subgraph Data - My Referrals', 'warning', 'No referral data found (might be new user)', {
        note: 'This is normal for users who haven\'t made any referrals yet'
      });
    }

    // Test 9: Subgraph - Who invited me
    updateTest('Subgraph Data - Invited By', 'pending', 'Fetching...');
    if (loadingInviter) {
      updateTest('Subgraph Data - Invited By', 'pending', 'Loading...');
    } else if (invitedBy?.referredBy) {
      updateTest('Subgraph Data - Invited By', 'success', `Invited by: ${invitedBy.referredBy.id}`, {
        data: invitedBy
      });
    } else {
      updateTest('Subgraph Data - Invited By', 'success', 'No referrer (self-registered)', {
        note: 'User joined without a referral code'
      });
    }

    // Test 10: Global stats
    updateTest('Subgraph Data - Global Stats', 'pending', 'Fetching...');
    if (stats) {
      updateTest('Subgraph Data - Global Stats', 'success', `Platform: ${stats.totalReferrals} referrals`, {
        data: stats
      });
    } else {
      updateTest('Subgraph Data - Global Stats', 'warning', 'Global stats not available', {
        note: 'Subgraph might be syncing or not deployed'
      });
    }

    // Test 11: URL referral code check
    updateTest('URL Referral Code', 'pending', 'Checking...');
    const refCode = extractReferralCode();
    if (refCode) {
      const validation = validateReferralCode(refCode);
      if (validation.valid) {
        updateTest('URL Referral Code', 'success', `Valid referral code detected: ${refCode.substring(0, 10)}...`, {
          code: refCode,
          valid: true
        });
      } else {
        updateTest('URL Referral Code', 'error', `Invalid referral code: ${validation.error}`, {
          code: refCode,
          error: validation.error
        });
      }
    } else {
      updateTest('URL Referral Code', 'success', 'No referral code in URL (normal)', {
        note: 'To test, visit: ?ref=0xYourAddress'
      });
    }

    setTesting(false);
  };

  useEffect(() => {
    if (web3State.isConnected && web3State.address) {
      runTests();
    }
  }, [web3State.isConnected, web3State.address]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'error':
        return <FaTimesCircle className="text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'pending':
        return <FaSpinner className="text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'pending':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  if (!web3State.isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please connect your wallet to run tests
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Referral System Test Panel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verify frontend → backend integration
            </p>
          </div>
          <button
            onClick={runTests}
            disabled={testing}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {testing ? (
              <>
                <FaSpinner className="animate-spin" />
                Testing...
              </>
            ) : (
              'Run Tests'
            )}
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          {tests.length === 0 && !testing && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Click "Run Tests" to start testing
            </div>
          )}

          {tests.map((test, index) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {test.name}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {test.message}
                  </p>
                  
                  {test.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                        Show details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        {tests.length > 0 && !testing && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {tests.filter(t => t.status === 'success').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {tests.filter(t => t.status === 'error').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {tests.filter(t => t.status === 'warning').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Warnings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {tests.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="space-y-2 text-sm">
          <a 
            href="?ref=0x1234567890123456789012345678901234567890"
            className="block p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            📎 Test with dummy referral code
          </a>
          <a 
            href="/referral"
            className="block p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            🎯 Go to Referral Dashboard
          </a>
          <button
            onClick={() => {
              if (web3State.address) {
                const link = `${window.location.origin}?ref=${web3State.address}`;
                navigator.clipboard.writeText(link);
                alert('Your referral link copied!');
              }
            }}
            className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            📋 Copy my referral link
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralTestPanel;