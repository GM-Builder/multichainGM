import { base } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

const NEXT_PUBLIC_ONCHAINKIT_API_KEY = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;

export const config = createConfig({
    chains: [base],
    connectors: [
        coinbaseWallet({
            appName: 'GannetX',
            preference: 'smartWalletOnly',
        }),
    ],
    transports: {
        [base.id]: http(),
    },
});
