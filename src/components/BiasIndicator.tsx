import { TrendBias } from '@/types/options';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BiasIndicatorProps {
  bias: TrendBias;
  size?: 'sm' | 'md' | 'lg';
}

export const BiasIndicator = ({ bias, size = 'md' }: BiasIndicatorProps) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const getBiasStyles = () => {
    switch (bias) {
      case 'Bullish':
        return 'bg-bullish/10 text-bullish border-bullish/20';
      case 'Bearish':
        return 'bg-bearish/10 text-bearish border-bearish/20';
      case 'Sideways':
        return 'bg-sideways/10 text-sideways border-sideways/20';
    }
  };

  const getBiasIcon = () => {
    const iconSize = iconSizes[size];
    switch (bias) {
      case 'Bullish':
        return <TrendingUp size={iconSize} />;
      case 'Bearish':
        return <TrendingDown size={iconSize} />;
      case 'Sideways':
        return <Minus size={iconSize} />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClasses[size]} ${getBiasStyles()}`}>
      {getBiasIcon()}
      {bias}
    </div>
  );
};
