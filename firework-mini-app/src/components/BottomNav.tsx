"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/assets",
    label: "Assets",
    icon: Wallet,
  },
  {
    href: "/rewards",
    label: "Rewards", 
    icon: Gift,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const handleNavClick = (href: string, label: string) => {
    console.log(`Navigation clicked: ${label} -> ${href}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          console.log(`Nav item: ${item.label}, href: ${item.href}, isActive: ${isActive}, pathname: ${pathname}`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href, item.label)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 