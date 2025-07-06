import { useState, useEffect, useCallback } from 'react';

// Contract ABI for yield rate reader
const YIELD_READER_ABI = [
    "function readYieldRates(bytes calldata _extraOptions) external payable returns (tuple(bytes32 guid, uint64 nonce, MessagingFee fee))",
    "function quoteReadFee(bytes calldata _extraOptions) external view returns (tuple(uint256 nativeFee, uint256 lzTokenFee))",
    "function getCurrentRates() external view returns (uint256 aaveRate, uint256 morphoRate, uint256 timestamp)",
    "event YieldRatesReceived(uint256 aaveRate, uint256 morphoRate, uint256 timestamp)"
];

// For demo purposes, we'll use a mock contract address
// In production, this would be your deployed contract address
const YIELD_READER_ADDRESS = "0x0000000000000000000000000000000000000000"; // Placeholder

export interface YieldRates {
    aaveRate: number;
    morphoRate: number;
    timestamp: number;
    isLoading?: boolean;
}

export interface ProtocolRate {
    id: string;
    name: string;
    logoUrl: string;
    asset: string;
    apy: number;
    description: string;
    tvl: number;
    lastOptimized: string;
    link: string;
    isLive?: boolean;
}

// Mock data for protocols that don't have LayerZero integration yet
const MOCK_PROTOCOLS: ProtocolRate[] = [
    {
        id: 'aave',
        name: 'Aave',
        logoUrl: '/protocols/aave.svg',
        asset: 'USDC',
        apy: 4.85,
        description: 'Battle-tested DeFi money market on Ethereum.',
        tvl: 9_900_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://aave.com/',
        isLive: true,
    },
    {
        id: 'morpho',
        name: 'Morpho Blue',
        logoUrl: '/protocols/morpho.svg',
        asset: 'USDC',
        apy: 6.87,
        description: 'Peer-to-peer lending aggregator for Aave/Compound.',
        tvl: 550_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://blue.morpho.org/',
        isLive: true,
    },
    {
        id: 'stargate',
        name: 'Stargate',
        logoUrl: '/protocols/stargate.svg',
        asset: 'USDC',
        apy: 7.42,
        description: 'Cross-chain stablecoin bridge and yield optimizer.',
        tvl: 150_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://stargate.finance/',
    },
    {
        id: 'curve',
        name: 'Curve',
        logoUrl: '/protocols/curve.svg',
        asset: 'USDT',
        apy: 6.21,
        description: 'Efficient stablecoin AMM with boosted APY.',
        tvl: 5_800_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://curve.fi/',
    },
    {
        id: 'venus',
        name: 'Venus',
        logoUrl: '/protocols/venus.svg',
        asset: 'USDC',
        apy: 5.9,
        description: 'Lending and borrowing protocol for Binance Smart Chain.',
        tvl: 700_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://venus.io/',
    },
    {
        id: 'radiant',
        name: 'Radiant',
        logoUrl: '/protocols/radiant.svg',
        asset: 'USDT',
        apy: 8.08,
        description: 'Omnichain money market protocol on LayerZero.',
        tvl: 400_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://radiant.capital/',
    },
    {
        id: 'pendle',
        name: 'Pendle',
        logoUrl: '/protocols/pendle.svg',
        asset: 'USDe',
        apy: 9.15,
        description: 'Tokenized yield protocol for pro DeFi users.',
        tvl: 280_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://app.pendle.finance/',
    },
    {
        id: 'spark',
        name: 'Spark Protocol',
        logoUrl: '/protocols/spark.svg',
        asset: 'DAI',
        apy: 5.25,
        description: "MakerDAO's DeFi yield market for DAI.",
        tvl: 900_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: 'https://app.sparkprotocol.io/',
    },
    {
        id: 'native',
        name: 'Native (Default)',
        logoUrl: '/protocols/firework.svg',
        asset: 'USDC',
        apy: 3.12,
        description: "Firework's own optimized vault for stable yield.",
        tvl: 100_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: '#',
    },
    {
        id: 'apegrow',
        name: 'ApeGrow',
        logoUrl: '/protocols/apegrow.svg',
        asset: 'USDT',
        apy: 11.8,
        description: 'Super-degen apes pool – max yield, max fun',
        tvl: 1_000_000,
        lastOptimized: '2025-07-05T13:00:00Z',
        link: '#',
    },
];

export const useYieldRates = () => {
    const [yieldRates, setYieldRates] = useState<YieldRates | null>(null);
    const [protocols, setProtocols] = useState<ProtocolRate[]>(MOCK_PROTOCOLS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Convert ray (27 decimals) to percentage for Aave rates
    const rayToPercentage = (ray: number): number => {
        return (ray / 1e27) * 100;
    };

    // Convert basis points to percentage
    const basisPointsToPercentage = (bps: number): number => {
        return bps / 100;
    };

    // Get current rates from contract (mock implementation)
    const getCurrentRates = useCallback(async () => {
        try {
            // Mock data for demo - in production this would call the contract
            const mockRates: YieldRates = {
                aaveRate: 4.85, // Mock Aave USDC rate
                morphoRate: 6.87, // Mock Morpho USDC rate
                timestamp: Math.floor(Date.now() / 1000),
            };
            
            setYieldRates(mockRates);
            
            // Update protocols with live data
            const updatedProtocols = protocols.map(protocol => {
                if (protocol.id === 'aave') {
                    return {
                        ...protocol,
                        apy: mockRates.aaveRate,
                        isLive: true,
                        lastOptimized: new Date().toISOString(),
                    };
                }
                if (protocol.id === 'morpho') {
                    return {
                        ...protocol,
                        apy: mockRates.morphoRate,
                        isLive: true,
                        lastOptimized: new Date().toISOString(),
                    };
                }
                return protocol;
            });
            
            setProtocols(updatedProtocols);
        } catch (err) {
            console.error('Error fetching current rates:', err);
            setError('Failed to fetch current rates');
        }
    }, [protocols]);

    // Request fresh yield rates from LayerZero (mock implementation)
    const requestYieldRates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Simulate LayerZero read request delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock fresh data
            const freshRates: YieldRates = {
                aaveRate: 4.85 + (Math.random() - 0.5) * 0.5, // Add some variation
                morphoRate: 6.87 + (Math.random() - 0.5) * 0.5,
                timestamp: Math.floor(Date.now() / 1000),
            };
            
            setYieldRates(freshRates);
            
            // Update protocols with fresh live data
            const updatedProtocols = protocols.map(protocol => {
                if (protocol.id === 'aave') {
                    return {
                        ...protocol,
                        apy: freshRates.aaveRate,
                        isLive: true,
                        lastOptimized: new Date().toISOString(),
                    };
                }
                if (protocol.id === 'morpho') {
                    return {
                        ...protocol,
                        apy: freshRates.morphoRate,
                        isLive: true,
                        lastOptimized: new Date().toISOString(),
                    };
                }
                return protocol;
            });
            
            setProtocols(updatedProtocols);
            setLoading(false);
        } catch (err) {
            console.error('Error requesting yield rates:', err);
            setError('Failed to request yield rates');
            setLoading(false);
        }
    }, [protocols]);

    // Load current rates on mount
    useEffect(() => {
        getCurrentRates();
    }, [getCurrentRates]);

    return {
        yieldRates,
        protocols,
        loading,
        error,
        requestYieldRates,
        refreshRates: getCurrentRates
    };
}; 