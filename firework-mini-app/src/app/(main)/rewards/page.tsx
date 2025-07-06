import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Star, Trophy, TrendingUp, ArrowRight } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
        <p className="text-muted-foreground">Earn rewards for your activity</p>
      </div>

      {/* Total Rewards Card */}
      <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Total Rewards Earned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">$0.00</div>
          <p className="text-sm text-muted-foreground">Start earning by depositing assets</p>
        </CardContent>
      </Card>

      {/* Rewards Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Rewards Breakdown</h2>
        
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-yellow-500" />
                Yield Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$0.00</div>
              <p className="text-sm text-muted-foreground">Earned from stablecoin deposits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-orange-500" />
                Bonus Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$0.00</div>
              <p className="text-sm text-muted-foreground">Special promotions and bonuses</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Available Rewards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Rewards</h2>
        
        {/* Empty State */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No rewards available</h3>
              <p className="text-muted-foreground">
                Start depositing assets to unlock rewards
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How to Earn */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">How to Earn</h2>
        
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Deposit Stablecoins</p>
                  <p className="text-sm text-muted-foreground">Earn yield on your deposits</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Refer Friends</p>
                  <p className="text-sm text-muted-foreground">Earn bonuses for referrals</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 