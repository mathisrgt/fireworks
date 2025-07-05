"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronRight, CheckCircle } from "lucide-react";
import Image from "next/image";

// Demo data
const demoPortfolio = {
  totalValue: 100806.17,
  interestEarned: 943.46,
};
const demoAssets = [
  { symbol: "USDC", name: "USD Coin", amount: 68682.65, apy: 5.1, iconUrl: "/tokens/usdc.svg" },
  { symbol: "USDS", name: "Stable USD", amount: 32123.27, apy: 7.25, iconUrl: "/tokens/usds.svg" },
];

const FAKE_PROTOCOLS = [
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
    id: 'aave',
    name: 'Aave',
    logoUrl: '/protocols/aave.svg',
    asset: 'DAI',
    apy: 4.85,
    description: 'Battle-tested DeFi money market on Ethereum.',
    tvl: 9_900_000_000,
    lastOptimized: '2025-07-05T13:00:00Z',
    link: 'https://aave.com/',
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
    id: 'morpho',
    name: 'Morpho Blue',
    logoUrl: '/protocols/morpho.svg',
    asset: 'DAI',
    apy: 6.87,
    description: 'Peer-to-peer lending aggregator for Aave/Compound.',
    tvl: 550_000_000,
    lastOptimized: '2025-07-05T13:00:00Z',
    link: 'https://blue.morpho.org/',
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

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  // Simple static for demo; replace with animation lib for real
  return <span>{value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

function LiveRates() {
  return (
    <section className="w-full mt-4">
      <h2 className="text-lg font-semibold mb-2 text-foreground">Live Rates</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {FAKE_PROTOCOLS.map((protocol) => (
          <div
            key={protocol.id}
            className="min-w-[120px] max-w-[140px] bg-card border border-border rounded-xl flex flex-col items-center px-3 py-2 shadow-sm"
            title={protocol.description}
          >
            <div className="w-8 h-8 mb-1 flex items-center justify-center">
              <Image
                src={protocol.logoUrl}
                alt={protocol.name + ' logo'}
                width={32}
                height={32}
                className="object-contain"
                onError={(e) => {
                  // fallback to a generic icon if logo is missing
                  (e.target as HTMLImageElement).src = '/protocols/firework.svg';
                }}
              />
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center truncate w-full">
              {protocol.name}
            </div>
            <div className="text-[10px] text-muted-foreground mb-1">{protocol.asset}</div>
            <div className="text-lg font-bold text-brand-pink leading-none">
              {protocol.apy}%
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AssetsPage() {
  // Demo: always verified
  const isWorldIdVerified = true;
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDC");

  return (
    <div className="min-h-screen bg-background pb-24 px-2 max-w-md mx-auto">
      {/* Portfolio Overview */}
      <div className="flex gap-2 mt-6 mb-4">
        <Card className="flex-1 bg-[#18122B] p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white">
            $<AnimatedNumber value={demoPortfolio.totalValue} />
          </div>
          <div className="text-xs text-zinc-400 mt-1">Total Value</div>
        </Card>
        <Card className="flex-1 bg-[#18122B] p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white">
            $<AnimatedNumber value={demoPortfolio.interestEarned} />
          </div>
          <div className="text-xs text-zinc-400 mt-1">Interest Earned</div>
        </Card>
      </div>

      {/* Deposit/Withdraw Buttons */}
      <div className="flex gap-4 mb-4">
        <Button
          className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-full py-3 text-base font-semibold shadow-none"
          onClick={() => setShowDeposit(true)}
        >
          Deposit
        </Button>
        <Button
          className="flex-1 bg-[#3A2C5A] hover:bg-[#4B3573] text-white rounded-full py-3 text-base font-semibold shadow-none"
          onClick={() => setShowWithdraw(true)}
        >
          Withdraw
        </Button>
      </div>

      {/* World ID Boost Section */}
      <div className="flex items-center gap-2 mb-4 bg-[#18122B] rounded-xl px-4 py-3">
        <span className="text-white text-sm font-medium">World ID Boost</span>
        {isWorldIdVerified && (
          <Badge className="bg-green-600 text-white ml-2 flex items-center gap-1">
            <CheckCircle className="h-4 w-4 mr-1" /> Verified
          </Badge>
        )}
      </div>

      {/* Live Rates Section */}
      <LiveRates />

      {/* Assets Section */}
      <div className="mb-4">
        <div className="text-white font-semibold mb-2">Your Assets</div>
        <div className="space-y-3">
          {demoAssets.map((a, i) => (
            <Card key={i} className="flex items-center justify-between bg-[#18122B] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Image 
                    src={a.iconUrl} 
                    alt={a.symbol} 
                    width={28} 
                    height={28}
                    className="object-contain"
                    onError={(e) => {
                      // fallback to a generic icon if token icon is missing
                      (e.target as HTMLImageElement).src = '/protocols/firework.svg';
                    }}
                  />
                </div>
                <div>
                  <div className="text-white font-bold text-base">{a.symbol}</div>
                  <div className="text-xs text-zinc-400">{a.amount.toLocaleString()} {a.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold text-base">{a.apy}%</div>
                <div className="text-xs text-zinc-400">Live APY</div>
              </div>
              <ChevronRight className="text-zinc-500 ml-2" />
            </Card>
          ))}
        </div>
      </div>

      {/* Deposit Modal */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="bg-[#18122B] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Deposit</DialogTitle>
          </DialogHeader>
          <div className="mb-2 text-zinc-400 text-sm">Deposit your stablecoins and let Firework explode your bag</div>
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                placeholder="Amount"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="bg-zinc-800 text-white border-none focus:ring-pink-500"
              />
              <select
                value={selectedToken}
                onChange={e => setSelectedToken(e.target.value)}
                className="bg-zinc-800 text-white rounded px-2"
              >
                <option value="USDC">USDC</option>
                <option value="USDS">USDS</option>
              </select>
            </div>
            <div className="text-xs text-zinc-400 mb-2">Current APY: <span className="text-green-400 font-semibold">{selectedToken === "USDC" ? "5.10%" : "7.25%"}</span></div>
            {isWorldIdVerified && (
              <Badge className="bg-green-600 text-white flex items-center gap-1 mb-2">
                <CheckCircle className="h-4 w-4 mr-1" /> World ID Verified (Boost APY!)
              </Badge>
            )}
          </div>
          <DialogFooter>
            <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full w-full" onClick={() => setShowDeposit(false)}>
              Confirm Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="bg-[#18122B] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Withdraw</DialogTitle>
          </DialogHeader>
          <div className="mb-2 text-zinc-400 text-sm">Withdraw your stablecoins</div>
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                placeholder="Amount"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="bg-zinc-800 text-white border-none focus:ring-pink-500"
              />
              <select
                value={selectedToken}
                onChange={e => setSelectedToken(e.target.value)}
                className="bg-zinc-800 text-white rounded px-2"
              >
                <option value="USDC">USDC</option>
                <option value="USDS">USDS</option>
              </select>
            </div>
            <div className="text-xs text-zinc-400 mb-2">Withdrawable: <span className="text-white font-semibold">$0.00</span></div>
          </div>
          <DialogFooter>
            <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full w-full" onClick={() => setShowWithdraw(false)}>
              Confirm Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 