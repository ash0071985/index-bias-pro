import { Card } from '@/components/ui/card';
import { SyntheticPivotData } from '@/lib/syntheticAnalysis';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface SyntheticPivotCardProps {
  spData: SyntheticPivotData;
  atm: number;
  otmPeStrike: number;
  otmCeStrike: number;
}

export function SyntheticPivotCard({ spData, atm, otmPeStrike, otmCeStrike }: SyntheticPivotCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Synthetic Pivot Analysis</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Synthetic Pivot */}
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Synthetic Pivot (SP)</p>
          <p className="text-3xl font-bold text-primary">{spData.syntheticPivot.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            (OTM PE + OTM CE) / 2
          </p>
        </div>

        {/* ATM Premiums */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">ATM Strike: {atm}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">CE</span>
              </div>
              <p className="text-sm font-semibold text-foreground">H: {spData.atmCeHigh.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">C: {spData.atmCeClose.toFixed(2)}</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-xs text-muted-foreground">PE</span>
              </div>
              <p className="text-sm font-semibold text-foreground">H: {spData.atmPeHigh.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">C: {spData.atmPeClose.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* OTM Premiums */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">OTM Strikes</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-red-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-xs text-muted-foreground">PE {otmPeStrike}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">H: {spData.otmPeHigh.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">C: {spData.otmPeClose.toFixed(2)}</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">CE {otmCeStrike}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">H: {spData.otmCeHigh.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">C: {spData.otmCeClose.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
