// src/pages/deploy.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Settings } from 'lucide-react';
import TokenFactory from '@/components/TokenFactory';
import ManagementDashboard from '@/components/ManagementDashboard';

type TabType = 'factory' | 'management';

const DeployPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('factory');

  return (
    <div className="min-h-screen bg-[var(--navy-deeper)] text-white pt-20">
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--cyber-cyan)] to-blue-500 flex items-center justify-center shadow-[0_0_20px_var(--glow-color)]">
              <Rocket className="w-6 h-6 text-[var(--navy-depth)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--cyber-cyan)] to-blue-400 bg-clip-text text-transparent">
                Token Hub
              </h1>
              <p className="text-sm text-gray-400">Deploy and manage your ERC20 tokens</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="flex bg-[var(--navy-light)] px-2 py-1 rounded-full backdrop-blur-sm shadow-lg border border-[var(--cyber-cyan)]/20">
              <button
                onClick={() => setActiveTab('factory')}
                className={`px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                  activeTab === 'factory'
                    ? 'bg-gradient-to-r from-[var(--cyber-cyan)] to-blue-500 text-white shadow-[0_0_20px_var(--glow-color)] transform scale-105'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--navy-lighter)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  <span>Token Factory</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('management')}
                className={`px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                  activeTab === 'management'
                    ? 'bg-gradient-to-r from-[var(--cyber-cyan)] to-blue-500 text-white shadow-[0_0_20px_var(--glow-color)] transform scale-105'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--navy-lighter)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Management</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'factory' && <TokenFactory />}
          {activeTab === 'management' && <ManagementDashboard />}
        </motion.div>
      </div>
    </div>
  );
};

export default DeployPage;