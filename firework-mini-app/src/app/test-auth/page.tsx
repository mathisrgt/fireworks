"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function TestAuthPage() {
  const handleSignIn = async () => {
    // TODO: Add sign-in logic here (simulate or real)
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
        className="px-8 py-2 text-base font-semibold rounded-md bg-pink-500 hover:bg-pink-600 text-white shadow transition-all duration-200"
        style={{ minWidth: 120 }}
      >
        Sign in
      </Button>
    </div>
  );
} 