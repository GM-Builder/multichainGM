import React from 'react';
import {
    Avatar,
    Name,
    Address,
    Identity,
    EthBalance
} from '@coinbase/onchainkit/identity';
import {
    ConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownDisconnect
} from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { FaUserCircle } from 'react-icons/fa';

export const ProfileView: React.FC = () => {
    const { address, isConnected } = useAccount();

    return (
        <div className="p-6 space-y-8 animate-fade-in-up">
            <div className="text-center py-6">
                <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 mb-4 p-[2px]">
                    <div className="bg-[#050608] rounded-full p-2">
                        {address ? (
                            <Identity
                                address={address}
                                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                            >
                                <Avatar className="w-24 h-24 rounded-full" />
                            </Identity>
                        ) : (
                            <FaUserCircle className="w-24 h-24 text-gray-600" />
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    {address ? (
                        <Identity
                            address={address}
                            schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                        >
                            <Name className="text-white" />
                        </Identity>
                    ) : 'Guest User'}
                </h2>

                {address && (
                    <div className="text-gray-400 font-mono text-sm bg-white/5 px-3 py-1 rounded-full inline-block">
                        <Address />
                    </div>
                )}
            </div>

            <div className="bg-[#111] p-6 rounded-2xl border border-white/10 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">Wallet Settings</h3>

                <div className="flex flex-col gap-4">
                    {/* OnchainKit Wallet Connection Component */}
                    <div className="flex justify-center">
                        <Wallet>
                            <ConnectWallet className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all">
                                <Avatar className="h-6 w-6" />
                                <Name />
                            </ConnectWallet>
                            <WalletDropdown>
                                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                                    <Avatar />
                                    <Name />
                                    <Address />
                                    <EthBalance />
                                </Identity>
                                <WalletDropdownDisconnect />
                            </WalletDropdown>
                        </Wallet>
                    </div>
                </div>
            </div>

            {/* Placeholder for other profile stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] p-4 rounded-2xl border border-white/10 text-center">
                    <span className="block text-2xl font-bold text-cyan-400">0</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Points</span>
                </div>
                <div className="bg-[#111] p-4 rounded-2xl border border-white/10 text-center">
                    <span className="block text-2xl font-bold text-purple-400">1</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Level</span>
                </div>
            </div>
        </div>
    );
};
