"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import LiveRatesDisplay from "@/components/LiveRatesDisplay";
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput, ResponseEvent, MiniAppPaymentPayload } from '@worldcoin/minikit-js';

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

// LiveRates component is now replaced by LiveRatesDisplay component

export default function AssetsPage() {
  // Demo: always verified
  const isWorldIdVerified = true;
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Firework vault address for deposits
  const FIREWORK_VAULT_ADDRESS = "0x2457537EE691e74b16D672AbF0FFC322c01557c3";

  // Initialize MiniKit payment listener
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      console.log("MiniKit is not installed");
      return;
    }

    const handlePaymentResponse = async (response: MiniAppPaymentPayload) => {
      if (response.status === "success") {
        try {
          const res = await fetch(`/api/confirm-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: response }),
          });
          const payment = await res.json();
          if (payment.success) {
            setPaymentSuccess(true);
            setPaymentError(null);
            // Close modal after successful payment
            setTimeout(() => {
              setShowDeposit(false);
              setPaymentSuccess(false);
              setDepositAmount("");
            }, 2000);
          } else {
            setPaymentError("Payment verification failed");
          }
        } catch (error) {
          console.error("Error confirming payment:", error);
          setPaymentError("Failed to confirm payment");
        }
      } else {
        setPaymentError("Payment was cancelled or failed");
      }
      setIsProcessingPayment(false);
    };

    MiniKit.subscribe(ResponseEvent.MiniAppPayment, handlePaymentResponse);

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppPayment);
    };
  }, []);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setPaymentError("Please enter a valid amount");
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentSuccess(false);

    try {
      // 1. Initiate payment to get reference ID
      const res = await fetch('/api/initiate-payment', {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Failed to initiate payment');
      }
      
      const { id } = await res.json();

      // 2. Prepare payment payload
      const payload: PayCommandInput = {
        reference: id,
        to: FIREWORK_VAULT_ADDRESS,
        tokens: [
          {
            symbol: selectedToken === "USDC" ? Tokens.USDC : Tokens.WLD, // Fallback to WLD if not USDC
            token_amount: tokenToDecimals(parseFloat(depositAmount), selectedToken === "USDC" ? Tokens.USDC : Tokens.WLD).toString(),
          },
        ],
        description: `Deposit ${depositAmount} ${selectedToken} to Firework vault`,
      };

      // 3. Send payment command
      if (!MiniKit.isInstalled()) {
        setPaymentError("World App is not available");
        setIsProcessingPayment(false);
        return;
      }

      const { finalPayload } = await MiniKit.commandsAsync.pay(payload);

      if (finalPayload.status === 'success') {
        // Payment was successful, the listener will handle the confirmation
        console.log("Payment sent successfully");
      } else {
        setPaymentError("Payment was cancelled or failed");
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error("Error sending payment:", error);
      setPaymentError("Failed to send payment");
      setIsProcessingPayment(false);
    }
  };

  const resetDepositForm = () => {
    setDepositAmount("");
    setPaymentError(null);
    setPaymentSuccess(false);
    setIsProcessingPayment(false);
  };

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
      <LiveRatesDisplay />

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
      <Dialog open={showDeposit} onOpenChange={(open) => {
        if (!open) {
          resetDepositForm();
        }
        setShowDeposit(open);
      }}>
        <DialogContent className="bg-[#18122B] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Deposit</DialogTitle>
          </DialogHeader>
          <div className="mb-2 text-zinc-400 text-sm">Deposit your stablecoins and let Firework explode your bag</div>
          
          {paymentSuccess && (
            <div className="mb-4 p-3 bg-green-600/20 border border-green-600/30 rounded-lg">
              <div className="text-green-400 text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Payment successful! Your deposit is being processed.
              </div>
            </div>
          )}

          {paymentError && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg">
              <div className="text-red-400 text-sm font-medium">
                {paymentError}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                placeholder="Amount"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="bg-zinc-800 text-white border-none focus:ring-pink-500"
                disabled={isProcessingPayment}
              />
              <select
                value={selectedToken}
                onChange={e => setSelectedToken(e.target.value)}
                className="bg-zinc-800 text-white rounded px-2"
                disabled={isProcessingPayment}
              >
                <option value="USDC">USDC</option>
                <option value="WLD">WLD</option>
              </select>
            </div>
            <div className="text-xs text-zinc-400 mb-2">Current APY: <span className="text-green-400 font-semibold">{selectedToken === "USDC" ? "5.10%" : "3.12%"}</span></div>
            {isWorldIdVerified && (
              <Badge className="bg-green-600 text-white flex items-center gap-1 mb-2">
                <CheckCircle className="h-4 w-4 mr-1" /> World ID Verified (Boost APY!)
              </Badge>
            )}
            <div className="text-xs text-zinc-400">
              Vault Address: <span className="text-white font-mono text-xs">{FIREWORK_VAULT_ADDRESS}</span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-full w-full" 
              onClick={handleDeposit}
              disabled={isProcessingPayment || !depositAmount || parseFloat(depositAmount) <= 0}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Deposit'
              )}
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