import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Clock } from 'lucide-react';
import { useYieldRates, ProtocolRate } from '@/hooks/useYieldRates';

interface LiveRatesDisplayProps {
    className?: string;
}

const LiveRatesDisplay: React.FC<LiveRatesDisplayProps> = ({ className = '' }) => {
    const { protocols, loading, error, requestYieldRates, refreshRates } = useYieldRates();

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const formatAPY = (apy: number) => {
        return apy.toFixed(2);
    };

    return (
        <section className={`w-full mt-4 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-pink" />
                    Live Rates
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshRates}
                        disabled={loading}
                        className="h-8 px-2"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={requestYieldRates}
                        disabled={loading}
                        className="h-8 px-3 text-xs"
                    >
                        {loading ? 'Fetching...' : 'Fetch Live'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {protocols.map((protocol) => (
                    <div
                        key={protocol.id}
                        className={`min-w-[120px] max-w-[140px] bg-card border rounded-xl flex flex-col items-center px-3 py-2 shadow-sm transition-all duration-200 ${
                            protocol.isLive 
                                ? 'border-brand-pink/30 bg-gradient-to-br from-brand-pink/5 to-transparent' 
                                : 'border-border'
                        }`}
                        title={protocol.description}
                    >
                        <div className="w-8 h-8 mb-1 flex items-center justify-center relative">
                            <Image
                                src={protocol.logoUrl}
                                alt={protocol.name + ' logo'}
                                width={32}
                                height={32}
                                className="object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/protocols/firework.svg';
                                }}
                            />
                            {protocol.isLive && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                            )}
                        </div>
                        
                        <div className="text-xs font-medium text-muted-foreground text-center truncate w-full">
                            {protocol.name}
                        </div>
                        
                        <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                            {protocol.asset}
                            {protocol.isLive && (
                                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3 bg-green-100 text-green-700 border-green-200">
                                    LIVE
                                </Badge>
                            )}
                        </div>
                        
                        <div className={`text-lg font-bold leading-none ${
                            protocol.isLive ? 'text-brand-pink' : 'text-foreground'
                        }`}>
                            {formatAPY(protocol.apy)}%
                        </div>
                        
                        <div className="text-[8px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-2 h-2" />
                            {formatTimestamp(protocol.lastOptimized)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info section */}
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-brand-pink rounded-full mt-1.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Aave & Morpho</span> rates are fetched live via LayerZero LZRead. 
                        Other protocols show cached rates. 
                        <span className="text-brand-pink font-medium"> Green dots</span> indicate live data.
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LiveRatesDisplay; 