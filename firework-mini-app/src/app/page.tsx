"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      // If authenticated, redirect to assets page
      router.push("/assets");
    } else {
      // If not authenticated, redirect to auth page
      router.push("/auth");
    }
  }, [isAuthenticated, router]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
        </div>
    </div>
  );
}
