"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MiniKit, WalletAuthInput } from '@worldcoin/minikit-js';
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMiniKitReady, setIsMiniKitReady] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // Check if MiniKit is installed and ready
    const checkMiniKit = () => {
      if (MiniKit.isInstalled()) {
        setIsMiniKitReady(true);
      } else {
        // Check again after a short delay
        setTimeout(checkMiniKit, 100);
      }
    };
    
    checkMiniKit();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if MiniKit is available
      if (!MiniKit.isInstalled()) {
        setError("World App is required to sign in. Please open this app in World App.");
        setIsLoading(false);
        return;
      }

      // Get nonce from backend
      const nonceResponse = await fetch('/api/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }
      const { nonce } = await nonceResponse.json();

      // Use the proper walletAuth command structure from the documentation
      const { commandPayload: generateMessageResult, finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: '0', // Optional
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: 'Sign in to Firework Mini App - Your DeFi companion',
      });

      if (finalPayload.status === 'error') {
        throw new Error('Authentication was cancelled or failed');
      }

      // Verify the authentication with backend
      const verifyResponse = await fetch('/api/complete-siwe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        // Update auth context with the wallet address
        login(finalPayload.address);
        // Authentication successful - redirect to assets page
        router.push('/assets');
      } else {
        throw new Error(verifyResult.error || 'Authentication verification failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <Image
        src="/logo.png"
        alt="Firework Logo"
        width={120}
        height={120}
        className="mb-6"
        priority
      />
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
        Firework
      </h1>
      {/* Subline */}
      <p className="text-muted-foreground text-center mb-8 text-lg">
        Your stablecoin yield, always at its best
      </p>
      
      {/* Sign in Button */}
      <Button
        onClick={handleSignIn}
        disabled={isLoading || !isMiniKitReady}
        className="px-8 py-2 text-base font-semibold rounded-md bg-pink-500 hover:bg-pink-600 text-white shadow transition-all duration-200"
        style={{ minWidth: 120 }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Signing in...
          </div>
        ) : (
          "Sign in"
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-w-sm">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Loading Message */}
      {!isMiniKitReady && (
        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 max-w-sm">
          <p className="text-blue-400 text-sm text-center">Initializing World ID...</p>
        </div>
      )}
    </div>
  );
} 