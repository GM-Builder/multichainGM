import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { ArrowLeft, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWalletState } from '@/hooks/useWalletState';
import {
    BASE_CHAIN_ID,
    SONEIUM_CHAIN_ID,
    INK_CHAIN_ID,
    OP_CHAIN_ID,
    LISK_CHAIN_ID,
    LINEA_CHAIN_ID,
    SUPPORTED_CHAINS
} from '@/utils/constants';
import { SIMPLE_DEPLOY_ADDRESSES, SIMPLE_DEPLOY_ABI } from '@/utils/constantsDeploy';
import { switchToChain, getProvider } from '@/utils/web3';
import ChainLogo from '@/components/ChainLogo';

interface SimpleDeployProps {
    onBack: () => void;
}

const CHAIN_IDS = [
    BASE_CHAIN_ID,
    SONEIUM_CHAIN_ID,
    INK_CHAIN_ID,
    OP_CHAIN_ID,
    LISK_CHAIN_ID,
    LINEA_CHAIN_ID
].sort((a, b) => {
    const nameA = SUPPORTED_CHAINS[a]?.chainName || '';
    const nameB = SUPPORTED_CHAINS[b]?.chainName || '';
    return nameA.localeCompare(nameB);
});

const SimpleDeploy: React.FC<SimpleDeployProps> = ({ onBack }) => {
    const { web3State } = useWalletState();
    const [selectedChain, setSelectedChain] = useState<number | null>(null);
    const [message, setMessage] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentFee, setDeploymentFee] = useState<string>('0');
    const [isSwitchingChain, setIsSwitchingChain] = useState(false);

    // Initialize selected chain based on current wallet chain if supported
    useEffect(() => {
        if (web3State.chainId && CHAIN_IDS.includes(web3State.chainId)) {
            setSelectedChain(web3State.chainId);
        }
    }, [web3State.chainId]);

    // Fetch deployment fee when chain/contract is available
    useEffect(() => {
        const fetchFee = async () => {
            if (!selectedChain) return;

            const contractAddress = SIMPLE_DEPLOY_ADDRESSES[selectedChain];
            if (!contractAddress) return;

            try {
                const provider = getProvider();
                if (!provider) return;

                // If we are on the correct chain, we can read from the contract
                // Note: We can read even if not connected if we have a public RPC provider, 
                // but getProvider() usually returns the wallet provider. 
                // For simplicity, we rely on wallet provider if connected to correct chain.
                // Or we could use a JsonRpcProvider just for reading.

                // Let's rely on the current provider.
                const signer = provider.getSigner();
                const contract = new ethers.Contract(contractAddress, SIMPLE_DEPLOY_ABI, provider);
                const fee = await contract.deploymentFee();
                setDeploymentFee(ethers.utils.formatEther(fee));
            } catch (error) {
                console.error("Error fetching fee:", error);
            }
        };

        fetchFee();
    }, [selectedChain, web3State.chainId]);

    const handleChainSelect = async (chainId: number) => {
        if (isSwitchingChain) return;
        setIsSwitchingChain(true);

        try {
            if (web3State.chainId !== chainId) {
                await switchToChain(chainId);
            }
            setSelectedChain(chainId);
        } catch (error) {
            console.error("Failed to switch chain:", error);
            toast.error("Failed to switch network.");
        } finally {
            setIsSwitchingChain(false);
        }
    };

    const handleDeploy = async () => {
        if (!selectedChain) {
            toast.error('Please select a chain first');
            return;
        }

        if (!web3State.isConnected) {
            toast.error('Please connect your wallet');
            return;
        }

        const contractAddress = SIMPLE_DEPLOY_ADDRESSES[selectedChain];
        if (!contractAddress) {
            toast.error('Deployments for this chain are coming soon!');
            return;
        }

        if (web3State.chainId !== selectedChain) {
            toast.error(`Please switch your wallet to ${SUPPORTED_CHAINS[selectedChain]?.chainName}`);
            return;
        }

        if (!message) {
            toast.error('Please enter a message for your deployment');
            return;
        }

        setIsDeploying(true);
        const toastId = toast.loading('Preparing deployment...');

        try {
            const provider = getProvider();
            if (!provider) throw new Error("No provider available");

            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, SIMPLE_DEPLOY_ABI, signer);

            // Get current fee again to be sure
            const fee = await contract.deploymentFee();

            toast.loading('Please confirm transaction...', { id: toastId });

            const tx = await contract.deployContract(message, {
                value: fee
            });

            toast.loading('Deploying contract...', { id: toastId });

            const receipt = await tx.wait();

            // Find ContractDeployed event
            const event = receipt.logs.find((log: any) => {
                try {
                    return contract.interface.parseLog(log).name === 'ContractDeployed';
                } catch {
                    return false;
                }
            });

            if (event) {
                const parsed = contract.interface.parseLog(event);
                toast.success(`Contract deployed at: ${parsed.args.contractAddress.slice(0, 6)}...${parsed.args.contractAddress.slice(-4)}`, { id: toastId });
            } else {
                toast.success('Transaction successful!', { id: toastId });
            }

            setMessage('');

        } catch (error: any) {
            console.error('Deploy error:', error);
            toast.error(error.reason || error.message || 'Failed to deploy', { id: toastId });
        } finally {
            setIsDeploying(false);
        }
    };

    const isChainEnabled = (chainId: number) => {
        // Only enable if we have a contract address configured
        return !!SIMPLE_DEPLOY_ADDRESSES[chainId];
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Zap className="text-cyan-400" />
                            <div className="font-bold text-white">
                                Simple Deploy
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">Deploy a contract in seconds</p>
                    </div>
                </div>

                {/* Chain Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                        Select Chain
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {CHAIN_IDS.map((chainId) => {
                            const chainInfo = SUPPORTED_CHAINS[chainId];
                            const isSelected = selectedChain === chainId;
                            const hasContract = isChainEnabled(chainId);
                            const isLoading = isSwitchingChain && isSelected;

                            return (
                                <button
                                    key={chainId}
                                    onClick={() => handleChainSelect(chainId)}
                                    className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 group ${isSelected
                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                        : 'bg-[#0B0E14] border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="rounded-lg">
                                        <ChainLogo
                                            logoUrl={chainInfo?.logoUrl || ''}
                                            altText={chainInfo?.chainName || 'Chain'}
                                            size="xl"
                                        />
                                    </div>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                        {chainInfo?.chainName || 'Unknown'}
                                    </span>

                                    {isSelected && (
                                        <motion.div
                                            layoutId="activeChain"
                                            className="absolute inset-0 border-2 border-cyan-500 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}

                                    {!hasContract && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-500/50" title="Coming Soon" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Configuration */}
                <div className="space-y-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Deployment Message
                        </label>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="e.g. Hello World!"
                            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This message will be stored in your deployed contract.
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                {selectedChain && isChainEnabled(selectedChain) && (
                    <div className="p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/10 mb-8 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-cyan-100 font-medium">Ready to Deploy</p>
                            <p className="text-cyan-400/60 mt-1">
                                Current deployment fee on {SUPPORTED_CHAINS[selectedChain]?.chainName}: {deploymentFee} {SUPPORTED_CHAINS[selectedChain]?.nativeCurrency?.symbol}
                            </p>
                        </div>
                    </div>
                )}

                {/* Deploy Button */}
                <button
                    onClick={handleDeploy}
                    disabled={!selectedChain || !isChainEnabled(selectedChain) || isDeploying || !message}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${selectedChain && isChainEnabled(selectedChain) && message && !isDeploying
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                        }`}
                >
                    {isDeploying ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Deploying...
                        </>
                    ) : !selectedChain ? (
                        'Select a Chain'
                    ) : !isChainEnabled(selectedChain) ? (
                        'Coming Soon'
                    ) : (
                        <>
                            Deploy Contract
                            <Zap className="w-5 h-5 fill-current" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SimpleDeploy;
