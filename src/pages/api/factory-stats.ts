import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FactoryABI from '@/abis/GannetXTokenFactory.json';
import { GANNETX_TOKEN_FACTORY_ADDRESS, BASE_RPC } from '@/utils/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC, { name: 'base-sepolia', chainId: 84532 as any });
    const contract = new ethers.Contract(GANNETX_TOKEN_FACTORY_ADDRESS, FactoryABI as any, provider);

    // Read basic stats
    const stats = await contract.getFactoryStats();

    // Read a couple of fee constants (if present)
    const keys = [
      'BASE_FEE',
      'TAX_SYSTEM_FEE',
      'ANTI_BOT_FEE',
      'MAX_TX_LIMIT_FEE',
      'MAX_WALLET_FEE',
      'COOLDOWN_FEE',
      'BLACKLIST_FEE',
      'PAUSABLE_FEE',
      'BURN_FEE',
      'REFLECTION_FEE',
      'WHITELIST_FEE',
      'MAX_SUPPLY'
    ];

    const fees: Record<string, string> = {};
    await Promise.all(keys.map(async (k) => {
      try {
        const val = await contract[k]();
        fees[k] = ethers.utils.formatEther(val);
      } catch (e) {
        // ignore missing
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        totalTokens: stats[0].toString(),
        totalFees: ethers.utils.formatEther(stats[1]),
        contractBalance: ethers.utils.formatEther(stats[2]),
        fees,
      },
    });
  } catch (error: any) {
    console.error('factory-stats api error', error);
    res.status(500).json({ success: false, error: error?.message || 'Unknown error' });
  }
}
