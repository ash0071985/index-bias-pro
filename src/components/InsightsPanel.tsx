import { IndexAnalysis } from '@/types/options';
import { Card } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface InsightsPanelProps {
  analysis: IndexAnalysis;
}

export const InsightsPanel = ({ analysis }: InsightsPanelProps) => {
  const getInsights = () => {
    const insights: Array<{ type: 'info' | 'bullish' | 'bearish'; text: string }> = [];

    // PCR insights
    if (analysis.pcr > 1.5) {
      insights.push({
        type: 'bullish',
        text: `Extremely high PCR (${analysis.pcr.toFixed(2)}) indicates heavy put accumulation - strong bullish sentiment`
      });
    } else if (analysis.pcr > 1.3) {
      insights.push({
        type: 'bullish',
        text: `High PCR (${analysis.pcr.toFixed(2)}) suggests put interest dominance - moderately bullish`
      });
    } else if (analysis.pcr < 0.5) {
      insights.push({
        type: 'bearish',
        text: `Very low PCR (${analysis.pcr.toFixed(2)}) shows call dominance - strong bearish sentiment`
      });
    } else if (analysis.pcr < 0.7) {
      insights.push({
        type: 'bearish',
        text: `Low PCR (${analysis.pcr.toFixed(2)}) indicates more call interest - moderately bearish`
      });
    } else {
      insights.push({
        type: 'info',
        text: `Balanced PCR (${analysis.pcr.toFixed(2)}) suggests neutral market sentiment`
      });
    }

    // OI build-up insights
    const strongSupports = analysis.support_zones.filter(z => z.strength === 'Strong').length;
    const strongResistances = analysis.resistance_zones.filter(z => z.strength === 'Strong').length;

    if (strongSupports > strongResistances) {
      insights.push({
        type: 'bullish',
        text: `${strongSupports} strong support levels vs ${strongResistances} resistance - bullish base forming`
      });
    } else if (strongResistances > strongSupports) {
      insights.push({
        type: 'bearish',
        text: `${strongResistances} strong resistance levels vs ${strongSupports} support - bearish cap forming`
      });
    }

    // Price position insight
    const nearestSupport = analysis.support_zones[0];
    const nearestResistance = analysis.resistance_zones[0];
    
    if (nearestSupport && nearestResistance) {
      const supportDistance = Math.abs(analysis.spot_close - nearestSupport.strike);
      const resistanceDistance = Math.abs(analysis.spot_close - nearestResistance.strike);
      
      insights.push({
        type: 'info',
        text: `Price is ${supportDistance.toFixed(0)} points from key support (${nearestSupport.strike}) and ${resistanceDistance.toFixed(0)} points from resistance (${nearestResistance.strike})`
      });
    }

    // Strategy insight
    insights.push({
      type: 'info',
      text: `Recommended: ${analysis.strategy} - Consider risk-reward before execution`
    });

    return insights;
  };

  const insights = getInsights();

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Market Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-lg border-l-4 ${
              insight.type === 'bullish' 
                ? 'bg-bullish/5 border-bullish' 
                : insight.type === 'bearish'
                ? 'bg-bearish/5 border-bearish'
                : 'bg-primary/5 border-primary'
            }`}
          >
            <div className="flex items-start gap-3">
              {insight.type === 'bullish' ? (
                <TrendingUp className="w-5 h-5 text-bullish mt-0.5" />
              ) : insight.type === 'bearish' ? (
                <TrendingDown className="w-5 h-5 text-bearish mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-primary mt-0.5" />
              )}
              <p className="text-sm text-foreground flex-1">{insight.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> This analysis is for educational purposes only. 
          Always perform your own due diligence and manage risk appropriately before trading.
        </p>
      </div>
    </Card>
  );
};
