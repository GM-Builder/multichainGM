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
    <div className="min-h-screen bg-[#050608] text-white pt-40">
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">
                Token Hub <span className="text-md font-normal text-gray-300">| Base Mainnet</span>
              </h1>
              <p className="text-sm text-gray-400">Deploy and manage your ERC20 tokens</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className=""
          >
            <div className="flex bg-[#0B0E14]/60 px-2 py-1.5 rounded-full backdrop-blur-xl border border-white/5">
              <button
                onClick={() => setActiveTab('factory')}
                className={`px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${activeTab === 'factory'
                  ? 'bg-[#1A1D24] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  <span>Token Factory</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('management')}
                className={`px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${activeTab === 'management'
                  ? 'bg-[#1A1D24] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
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