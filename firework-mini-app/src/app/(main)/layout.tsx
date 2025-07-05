import { BottomNav } from "@/components/BottomNav";
import { LogoutButton } from "@/components/LogoutButton";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logout button */}
      <header className="flex justify-end p-4">
        <LogoutButton />
      </header>
      
      {/* Main content area */}
      <main className="flex-1 pb-20">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
} 