import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FactoryABI from '@/abis/GannetXTokenFactory.json';
import TokenABI from '@/abis/GannetXToken.json';
import { GANNETX_TOKEN_FACTORY_ADDRESS, BASE_SEPOLIA_RPC } from '@/utils/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address } = req.query;
    if (!address || typeof address !== 'string') return res.status(400).json({ success: false, error: 'address required' });

    const provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);
    const factory = new ethers.Contract(GANNETX_TOKEN_FACTORY_ADDRESS, FactoryABI as any, provider);

    const tokens: string[] = await factory.getUserTokens(address);

    const tokenInfos = await Promise.all(tokens.map(async (t) => {
      try {
        // check that there's code at the address
        const code = await provider.getCode(t);
        if (!code || code === '0x') {
          return { address: t, error: 'no contract code at address', codePresent: false };
        }

        const token = new ethers.Contract(t, TokenABI as any, provider);

        // read basic info
        let name = null;
        let symbol = null;
        let decimals: number | null = null;
        let totalSupplyBn: ethers.BigNumber | null = null;
        let owner: string | null = null;
        let readError: string | null = null;

        try {
          name = await token.name();
          symbol = await token.symbol();
          decimals = await token.decimals();
          totalSupplyBn = await token.totalSupply();
          owner = await token.owner();
        } catch (err: any) {
          readError = err?.message || 'failed to read basic token info';
        }

        // try to read features struct if available
        let features = null;
        let featuresRaw: any = null;
        let featuresError: string | null = null;
        try {
          const f = await token.getFeatures();
          featuresRaw = f;
          // getFeatures returns tuple of booleans in the ABI order
          features = {
            hasTaxSystem: Boolean(f[0]),
            hasAntiBot: Boolean(f[1]),
            hasMaxTxLimit: Boolean(f[2]),
            hasMaxWallet: Boolean(f[3]),
            hasCooldown: Boolean(f[4]),
            hasBlacklist: Boolean(f[5]),
            isPausable: Boolean(f[6]),
            hasBurn: Boolean(f[7]),
            hasReflection: Boolean(f[8]),
            hasWhitelist: Boolean(f[9]),
          };
        } catch (e: any) {
          featuresError = e?.message || 'getFeatures not available or failed';
        }

        // verify token is from factory (best-effort)
        let isFromFactory = false;
        let isFromFactoryError: string | null = null;
        try {
          isFromFactory = await factory.isFromFactory(t);
        } catch (e: any) {
          isFromFactoryError = e?.message || 'isFromFactory check failed';
        }

        const totalSupply = totalSupplyBn ? totalSupplyBn.toString() : null;
        const totalSupplyHuman = (() => {
          try {
            return totalSupplyBn && decimals !== null ? ethers.utils.formatUnits(totalSupplyBn, decimals) : null;
          } catch (e) { return null; }
        })();

        return {
          address: t,
          codePresent: true,
          name,
          symbol,
          decimals,
          totalSupply,
          totalSupplyHuman,
          owner,
          features,
          featuresRaw,
          featuresError,
          isFromFactory,
          isFromFactoryError,
          readError,
        };
      } catch (e: any) {
        return { address: t, error: 'failed to read token', errorMessage: e?.message };
      }
    }));

    res.status(200).json({ success: true, data: tokenInfos });
  } catch (error: any) {
    console.error('/api/management/user-tokens error', error);
    res.status(500).json({ success: false, error: error?.message || 'Unknown error' });
  }
}
