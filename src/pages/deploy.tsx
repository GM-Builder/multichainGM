// src/pages/deploy.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Settings, ArrowLeft } from 'lucide-react';
import TokenFactory from '@/components/TokenFactory';
import ManagementDashboard from '@/components/ManagementDashboard';
import DeployMenu from '@/components/DeployMenu';
import SimpleDeploy from '@/components/SimpleDeploy';

type ViewState = 'menu' | 'simple' | 'create_token';
type TabType = 'deploy' | 'management';

const DeployPage: React.FC = () => {
  const [view, setView] = useState<ViewState>('menu');
  const [activeTab, setActiveTab] = useState<TabType>('deploy');

  const handleMenuSelect = (option: 'simple' | 'factory') => {
    if (option === 'simple') {
      setView('simple');
    } else {
      setView('create_token');
      setActiveTab('deploy');
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white pt-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <AnimatePresence mode="wait">
          {/* MENU VIEW */}
          {view === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DeployMenu onSelect={handleMenuSelect} />
            </motion.div>
          )}

          {/* SIMPLE DEPLOY VIEW */}
          {view === 'simple' && (
            <motion.div
              key="simple"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SimpleDeploy onBack={() => setView('menu')} />
            </motion.div>
          )}

          {/* CREATE TOKEN VIEW (Factory + Management) */}
          {view === 'create_token' && (
            <motion.div
              key="create_token"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <button
                  onClick={() => setView('menu')}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Menu
                </button>
              </div>

              {/* Page Header - NOW INSIDE CREATE TOKEN VIEW */}
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-3xl font-bold text-cyan-400">
                      Token Hub <span className="text-md font-normal text-gray-300">| Deploy & Manage</span>
                    </h1>
                    <p className="text-sm text-gray-400">Launch contracts and manage your tokens</p>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-[#0B0E14]/60 px-2 py-1.5 rounded-full backdrop-blur-xl border border-white/5">
                  <button
                    onClick={() => setActiveTab('deploy')}
                    className={`px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${activeTab === 'deploy'
                      ? 'bg-[#1A1D24] text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Disc className="w-4 h-4" />
                      <span>Deploy</span>
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
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'deploy' && (
                  <motion.div
                    key="deploy-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TokenFactory />
                  </motion.div>
                )}

                {activeTab === 'management' && (
                  <motion.div
                    key="management-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ManagementDashboard />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeployPage;