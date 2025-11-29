import { IndexAnalysis } from '@/types/options';
import { Card } from '@/components/ui/card';
import { BiasIndicator } from './BiasIndicator';
import { TrendingUp, Target, Activity, Lightbulb } from 'lucide-react';

interface DashboardSummaryProps {
  analysis: IndexAnalysis;
}

export const DashboardSummary = ({ analysis }: DashboardSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Spot Close</p>
            <p className="text-2xl font-bold text-foreground">{analysis.spot_close.toFixed(2)}</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">ATM: {analysis.atm}</p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">PCR</p>
            <p className="text-2xl font-bold text-foreground">{analysis.pcr.toFixed(2)}</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {analysis.pcr > 1.3 ? 'High Put Interest' : analysis.pcr < 0.7 ? 'High Call Interest' : 'Balanced'}
        </p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Trend Bias</p>
            <div className="mt-2">
              <BiasIndicator bias={analysis.bias} size="md" />
            </div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">For next session</p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Strategy</p>
            <p className="text-sm font-semibold text-foreground mt-2">{analysis.strategy}</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Suggested approach</p>
      </Card>
    </div>
  );
};
