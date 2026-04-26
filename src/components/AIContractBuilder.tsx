'use client';
// src/components/AIContractBuilder.tsx
// CHANGELOG:
//   [FIX-1]  Label cleaning — "Execute: recover e r c20" → "Recover stuck ERC-20 tokens"
//   [FIX-2]  Deduplicate Plain English items (no more duplicate entries)
//   [FIX-3]  USD estimate beside ETH fee  (e.g. "0.005 ETH (~$X.XX)")
//   [FIX-4]  Char counter + 2000-char limit warning in textarea
//   [FIX-5]  Estimated time subtitle on Generate button
//   [FIX-6]  Contract Overview expanded by default on Review screen
//   [FIX-7]  Difficulty badge on subcategory cards
//   [FIX-8]  Consistent hover border on ALL category cards (no pre-selected green)
//   [FIX-9]  "Deploy to X" button consistent gradient with Generate button
//   [FIX-10] New "prompt_review" step between details → building
//            Shows full rendered prompt + summary card before user confirms generate

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Code2,
    Coins,
    Image as ImageIcon,
    Lock,
    Users,
    FileCode2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Copy,
    ChevronRight,
    ChevronDown,
    Info,
    Zap,
    ShieldCheck,
    RefreshCw,
    ExternalLink,
    BookOpen,
    Clock,
    DollarSign,
    PencilLine,
    Eye,
    Tag,
    ListChecks,
    MessageSquareText,
} from 'lucide-react';
import { useWalletState } from '@/hooks/useWalletState';
import { getProvider } from '@/utils/web3';
import DeploymentSuccess from '@/components/DeploymentSuccess';
import { SUPPORTED_CHAINS } from '@/utils/constants';

// ─── Config ───────────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.NEXT_PUBLIC_GANNETXAI_API_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_GANNETXAI_API_KEY || '';

const FACTORY_ABI = [
    'function deployContract(bytes,bytes,bytes32,string) payable returns (address)',
    'function deploymentFee() view returns (uint256)',
];

// [FIX-3] ETH/USD price — fetched once on mount, fallback to 0 (hides USD if unavailable)
const MAX_PROMPT_CHARS = 2000;

// ─── Types ────────────────────────────────────────────────────────────────────
type WizardStep = 'category' | 'subcategory' | 'details' | 'prompt_review' | 'building' | 'review' | 'success';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface ContractCategory {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    borderHover: string;
    iconBg: string;
    iconColor: string;
}

interface SubOption {
    id: string;
    label: string;
    description: string;
    details: string[];
    promptHint: string;
    difficulty: Difficulty;      // [FIX-7]
}

interface BackendPayload {
    requestId: string;
    data: {
        contractName: string;
        bytecodeHex: string;
        signature: string;
        deploymentFeeEth: string;
        selfHealed: boolean;
        bytecodeSizeKb: number;
        solidityCode?: string;
        abi?: any[];
        compilerVersion?: string;
    };
    instructions: {
        params: string[];
        value: string;
        gasEstimate: string;
    };
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const CATEGORIES: ContractCategory[] = [
    {
        id: 'token',
        label: 'Token / Coin',
        description: 'Fungible tokens: utility, governance, meme, stablecoin',
        icon: Coins,
        color: 'cyan',
        borderHover: 'hover:border-cyan-500/40',
        iconBg: 'bg-cyan-500/10 border-cyan-500/20',
        iconColor: 'text-cyan-400',
    },
    {
        id: 'nft',
        label: 'NFT Collection',
        description: 'ERC-721 or ERC-1155 collectibles & gaming assets',
        icon: ImageIcon,
        color: 'purple',
        borderHover: 'hover:border-purple-500/40',
        iconBg: 'bg-purple-500/10 border-purple-500/20',
        iconColor: 'text-purple-400',
    },
    {
        id: 'defi',
        label: 'DeFi Protocol',
        description: 'Staking, vaults, lending, yield farming contracts',
        icon: Lock,
        color: 'emerald',
        borderHover: 'hover:border-emerald-500/40',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-400',
    },
    {
        id: 'dao',
        label: 'DAO / Governance',
        description: 'Voting, treasury, multisig, and governance systems',
        icon: Users,
        color: 'blue',
        borderHover: 'hover:border-blue-500/40',
        iconBg: 'bg-blue-500/10 border-blue-500/20',
        iconColor: 'text-blue-400',
    },
    {
        id: 'utility',
        label: 'Utility Contract',
        description: 'Escrow, payment splitter, airdrop, subscription',
        icon: Zap,
        color: 'yellow',
        borderHover: 'hover:border-yellow-500/40',
        iconBg: 'bg-yellow-500/10 border-yellow-500/20',
        iconColor: 'text-yellow-400',
    },
    {
        id: 'custom',
        label: 'Custom / Other',
        description: 'Describe anything — AI will figure it out',
        icon: FileCode2,
        color: 'gray',
        borderHover: 'hover:border-white/20',
        iconBg: 'bg-white/5 border-white/10',
        iconColor: 'text-gray-400',
    },
];

// [FIX-7] difficulty added to every sub-option
const SUB_OPTIONS: Record<string, SubOption[]> = {
    token: [
        {
            id: 'erc20_basic',
            label: 'Basic ERC-20',
            description: 'Standard fungible token with fixed supply',
            details: ['Fixed supply minted to deployer', 'Standard transfer & approve', 'No tax or special mechanics'],
            promptHint: 'Create a basic ERC-20 token',
            difficulty: 'Beginner',
        },
        {
            id: 'erc20_mintable',
            label: 'Mintable Token',
            description: 'Owner can mint additional tokens later',
            details: ['Owner-controlled minting', 'Optional burn function', 'Access control via Ownable'],
            promptHint: 'Create a mintable ERC-20 token with owner-controlled minting',
            difficulty: 'Beginner',
        },
        {
            id: 'governance_token',
            label: 'Governance Token',
            description: 'Token with on-chain voting delegation',
            details: ['ERC-20Votes extension', 'Delegation support', 'Snapshot-based voting power'],
            promptHint: 'Create a governance ERC-20 token with voting delegation (ERC20Votes)',
            difficulty: 'Intermediate',
        },
        {
            id: 'deflationary',
            label: 'Deflationary Token',
            description: 'Auto-burn on every transfer',
            details: ['Configurable burn rate', 'Decreasing supply over time', 'Transfer tax mechanism'],
            promptHint: 'Create a deflationary ERC-20 token that burns a small percentage on every transfer',
            difficulty: 'Intermediate',
        },
        {
            id: 'wrapped',
            label: 'Wrapped Token',
            description: 'Wrap another token 1:1',
            details: ['Deposit & withdraw', 'Pegged 1:1 to underlying', 'Standard ERC-20 interface'],
            promptHint: 'Create a wrapped ERC-20 token that wraps another token 1:1',
            difficulty: 'Intermediate',
        },
    ],
    nft: [
        {
            id: 'erc721_basic',
            label: 'Basic NFT (ERC-721)',
            description: 'Standard 1-of-1 collectible collection',
            details: ['Unique token IDs', 'URI metadata per token', 'Owner can mint'],
            promptHint: 'Create a basic ERC-721 NFT collection',
            difficulty: 'Beginner',
        },
        {
            id: 'erc721_whitelist',
            label: 'Whitelist Mint NFT',
            description: 'Merkle-proof whitelist + public sale',
            details: ['Merkle tree whitelist', 'Max per wallet limit', 'Reveal mechanic support'],
            promptHint: 'Create an ERC-721 NFT with merkle whitelist presale and public sale phases',
            difficulty: 'Advanced',
        },
        {
            id: 'erc1155',
            label: 'Multi-Edition (ERC-1155)',
            description: 'Multiple token types in one contract',
            details: ['Multiple token IDs', 'Batch transfers', 'Fungible + non-fungible mix'],
            promptHint: 'Create an ERC-1155 multi-edition NFT contract',
            difficulty: 'Intermediate',
        },
        {
            id: 'soulbound',
            label: 'Soulbound Token',
            description: 'Non-transferable identity / badge NFT',
            details: ['Non-transferable (SBT)', 'Owner-issued badges', 'Identity / reputation use case'],
            promptHint: 'Create a soulbound (non-transferable) ERC-721 token for identity badges',
            difficulty: 'Intermediate',
        },
    ],
    defi: [
        {
            id: 'staking',
            label: 'Staking Contract',
            description: 'Stake tokens and earn rewards over time',
            details: ['APR-based rewards', 'Lock period options', 'Emergency withdraw'],
            promptHint: 'Create a staking contract where users stake ERC-20 tokens and earn rewards',
            difficulty: 'Intermediate',
        },
        {
            id: 'vault',
            label: 'Simple Vault',
            description: 'Deposit & withdraw with yield tracking',
            details: ['ERC-4626-like interface', 'Share-based accounting', 'Owner-managed strategy'],
            promptHint: 'Create a simple token vault where users deposit and get yield-bearing shares',
            difficulty: 'Advanced',
        },
        {
            id: 'payment_stream',
            label: 'Payment Stream',
            description: 'Stream tokens linearly over time',
            details: ['Linear vesting stream', 'Claimable by recipient', 'Cancellable by sender'],
            promptHint: 'Create a payment streaming contract that sends tokens linearly over a time period',
            difficulty: 'Intermediate',
        },
        {
            id: 'airdrop',
            label: 'Merkle Airdrop',
            description: 'Gas-efficient claim-based airdrop',
            details: ['Merkle proof verification', 'One claim per address', 'Expiry date support'],
            promptHint: 'Create a merkle tree airdrop contract for gas-efficient token claims',
            difficulty: 'Advanced',
        },
    ],
    dao: [
        {
            id: 'multisig',
            label: 'Multisig Wallet',
            description: 'M-of-N multi-signature treasury',
            details: ['Configurable threshold', 'Execute arbitrary calls', 'On-chain proposal queue'],
            promptHint: 'Create a multisig wallet contract requiring M of N signers to execute transactions',
            difficulty: 'Advanced',
        },
        {
            id: 'simple_dao',
            label: 'Simple DAO',
            description: 'Token-weighted proposal voting',
            details: ['Proposal creation', 'Token-weighted votes', 'Timelock execution'],
            promptHint: 'Create a simple DAO with token-weighted voting, proposal creation, and timelock',
            difficulty: 'Advanced',
        },
        {
            id: 'treasury',
            label: 'Treasury Contract',
            description: 'Community-governed fund management',
            details: ['Receive ETH and tokens', 'Governed withdrawals', 'Budget proposals'],
            promptHint: 'Create a DAO treasury contract with governed spending proposals',
            difficulty: 'Intermediate',
        },
    ],
    utility: [
        {
            id: 'escrow',
            label: 'Escrow',
            description: 'Trustless two-party payment escrow',
            details: ['Deposit by buyer', 'Release by arbiter', 'Refund mechanism'],
            promptHint: 'Create an escrow contract for trustless two-party transactions with an arbiter',
            difficulty: 'Beginner',
        },
        {
            id: 'payment_splitter',
            label: 'Payment Splitter',
            description: 'Split ETH/tokens among multiple recipients',
            details: ['Configurable split ratios', 'Multiple recipients', 'Pull-based withdrawals'],
            promptHint: 'Create a payment splitter contract that divides ETH among multiple recipients by percentage',
            difficulty: 'Beginner',
        },
        {
            id: 'subscription',
            label: 'Subscription',
            description: 'Recurring payment subscription system',
            details: ['Monthly/weekly billing', 'Subscriber management', 'Access gating'],
            promptHint: 'Create a subscription contract with recurring payments and access control',
            difficulty: 'Intermediate',
        },
        {
            id: 'timelock',
            label: 'Timelock',
            description: 'Delay execution of sensitive operations',
            details: ['Configurable delay', 'Queue and cancel', 'Guardian override'],
            promptHint: 'Create a timelock contract that delays execution of operations by a configurable period',
            difficulty: 'Advanced',
        },
    ],
    custom: [
        {
            id: 'custom_free',
            label: 'Free-form Description',
            description: 'Describe exactly what you want',
            details: ['AI interprets your description', 'No template constraints', 'Most flexible option'],
            promptHint: '',
            difficulty: 'Intermediate',
        },
    ],
};

// ─── Difficulty badge helper ─────────────────────────────────────────────────
// [FIX-7]
const DIFFICULTY_CONFIG: Record<Difficulty, { dots: number; color: string; filled: string }> = {
    Beginner:     { dots: 3, color: 'text-emerald-400', filled: 'bg-emerald-400' },
    Intermediate: { dots: 3, color: 'text-yellow-400',  filled: 'bg-yellow-400'  },
    Advanced:     { dots: 3, color: 'text-red-400',     filled: 'bg-red-400'     },
};
const DIFFICULTY_FILLED: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };

const DifficultyBadge: React.FC<{ difficulty: Difficulty }> = ({ difficulty }) => {
    const cfg = DIFFICULTY_CONFIG[difficulty];
    const filled = DIFFICULTY_FILLED[difficulty];
    return (
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${cfg.color}`}>
            <div className="flex gap-0.5">
                {Array.from({ length: cfg.dots }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < filled ? cfg.filled : 'bg-white/15'}`}
                    />
                ))}
            </div>
            {difficulty}
        </div>
    );
};

// ─── Poll Helper ──────────────────────────────────────────────────────────────
interface StatusResponse {
    success: boolean;
    data: { status: string; error?: string };
}
interface InitiateResponse {
    success: boolean;
    requestId: string;
}
interface ResultResponse {
    success: boolean;
    data: BackendPayload['data'];
    instructions: BackendPayload['instructions'];
}

async function pollUntilReady(requestId: string, onStatus: (s: string) => void): Promise<void> {
    for (let i = 0; i < 80; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
            const r = await fetch(`${BACKEND_URL}/api/deploy/status/${requestId}`, {
                headers: { 'X-API-Key': API_KEY },
            });
            if (!r.ok) { console.warn(`Polling returned ${r.status}, retrying...`); continue; }
            const body = (await r.json()) as StatusResponse;
            if (body.success && body.data) {
                onStatus(body.data.status);
                if (body.data.status === 'READY') return;
                if (body.data.status === 'FAILED') throw new Error(body.data.error || 'Pipeline failed');
            }
        } catch (err: any) {
            if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('fetch')) throw err;
            console.warn('Network error during poll, retrying...', err);
        }
    }
    throw new Error('Timeout: pipeline took too long');
}

// ─── Status Label Map ─────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
    PENDING:    'Waiting in queue...',
    GENERATING: 'AI is writing your contract...',
    COMPILING:  'Compiling Solidity code...',
    SIGNING:    'Signing deployment payload...',
    READY:      'Ready to deploy!',
};

// ─── [FIX-1] Comprehensive function → plain-English map ──────────────────────
// Fixes: "Execute: exit", "Execute: recover e r c20", duplicate labels, etc.
const toSimpleDescription = (fnName: string, isWrite: boolean): string => {
    // Exact match first (case-insensitive key comparison)
    const exactMap: Record<string, string> = {
        // ERC-20
        transfer:           'Send tokens to another wallet',
        transferfrom:       'Transfer tokens on behalf of someone else',
        approve:            'Allow another wallet to spend your tokens',
        allowance:          'Check how much a wallet is allowed to spend',
        balanceof:          'Check how many tokens someone holds',
        totalsupply:        'Check total number of tokens in existence',
        mint:               'Create new tokens and add them to circulation',
        burn:               'Destroy tokens to reduce total supply',
        // ERC-721 / NFT
        ownerof:            'Check who owns a specific NFT',
        tokenuri:           'Get the metadata link for a specific NFT',
        safemint:           'Create a new NFT for someone',
        safetransferfrom:   'Safely send an NFT to another wallet',
        setapprovalforall:  'Allow or revoke a wallet to manage all your NFTs',
        isapprovedforall:   'Check if someone is allowed to manage all your NFTs',
        // DeFi / Staking
        stake:              'Lock tokens to earn rewards',
        unstake:            'Unlock and withdraw your staked tokens',
        withdraw:           'Withdraw tokens or funds from the contract',
        deposit:            'Put tokens or funds into the contract',
        claimreward:        'Collect your earned rewards',
        getreward:          'Retrieve your accumulated rewards',
        earned:             'See how much reward you have accumulated',
        exit:               'Withdraw all staked tokens and claim pending rewards',
        notifyrewardamount: 'Notify the contract of newly added reward tokens',
        recovererc20:       'Recover stuck ERC-20 tokens from the contract',                 // [FIX-1]
        setrewardsrate:     'Set the rate at which rewards are distributed',
        // DAO
        propose:            'Submit a new governance proposal',
        vote:               'Cast your vote on a proposal',
        execute:            'Execute a proposal that has been approved',
        castvote:           'Vote for or against a proposal',
        // General
        owner:              'Get the address of the contract owner',
        renounceownership:  'Permanently give up ownership of the contract',
        transferownership:  'Hand over contract ownership to a new address',
        pause:              'Temporarily stop all contract activity',
        unpause:            'Resume contract activity after a pause',
        name:               'Get the name of the token or collection',
        symbol:             'Get the short symbol (ticker) of the token',
        decimals:           'Get the number of decimal places for this token',
        totalsupplystaked:  'Check the total amount of tokens currently staked',
        totalstaked:        'Check the total amount of tokens currently staked',
        rewardrate:         'View the current rate of reward distribution',
        rewardtoken:        'View the token being distributed as rewards',
        stakingtoken:       'View the token users must stake',
    };

    const key = fnName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (exactMap[key]) return exactMap[key];

    // Partial-match fallback
    const partials: [string, string][] = [
        ['recover',   'Recover stuck tokens from the contract'],
        ['reward',    isWrite ? 'Manage rewards' : 'View reward information'],
        ['stake',     isWrite ? 'Manage staking position' : 'View staking information'],
        ['withdraw',  'Withdraw funds from the contract'],
        ['deposit',   'Deposit funds into the contract'],
        ['transfer',  'Transfer tokens'],
        ['approve',   'Approve token spending'],
        ['balance',   'Check account balance'],
        ['owner',     'View or manage ownership'],
        ['fee',       'View or manage fees'],
        ['pause',     'Pause or unpause the contract'],
    ];
    for (const [partial, desc] of partials) {
        if (key.includes(partial)) return desc;
    }

    // Last resort: humanise camelCase, no "Execute:" prefix for non-custom
    const humanized = fnName
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .trim()
        .replace(/\berc ?(\d+)\b/gi, 'ERC-$1');   // fix "e r c 20" → "ERC-20"
    return isWrite
        ? humanized.charAt(0).toUpperCase() + humanized.slice(1)
        : humanized.charAt(0).toUpperCase() + humanized.slice(1);
};

// ─── [FIX-2] Parse ABI — deduplicated plain-English list ─────────────────────
const parseCapabilities = (abi: any[]): {
    reads:  { sig: string; simple: string }[];
    writes: { sig: string; simple: string }[];
    events: string[];
} => {
    const reads:  { sig: string; simple: string }[] = [];
    const writes: { sig: string; simple: string }[] = [];
    const events: string[] = [];
    const seenSimpleWrites = new Set<string>();
    const seenSimpleReads  = new Set<string>();

    if (!Array.isArray(abi)) return { reads, writes, events };

    for (const item of abi) {
        if (item.type === 'function') {
            const name   = item.name;
            const args   = (item.inputs || []).map((i: any) => `${i.type} ${i.name}`).join(', ');
            const sig    = args ? `${name}(${args})` : `${name}()`;
            const isView = item.stateMutability === 'view' || item.stateMutability === 'pure';
            const simple = toSimpleDescription(name, !isView);

            if (isView) {
                if (!seenSimpleReads.has(simple)) { seenSimpleReads.add(simple); reads.push({ sig, simple }); }
            } else {
                if (!seenSimpleWrites.has(simple)) { seenSimpleWrites.add(simple); writes.push({ sig, simple }); }
            }
        } else if (item.type === 'event') {
            if (!events.includes(item.name)) events.push(item.name);
        }
    }
    return { reads, writes, events };
};

// ─── [FIX-3] USD estimate ─────────────────────────────────────────────────────
const useEthUsd = () => {
    const [price, setPrice] = useState<number>(0);
    useEffect(() => {
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
            .then(r => r.json())
            .then(d => setPrice(d?.ethereum?.usd ?? 0))
            .catch(() => {}); // silently fail — UI hides USD if price = 0
    }, []);
    return price;
};

const fmtUsd = (eth: number, price: number) =>
    price > 0 ? ` (~$${(eth * price).toFixed(2)})` : '';

// ─── Main Component ───────────────────────────────────────────────────────────
interface AIContractBuilderProps { onBack: () => void; }

const AIContractBuilder: React.FC<AIContractBuilderProps> = ({ onBack }) => {
    const { web3State } = useWalletState();
    const ethUsdPrice   = useEthUsd();                  // [FIX-3]

    // Wizard state
    const [step, setStep]                         = useState<WizardStep>('category');
    const [selectedCategory, setSelectedCategory] = useState<ContractCategory | null>(null);
    const [selectedSub, setSelectedSub]           = useState<SubOption | null>(null);
    const [userPrompt, setUserPrompt]             = useState('');
    const [contractName, setContractName]         = useState('');
    const [contractSymbol, setContractSymbol]     = useState('');

    // Pipeline state
    const [pipelineStatus, setPipelineStatus] = useState('');
    const [requestId, setRequestId]           = useState('');
    const [payload, setPayload]               = useState<BackendPayload | null>(null);

    // Deploy state
    const [isDeploying, setIsDeploying]               = useState(false);
    const [showSuccess, setShowSuccess]               = useState(false);
    const [deployedAddress, setDeployedAddress]       = useState('');
    const [deployedTxHash, setDeployedTxHash]         = useState('');
    const [showCode, setShowCode]                     = useState(false);
    const [showOverview, setShowOverview]             = useState(true);    // [FIX-6] expanded by default
    const [overviewMode, setOverviewMode]             = useState<'simple' | 'technical'>('simple');
    const [codeCopied, setCodeCopied]                 = useState(false);
    const [targetChainId, setTargetChainId]           = useState<number>(84532);
    const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);

    // [v6.0] prompt preview state — populated when entering prompt_review step
    const [promptPreview, setPromptPreview]   = useState<string>('');
    const [previewLoading, setPreviewLoading] = useState(false);

    const copyCode = useCallback((code: string) => {
        navigator.clipboard.writeText(code);
        setCodeCopied(true);
        toast.success('Source code copied!');
        setTimeout(() => setCodeCopied(false), 2000);
    }, []);

    const isTokenCategory = selectedCategory?.id === 'token';
    const subOptions      = selectedCategory ? (SUB_OPTIONS[selectedCategory.id] || []) : [];

    const getPlaceholder = (sub: SubOption | null, cat: ContractCategory | null) => {
        if (!sub) return '';
        if (sub.id === 'custom_free') return 'Describe your smart contract in detail. Example: "I need a decentralized lottery where users buy tickets with ETH, and a random winner is selected every week..."';
        const catId = cat?.id || '';
        switch (catId) {
            case 'token':   return `Any specific requirements for your ${sub.label}? Example: "initial supply of 100 million", "only owner can mint", "burn 1% on transfer"...`;
            case 'nft':     return `Any specific requirements for your ${sub.label}? Example: "max supply of 10000", "base URI is ipfs://...", "allow max 5 mints per wallet"...`;
            case 'defi':    return `Any specific requirements for your ${sub.label}? Example: "reward rate is 10% APY", "lock period of 30 days", "deposit fee of 1%"...`;
            case 'dao':     return `Any specific requirements for your ${sub.label}? Example: "quorum is 5%", "voting delay is 1 day", "requires 3 out of 5 signers"...`;
            case 'utility': return `Any specific requirements for your ${sub.label}? Example: "fee is 2%", "delay is 24 hours", "split 50/50 between two addresses"...`;
            default:        return `Any specific requirements for your ${sub.label}? Example: "add a whitelist", "make it pausable"...`;
        }
    };

    // ── [v6.0] Fetch prompt preview dari backend (GET /api/deploy/preview-prompt) ──
    // Dipanggil saat user klik "Preview & Continue" — sebelum masuk prompt_review step
    const fetchPromptPreview = useCallback(async (): Promise<boolean> => {
        if (!selectedSub) return false;
        setPreviewLoading(true);
        try {
            const params = new URLSearchParams({
                subcategoryId: selectedSub.id,
                ...(userPrompt.trim()    && { userExtras: userPrompt.trim() }),
                ...(contractName.trim()  && { contractName: contractName.trim() }),
                ...(contractSymbol.trim() && { contractSymbol: contractSymbol.trim() }),
            });
            const r = await fetch(`${BACKEND_URL}/api/deploy/preview-prompt?${params.toString()}`, {
                headers: { 'X-API-Key': API_KEY },
            });
            const body = await r.json();
            if (body.success) {
                setPromptPreview(body.data.prompt);
                return true;
            }
            throw new Error(body.error || 'Preview gagal');
        } catch (err: any) {
            // Fallback: buat preview lokal sederhana jika endpoint gagal
            const fallback = [
                selectedSub.promptHint || userPrompt,
                contractName   ? `Token name: "${contractName}"` : '',
                contractSymbol ? `Symbol: "${contractSymbol}"` : '',
                userPrompt     ? `Additional: ${userPrompt}` : '',
            ].filter(Boolean).join('\n');
            setPromptPreview(fallback);
            return true;
        } finally {
            setPreviewLoading(false);
        }
    }, [selectedSub, userPrompt, contractName, contractSymbol]);

    // ── [v6.0] Start pipeline — kirim subcategoryId ke backend, bukan full prompt ──
    const startPipeline = async () => {
        if (!web3State.isConnected || !web3State.address) { toast.error('Please connect your wallet first'); return; }
        setStep('building');
        setPipelineStatus('PENDING');
        try {
            const r1 = await fetch(`${BACKEND_URL}/api/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify({
                    deployerAddress: web3State.address,
                    subcategoryId:   selectedSub?.id ?? 'custom_free',
                    userExtras:      userPrompt.trim()     || undefined,
                    contractName:    contractName.trim()   || undefined,
                    contractSymbol:  contractSymbol.trim() || undefined,
                    aiProvider:      'gemini',
                }),
            });
            const init = (await r1.json()) as InitiateResponse;
            if (!init.success) throw new Error('Failed to start pipeline');
            setRequestId(init.requestId);
            await pollUntilReady(init.requestId, setPipelineStatus);
            const r2     = await fetch(`${BACKEND_URL}/api/deploy/result/${init.requestId}`, { headers: { 'X-API-Key': API_KEY } });
            const result = (await r2.json()) as ResultResponse;
            if (!result.success) throw new Error('Failed to fetch payload');
            setPayload({ requestId: init.requestId, data: result.data, instructions: result.instructions });
            setStep('review');
        } catch (err: any) {
            console.error('API Error:', err);
            toast.error(err.message || 'Pipeline failed');
            setStep('details');
        }
    };

    // ── Broadcast tx ───────────────────────────────────────────────────────────
    const handleDeploy = async () => {
        if (!payload || !web3State.isConnected) return;
        setIsDeploying(true);
        const toastId = toast.loading('Waiting for wallet confirmation...');
        try {
            const provider = getProvider();
            if (!provider) throw new Error('No provider');
            const { chainId } = await provider.getNetwork();
            if (chainId !== targetChainId) {
                toast.loading(`Switching to ${SUPPORTED_CHAINS[targetChainId]?.chainName || 'Target Network'}...`, { id: toastId });
                try {
                    if (window.ethereum?.request) {
                        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${targetChainId.toString(16)}` }] });
                    } else throw new Error('Wallet provider not found');
                } catch {
                    throw new Error(`Please switch your wallet to ${SUPPORTED_CHAINS[targetChainId]?.chainName || 'Target Network'} to deploy`);
                }
            }
            const signer     = provider.getSigner();
            const factoryAddr = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS!;
            const factory    = new ethers.Contract(factoryAddr, FACTORY_ABI, signer);
            const fee        = await factory.deploymentFee();
            toast.loading('Sending transaction...', { id: toastId });
            const tx         = await factory.deployContract(
                payload.instructions.params[0],
                payload.instructions.params[1],
                payload.instructions.params[2],
                payload.instructions.params[3],
                { value: fee }
            );
            toast.loading('Waiting for confirmation...', { id: toastId });
            const receipt    = await tx.wait();
            const deployed   = receipt.logs[0].address as string;
            await fetch(`${BACKEND_URL}/api/deploy/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify({ requestId: payload.requestId, txHash: tx.hash, contractAddress: deployed, blockNumber: receipt.blockNumber }),
            });
            toast.dismiss(toastId);
            setDeployedAddress(deployed);
            setDeployedTxHash(tx.hash);
            setShowSuccess(true);
            setStep('success');
        } catch (err: any) {
            const msg = err.code === 'ACTION_REJECTED' ? 'Transaction cancelled' : (err.message || 'Deploy failed');
            toast.error(msg, { id: toastId });
        } finally {
            setIsDeploying(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 px-8 pt-8 pb-6 border-b border-white/5">
                    <button
                        onClick={step === 'category' ? onBack : () => {
                            if (step === 'subcategory')   setStep('category');
                            else if (step === 'details')  setStep(subOptions.length > 1 ? 'subcategory' : 'category');
                            else if (step === 'prompt_review') setStep('details');
                            else if (step === 'review')   setStep('details');
                            else if (step === 'success')  onBack();
                            // 'building' — cannot go back
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <span className="font-bold text-white">AI Contract Builder</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full uppercase tracking-wider">New</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {step === 'category'      && 'Step 1 of 4 — Choose contract type'}
                            {step === 'subcategory'   && `Step 2 of 4 — Choose ${selectedCategory?.label} variant`}
                            {step === 'details'       && 'Step 3 of 4 — Describe your contract'}
                            {step === 'prompt_review' && 'Step 4 of 4 — Review before generating'}
                            {step === 'building'      && 'Building your contract...'}
                            {step === 'review'        && 'Review & Deploy'}
                            {step === 'success'       && 'Contract Deployed!'}
                        </p>
                    </div>
                    {['category', 'subcategory', 'details', 'prompt_review', 'review'].includes(step) && (
                        <div className="ml-auto flex items-center gap-1.5">
                            {['category', 'subcategory', 'details', 'prompt_review'].map((s, i) => (
                                <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'bg-emerald-400 w-4' : ['category','subcategory','details','prompt_review'].indexOf(step) > i ? 'w-1.5 bg-emerald-400/40' : 'w-1.5 bg-white/10'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="px-8 py-6">
                    <AnimatePresence mode="wait">

                        {/* ══ STEP 1: CATEGORY ═══════════════════════════════════════════ */}
                        {step === 'category' && (
                            <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                <p className="text-sm text-gray-400 mb-5">What type of contract do you want to create?</p>
                                {/* [FIX-8] All cards have identical base border — no pre-selected colour */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {CATEGORIES.map((cat) => (
                                        <motion.button
                                            key={cat.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setSelectedSub(null);
                                                if ((SUB_OPTIONS[cat.id] || []).length <= 1) {
                                                    setSelectedSub(SUB_OPTIONS[cat.id]?.[0] || null);
                                                    setStep('details');
                                                } else {
                                                    setStep('subcategory');
                                                }
                                            }}
                                            className={`flex items-start gap-4 p-4 bg-[#0B0E14] border border-white/10 rounded-xl ${cat.borderHover} transition-all text-left group`}
                                        >
                                            <div className={`w-11 h-11 flex-shrink-0 rounded-xl ${cat.iconBg} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                                <cat.icon className={`w-5 h-5 ${cat.iconColor}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-white text-sm mb-0.5">{cat.label}</div>
                                                <p className="text-xs text-gray-500 leading-relaxed">{cat.description}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5 group-hover:text-gray-400 transition-colors" />
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ══ STEP 2: SUBCATEGORY ════════════════════════════════════════ */}
                        {step === 'subcategory' && selectedCategory && (
                            <motion.div key="subcategory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className={`w-7 h-7 rounded-lg ${selectedCategory.iconBg} border flex items-center justify-center`}>
                                        <selectedCategory.icon className={`w-4 h-4 ${selectedCategory.iconColor}`} />
                                    </div>
                                    <span className="text-sm text-gray-300 font-medium">{selectedCategory.label}</span>
                                    <span className="text-gray-600">→</span>
                                    <span className="text-xs text-gray-500">Choose a variant</span>
                                </div>

                                <div className="space-y-2">
                                    {/* [FIX-7] Sorted: Beginner first */}
                                    {[...subOptions]
                                        .sort((a, b) => {
                                            const order: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
                                            return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
                                        })
                                        .map((sub) => (
                                        <motion.button
                                            key={sub.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => { setSelectedSub(sub); setStep('details'); }}
                                            className={`w-full flex items-start gap-4 p-4 bg-[#0B0E14] border border-white/10 ${selectedCategory.borderHover} rounded-xl transition-all text-left group`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-semibold text-white text-sm">{sub.label}</span>
                                                    <DifficultyBadge difficulty={sub.difficulty} />
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">{sub.description}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {sub.details.map((d) => (
                                                        <span key={d} className="px-2 py-0.5 text-[10px] bg-white/5 border border-white/8 text-gray-500 rounded-full">{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1 group-hover:text-gray-400 transition-colors" />
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ══ STEP 3: DETAILS ════════════════════════════════════════════ */}
                        {step === 'details' && (
                            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                {selectedCategory && selectedSub && (
                                    <div className="flex items-center gap-2 mb-5 text-xs text-gray-500">
                                        <span className={selectedCategory.iconColor}>{selectedCategory.label}</span>
                                        <ChevronRight className="w-3 h-3" />
                                        <span className="text-gray-400">{selectedSub.label}</span>
                                        <span className="ml-1"><DifficultyBadge difficulty={selectedSub.difficulty} /></span>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    {isTokenCategory && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Token Name <span className="text-red-400">*</span></label>
                                                <input type="text" value={contractName} onChange={(e) => setContractName(e.target.value)} placeholder="e.g. GannetCoin"
                                                    className="w-full px-3 py-2.5 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all text-white placeholder-gray-600 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Symbol <span className="text-red-400">*</span></label>
                                                <input type="text" value={contractSymbol} onChange={(e) => setContractSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. GNC" maxLength={8}
                                                    className="w-full px-3 py-2.5 bg-[#0B0E14] border border-white/10 rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all text-white placeholder-gray-600 text-sm font-mono uppercase" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Prompt textarea + [FIX-4] char counter */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-medium text-gray-400">
                                                {selectedSub?.id === 'custom_free' ? 'Describe your contract' : 'Additional requirements (optional)'}
                                            </label>
                                            {/* char counter */}
                                            <span className={`text-[10px] tabular-nums ${userPrompt.length > MAX_PROMPT_CHARS * 0.9 ? 'text-yellow-400' : 'text-gray-600'}`}>
                                                {userPrompt.length} / {MAX_PROMPT_CHARS.toLocaleString()}
                                            </span>
                                        </div>
                                        <textarea
                                            rows={5}
                                            value={userPrompt}
                                            onChange={(e) => setUserPrompt(e.target.value.slice(0, MAX_PROMPT_CHARS))}
                                            placeholder={getPlaceholder(selectedSub, selectedCategory)}
                                            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all text-white placeholder-gray-600 text-sm resize-none leading-relaxed"
                                        />
                                        <p className="text-xs text-gray-600 mt-1.5">
                                            {selectedSub?.id !== 'custom_free' && userPrompt.length === 0
                                                ? 'Leave blank to use default settings for this contract type'
                                                : userPrompt.length >= MAX_PROMPT_CHARS
                                                    ? <span className="text-yellow-400">Character limit reached</span>
                                                    : null}
                                        </p>
                                    </div>

                                    {selectedSub && selectedSub.id !== 'custom_free' && (
                                        <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg flex gap-3">
                                            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-xs text-blue-300/70 leading-relaxed">
                                                <span className="text-blue-300 font-medium">AI will generate: </span>
                                                {selectedSub.promptHint || selectedSub.description}. Your additional requirements will be merged in automatically.
                                            </div>
                                        </div>
                                    )}

                                    {!web3State.isConnected && (
                                        <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg flex gap-3">
                                            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-yellow-300/80">Connect your wallet before proceeding. Your address is needed to generate the deployment signature.</p>
                                        </div>
                                    )}

                                    {/* [FIX-5] CTA with estimated time subtitle — now goes to prompt_review first */}
                                    <div>
                                        <button
                                            onClick={async () => {
                                                const ok = await fetchPromptPreview();
                                                if (ok) setStep('prompt_review');
                                            }}
                                            disabled={
                                                previewLoading ||
                                                !web3State.isConnected ||
                                                (isTokenCategory && (!contractName || !contractSymbol)) ||
                                                (selectedSub?.id === 'custom_free' && !userPrompt.trim())
                                            }
                                            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/20"
                                        >
                                            {previewLoading
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading preview...</>
                                                : <><Eye className="w-4 h-4" /> Preview & Continue <ArrowRight className="w-4 h-4" /></>
                                            }
                                        </button>
                                        {/* [FIX-5] time estimate hint */}
                                        <p className="text-center text-[11px] text-gray-600 mt-2 flex items-center justify-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Usually takes 30–90 seconds to generate
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ══ STEP 4: PROMPT REVIEW ══════════════════════════════════════ */}
                        {step === 'prompt_review' && (
                            <motion.div
                                key="prompt_review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                {/* Section title */}
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <ListChecks className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Review your request</p>
                                        <p className="text-xs text-gray-500">This is what the AI will receive. Edit anything before generating.</p>
                                    </div>
                                </div>

                                <div className="space-y-3">

                                    {/* ── Summary card ── */}
                                    <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-xl space-y-3">

                                        {/* Contract type row */}
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 flex-shrink-0 rounded-lg ${selectedCategory?.iconBg} border flex items-center justify-center`}>
                                                {selectedCategory && <selectedCategory.icon className={`w-4 h-4 ${selectedCategory.iconColor}`} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Contract Type</p>
                                                <p className="text-sm font-semibold text-white">
                                                    {selectedCategory?.label}
                                                    {selectedSub && selectedSub.id !== 'custom_free' && (
                                                        <span className="text-gray-400 font-normal"> — {selectedSub.label}</span>
                                                    )}
                                                </p>
                                            </div>
                                            {selectedSub && <DifficultyBadge difficulty={selectedSub.difficulty} />}
                                        </div>

                                        {/* Token name/symbol — only if token category */}
                                        {isTokenCategory && (contractName || contractSymbol) && (
                                            <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                                                <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                                    <Tag className="w-4 h-4 text-cyan-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Token Identity</p>
                                                    <p className="text-sm text-white">
                                                        <span className="font-semibold">{contractName || '—'}</span>
                                                        {contractSymbol && <span className="ml-2 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-[10px] font-mono">{contractSymbol}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Template hint */}
                                        {selectedSub && selectedSub.id !== 'custom_free' && (
                                            <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                                                <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <Info className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Base Template</p>
                                                    <p className="text-xs text-blue-300/80 leading-relaxed">{selectedSub.promptHint}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Custom requirements */}
                                        {userPrompt.trim() && (
                                            <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                                                <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                    <MessageSquareText className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Your Requirements</p>
                                                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{userPrompt.trim()}</p>
                                                </div>
                                            </div>
                                        )}

                                        {!userPrompt.trim() && selectedSub?.id !== 'custom_free' && (
                                            <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                                                <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <MessageSquareText className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Your Requirements</p>
                                                    <p className="text-xs text-gray-600 italic">No additional requirements — default settings will be used.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Full prompt preview (collapsible) ── */}
                                    <details className="group">
                                        <summary className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors list-none select-none py-1">
                                            <Code2 className="w-3.5 h-3.5" />
                                            <span className="flex-1">Show full prompt sent to AI</span>
                                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                                        </summary>
                                        <div className="mt-2 p-4 bg-[#060810] border border-white/5 rounded-xl">
                                            {previewLoading ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Loading prompt preview...
                                                </div>
                                            ) : (
                                                <p className="text-[11px] font-mono text-emerald-300/70 leading-relaxed whitespace-pre-wrap break-words">
                                                    {promptPreview || '—'}
                                                </p>
                                            )}
                                        </div>
                                    </details>

                                    {/* ── Edit warning ── */}
                                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-lg flex gap-3">
                                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-300/70 leading-relaxed">
                                            Once you confirm, the AI will start generating. Generation takes <span className="text-yellow-300 font-medium">30–90 seconds</span> and cannot be cancelled mid-way.
                                            Go back to edit if anything looks wrong.
                                        </p>
                                    </div>

                                    {/* ── CTA buttons ── */}
                                    <div className="flex gap-3 pt-1">
                                        <button
                                            onClick={() => setStep('details')}
                                            className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-all"
                                        >
                                            <PencilLine className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={startPipeline}
                                            className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/20"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Confirm & Generate Contract
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ══ STEP 5 (was 4): BUILDING ══════════════════════════════════════════ */}
                        {step === 'building' && (
                            <motion.div key="building" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }} className="py-8 text-center">
                                <div className="relative w-24 h-24 mx-auto mb-8">
                                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                                    <div className="absolute inset-2 rounded-full bg-emerald-500/10 animate-pulse" />
                                    <div className="relative w-24 h-24 rounded-full bg-[#0B0E14] border border-emerald-500/30 flex items-center justify-center">
                                        <Code2 className="w-10 h-10 text-emerald-400" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{STATUS_LABELS[pipelineStatus] || 'Processing...'}</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8">Our AI is writing, compiling, and verifying your smart contract. This takes 30–90 seconds.</p>
                                <div className="max-w-xs mx-auto space-y-2">
                                    {(['PENDING', 'GENERATING', 'COMPILING', 'SIGNING', 'READY'] as const).map((s) => {
                                        const stages     = ['PENDING', 'GENERATING', 'COMPILING', 'SIGNING', 'READY'];
                                        const currentIdx = stages.indexOf(pipelineStatus);
                                        const thisIdx    = stages.indexOf(s);
                                        const isDone     = currentIdx > thisIdx;
                                        const isCurrent  = currentIdx === thisIdx;
                                        return (
                                            <div key={s} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isCurrent ? 'bg-emerald-500/10 border border-emerald-500/20' : isDone ? 'bg-white/3 border border-white/5' : 'opacity-30'}`}>
                                                {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : isCurrent ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />}
                                                <span className={`text-xs ${isCurrent ? 'text-white font-medium' : isDone ? 'text-gray-400' : 'text-gray-600'}`}>{STATUS_LABELS[s]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* ══ STEP 5: REVIEW ════════════════════════════════════════════ */}
                        {step === 'review' && payload && (
                            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                {/* Contract info card */}
                                <div className="p-5 bg-[#0B0E14] border border-white/10 rounded-xl mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{payload.data.contractName}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {selectedCategory?.label}{selectedSub && selectedSub.id !== 'custom_free' ? ` — ${selectedSub.label}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-full font-medium">Compiled ✓</span>
                                            {payload.data.selfHealed && (
                                                <span className="px-2 py-0.5 text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full">Auto-fixed ✓</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* [FIX-3] Fee cell shows USD estimate */}
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        <div className="p-2.5 bg-white/3 rounded-lg">
                                            <p className="text-[10px] text-gray-500 mb-1">Size</p>
                                            <p className="text-sm font-bold text-white">{payload.data.bytecodeSizeKb.toFixed(2)} KB</p>
                                        </div>
                                        <div className="p-2.5 bg-white/3 rounded-lg">
                                            <p className="text-[10px] text-gray-500 mb-1">Fee</p>
                                            <p className="text-sm font-bold text-cyan-400">{payload.data.deploymentFeeEth} ETH</p>
                                            {ethUsdPrice > 0 && (
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    ~${(parseFloat(payload.data.deploymentFeeEth) * ethUsdPrice).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="p-2.5 bg-white/3 rounded-lg">
                                            <p className="text-[10px] text-gray-500 mb-1">Gas Est.</p>
                                            <p className="text-sm font-bold text-white">{Number(payload.instructions.gasEstimate).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Source code toggle */}
                                {payload.data.solidityCode && (
                                    <div className="mb-4">
                                        <button onClick={() => setShowCode(!showCode)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
                                            <Code2 className="w-3.5 h-3.5" />
                                            {showCode ? 'Hide' : 'Preview'} source code
                                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCode ? 'rotate-90' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {showCode && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="relative">
                                                        <button onClick={() => copyCode(payload.data.solidityCode!)}
                                                            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-all">
                                                            {codeCopied ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                                                        </button>
                                                        <pre className="p-4 pb-4 bg-[#060810] border border-white/5 rounded-xl text-[11px] text-blue-300/80 font-mono overflow-x-auto max-h-56 overflow-y-auto leading-relaxed">
                                                            {payload.data.solidityCode}
                                                        </pre>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* [FIX-6] Contract Overview — expanded by default */}
                                {payload.data.abi && (
                                    <div className="mb-4">
                                        <button onClick={() => setShowOverview(!showOverview)}
                                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2 w-full">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span className="flex-1 text-left">Contract Overview & Capabilities</span>
                                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showOverview ? 'rotate-90' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {showOverview && ((): React.ReactElement => {
                                                const { reads, writes, events } = parseCapabilities(payload.data.abi!);
                                                const isSimple = overviewMode === 'simple';
                                                return (
                                                    <motion.div key="overview-content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-xl space-y-4">
                                                            {/* Mode toggle */}
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Explanation mode</p>
                                                                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                                                                    <button onClick={() => setOverviewMode('simple')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${isSimple ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'}`}>🙋 Plain English</button>
                                                                    <button onClick={() => setOverviewMode('technical')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!isSimple ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300'}`}>🔬 Technical</button>
                                                                </div>
                                                            </div>

                                                            {/* Summary */}
                                                            {isSimple ? (
                                                                <p className="text-xs text-gray-300 leading-relaxed">
                                                                    <span className="text-white font-semibold">{payload.data.contractName}</span> is an AI-generated smart contract. It has{' '}
                                                                    <span className="text-emerald-400 font-medium">{writes.length} action{writes.length !== 1 ? 's' : ''}</span> you can perform and{' '}
                                                                    <span className="text-cyan-400 font-medium">{reads.length} piece{reads.length !== 1 ? 's' : ''} of info</span> you can read.
                                                                    {events.length > 0 && ` It also fires ${events.length} automatic notification${events.length > 1 ? 's' : ''} when things happen.`}
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs text-gray-300 leading-relaxed">
                                                                    <span className="text-white font-semibold">{payload.data.contractName}</span> is an AI-generated Solidity smart contract exposing{' '}
                                                                    <span className="text-cyan-400 font-medium">{reads.length} view</span> and{' '}
                                                                    <span className="text-emerald-400 font-medium">{writes.length} state-changing</span> functions{events.length > 0 ? ` with ${events.length} event${events.length > 1 ? 's' : ''}` : ''}.
                                                                </p>
                                                            )}

                                                            {/* Writes */}
                                                            {writes.length > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">{isSimple ? '✅ What You Can Do' : '✏️ Write Functions (State-Changing)'}</p>
                                                                    <div className="grid gap-1.5">
                                                                        {writes.map((fn, i) => (
                                                                            <div key={i} className="flex items-start gap-2 text-xs">
                                                                                <span className="mt-0.5 text-emerald-500 flex-shrink-0">›</span>
                                                                                {isSimple ? <span className="text-gray-200">{fn.simple}</span> : <code className="font-mono text-emerald-300/80">{fn.sig}</code>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Reads */}
                                                            {reads.length > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">{isSimple ? '📋 What You Can View' : '👁️ Read Functions (View Only)'}</p>
                                                                    <div className="grid gap-1.5">
                                                                        {reads.map((fn, i) => (
                                                                            <div key={i} className="flex items-start gap-2 text-xs">
                                                                                <span className="mt-0.5 text-cyan-500 flex-shrink-0">›</span>
                                                                                {isSimple ? <span className="text-gray-200">{fn.simple}</span> : <code className="font-mono text-cyan-300/80">{fn.sig}</code>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Events */}
                                                            {events.length > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">{isSimple ? '🔔 Automatic Notifications' : '📡 Events Emitted'}</p>
                                                                    {isSimple ? (
                                                                        <p className="text-xs text-gray-400">This contract automatically fires notifications when activity occurs: {events.join(', ')}.</p>
                                                                    ) : (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {events.map((ev, i) => <span key={i} className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-full text-[10px] font-mono">{ev}</span>)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Footer metrics */}
                                                            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                                                                <div className="p-2 bg-white/3 rounded-lg">
                                                                    <p className="text-[10px] text-gray-500 mb-0.5">Bytecode Size</p>
                                                                    <p className="text-xs font-bold text-white">{payload.data.bytecodeSizeKb.toFixed(2)} KB</p>
                                                                </div>
                                                                <div className="p-2 bg-white/3 rounded-lg">
                                                                    <p className="text-[10px] text-gray-500 mb-0.5">Deployment Fee</p>
                                                                    <p className="text-xs font-bold text-cyan-400">{payload.data.deploymentFeeEth} ETH{fmtUsd(parseFloat(payload.data.deploymentFeeEth), ethUsdPrice)}</p>
                                                                </div>
                                                                <div className="p-2 bg-white/3 rounded-lg">
                                                                    <p className="text-[10px] text-gray-500 mb-0.5">Gas Estimate</p>
                                                                    <p className="text-xs font-bold text-white">{Number(payload.instructions.gasEstimate).toLocaleString()}</p>
                                                                </div>
                                                                <div className="p-2 bg-white/3 rounded-lg">
                                                                    <p className="text-[10px] text-gray-500 mb-0.5">AI Self-Healed</p>
                                                                    <p className={`text-xs font-bold ${payload.data.selfHealed ? 'text-yellow-400' : 'text-gray-400'}`}>{payload.data.selfHealed ? 'Yes ✓' : 'No'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })()}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Security note */}
                                <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg flex gap-3 mb-5">
                                    <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-300/70 leading-relaxed">
                                        This contract was generated by AI and compiled on-chain. Review the source code before deploying to mainnet.{' '}
                                        The deployment fee of <span className="text-blue-300 font-medium">{payload.data.deploymentFeeEth} ETH{fmtUsd(parseFloat(payload.data.deploymentFeeEth), ethUsdPrice)}</span> is charged by the GannetXAI Factory.
                                    </p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3">
                                    <button onClick={() => { setStep('details'); setPayload(null); }}
                                        className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-all">
                                        <RefreshCw className="w-4 h-4" /> Regenerate
                                    </button>

                                    <div className="flex-1 flex gap-2 w-full max-w-md">
                                        {/* Chain selector */}
                                        <div className="relative flex-1 min-w-[160px]">
                                            <button onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                                                className="w-full flex items-center justify-between px-3 py-3 bg-[#0B0E14] border border-white/10 rounded-xl text-sm font-medium text-white hover:border-white/20 transition-colors h-full">
                                                <div className="flex items-center gap-2 truncate">
                                                    {SUPPORTED_CHAINS[targetChainId]?.logoUrl
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        ? <img src={SUPPORTED_CHAINS[targetChainId].logoUrl} alt={SUPPORTED_CHAINS[targetChainId].chainName} className="w-5 h-5 rounded-full" />
                                                        : <div className="w-5 h-5 rounded-full bg-gray-700 flex-shrink-0" />}
                                                    <span className="truncate">{SUPPORTED_CHAINS[targetChainId]?.chainName || 'Select Network'}</span>
                                                </div>
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {isChainDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsChainDropdownOpen(false)} />
                                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                                            className="absolute bottom-full left-0 mb-2 w-64 bg-[#12161f] border border-white/10 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
                                                            <div className="max-h-72 overflow-y-auto p-1.5">
                                                                <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mainnet</div>
                                                                {Object.entries(SUPPORTED_CHAINS).filter(([_, c]) => !c.isTestnet).map(([chainId, c]) => (
                                                                    <button key={chainId} onClick={() => { setTargetChainId(Number(chainId)); setIsChainDropdownOpen(false); }}
                                                                        className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors ${targetChainId === Number(chainId) ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                                                                        {c.logoUrl ? <img src={c.logoUrl} alt={c.chainName} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-gray-700 flex-shrink-0" />}
                                                                        <span className="truncate">{c.chainName}</span>
                                                                        {targetChainId === Number(chainId) && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                                                                    </button>
                                                                ))}
                                                                <div className="px-2 py-1.5 mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-t border-white/5 pt-2">Testnet</div>
                                                                {Object.entries(SUPPORTED_CHAINS).filter(([_, c]) => c.isTestnet).map(([chainId, c]) => (
                                                                    <button key={chainId} onClick={() => { setTargetChainId(Number(chainId)); setIsChainDropdownOpen(false); }}
                                                                        className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors ${targetChainId === Number(chainId) ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                                                                        {c.logoUrl ? <img src={c.logoUrl} alt={c.chainName} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-gray-700 flex-shrink-0" />}
                                                                        <span className="truncate">{c.chainName}</span>
                                                                        {targetChainId === Number(chainId) && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* [FIX-9] Deploy button — same gradient as Generate */}
                                        <button onClick={handleDeploy} disabled={isDeploying || !web3State.isConnected}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/20">
                                            {isDeploying
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Deploying...</>
                                                : <><Zap className="w-4 h-4" /> Deploy to {SUPPORTED_CHAINS[targetChainId]?.chainName || 'Network'}</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ══ STEP 6: SUCCESS ════════════════════════════════════════════ */}
                        {step === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="py-4 text-center">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Contract Deployed!</h3>
                                <p className="text-sm text-gray-400 mb-6">{payload?.data.contractName} is now live on {SUPPORTED_CHAINS[targetChainId]?.chainName || 'Network'}</p>
                                <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-xl mb-5 text-left">
                                    <p className="text-xs text-gray-500 mb-1">Contract Address</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-mono text-emerald-400 break-all">{deployedAddress}</p>
                                        <button onClick={() => { navigator.clipboard.writeText(deployedAddress); toast.success('Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <a href={SUPPORTED_CHAINS[targetChainId]?.blockExplorerUrls?.[0] ? `${SUPPORTED_CHAINS[targetChainId].blockExplorerUrls[0]}/address/${deployedAddress}` : '#'}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm transition-all">
                                        <ExternalLink className="w-4 h-4" /> BaseScan
                                    </a>
                                    <button onClick={onBack} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                                        Deploy Another
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            <DeploymentSuccess
                isVisible={showSuccess}
                onClose={() => setShowSuccess(false)}
                title={`${payload?.data.contractName || 'Contract'} Deployed!`}
                contractAddress={deployedAddress}
                txHash={deployedTxHash}
                chainId={targetChainId}
                networkName={SUPPORTED_CHAINS[targetChainId]?.chainName || 'Network'}
            />
        </div>
    );
};

export default AIContractBuilder;