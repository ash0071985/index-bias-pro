import { Card } from '@/components/ui/card';
import { GapPredictionResult } from '@/lib/syntheticAnalysis';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GapPredictionProps {
  pcr: number;
  prediction: GapPredictionResult;
}

export function GapPrediction({ pcr, prediction }: GapPredictionProps) {
  const getIcon = () => {
    switch (prediction.prediction) {
      case 'Gap Up':
        return <TrendingUp className="w-8 h-8 text-green-500" />;
      case 'Gap Down':
        return <TrendingDown className="w-8 h-8 text-red-500" />;
      default:
        return <Minus className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getPredictionColor = () => {
    switch (prediction.prediction) {
      case 'Gap Up':
        return 'text-green-500';
      case 'Gap Down':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getConfidenceBg = () => {
    switch (prediction.confidence) {
      case 'High':
        return 'bg-primary/20';
      case 'Medium':
        return 'bg-primary/10';
      default:
        return 'bg-muted';
    }
  };

  // PCR gauge position (0.5 to 1.5 range mapped to 0-100%)
  const pcrPosition = Math.min(Math.max((pcr - 0.5) / 1.0 * 100, 0), 100);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Gap Prediction</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PCR Gauge */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Put-Call Ratio</p>
          <div className="relative">
            <div className="h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
            <div 
              className="absolute top-0 w-1 h-6 bg-foreground rounded-full transform -translate-x-1/2 -translate-y-1"
              style={{ left: `${pcrPosition}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5 (Bullish)</span>
            <span>1.0</span>
            <span>1.5 (Bearish)</span>
          </div>
          <p className="text-center text-2xl font-bold text-foreground">{pcr.toFixed(3)}</p>
        </div>

        {/* Prediction */}
        <div className={cn("rounded-lg p-4 text-center", getConfidenceBg())}>
          <div className="flex justify-center mb-2">
            {getIcon()}
          </div>
          <p className={cn("text-2xl font-bold", getPredictionColor())}>
            {prediction.prediction}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Confidence: <span className="font-medium">{prediction.confidence}</span>
          </p>
        </div>

        {/* Description */}
        <div className="flex items-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {prediction.description}
          </p>
        </div>
      </div>

      {/* PCR Interpretation Guide */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>PCR Interpretation:</strong> PCR &gt; 1.0 suggests bearish sentiment (more put writing), 
          PCR &lt; 1.0 suggests bullish sentiment (more call writing). Extreme values indicate stronger conviction.
        </p>
      </div>
    </Card>
  );
}
