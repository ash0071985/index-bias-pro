import { BhavCopyRow } from '@/types/options';

export interface OTMStrikes {
  otmPeStrike: number;
  otmCeStrike: number;
}

export interface SyntheticPivotData {
  syntheticPivot: number;
  atmCeClose: number;
  atmCeHigh: number;
  atmPeClose: number;
  atmPeHigh: number;
  otmCeClose: number;
  otmCeHigh: number;
  otmPeClose: number;
  otmPeHigh: number;
}

export interface PremiumRange {
  label: string;
  high: number;
  close: number;
  sp?: number;
}

export interface GapPredictionResult {
  prediction: 'Gap Up' | 'Gap Down' | 'Neutral';
  confidence: 'Low' | 'Medium' | 'High';
  description: string;
}

export function getStrikeInterval(indexName: string): number {
  switch (indexName) {
    case 'BANKNIFTY': return 100;
    case 'NIFTY': return 50;
    case 'FINNIFTY': return 50;
    case 'MIDCPNIFTY': return 25;
    case 'SENSEX': return 100;
    default: return 100;
  }
}

export function getDefaultLotSize(indexName: string): number {
  switch (indexName) {
    case 'BANKNIFTY': return 15;
    case 'NIFTY': return 25;
    case 'FINNIFTY': return 25;
    case 'MIDCPNIFTY': return 50;
    case 'SENSEX': return 10;
    default: return 1;
  }
}

export function computeOTMStrikes(atm: number, strikeInterval: number): OTMStrikes {
  return {
    otmPeStrike: atm - strikeInterval,
    otmCeStrike: atm + strikeInterval,
  };
}

export function computeSyntheticPivot(otmPeClose: number, otmCeClose: number): number {
  return (otmPeClose + otmCeClose) / 2;
}

export function computeSyntheticPivotData(
  data: BhavCopyRow[],
  atm: number,
  strikeInterval: number
): SyntheticPivotData | null {
  const { otmPeStrike, otmCeStrike } = computeOTMStrikes(atm, strikeInterval);
  
  const atmCe = data.find(r => r.STRIKE_PR === atm && r.OPTION_TYP === 'CE');
  const atmPe = data.find(r => r.STRIKE_PR === atm && r.OPTION_TYP === 'PE');
  const otmCe = data.find(r => r.STRIKE_PR === otmCeStrike && r.OPTION_TYP === 'CE');
  const otmPe = data.find(r => r.STRIKE_PR === otmPeStrike && r.OPTION_TYP === 'PE');
  
  if (!atmCe || !atmPe || !otmCe || !otmPe) {
    return null;
  }
  
  const syntheticPivot = computeSyntheticPivot(otmPe.CLOSE, otmCe.CLOSE);
  
  return {
    syntheticPivot,
    atmCeClose: atmCe.CLOSE,
    atmCeHigh: atmCe.HIGH,
    atmPeClose: atmPe.CLOSE,
    atmPeHigh: atmPe.HIGH,
    otmCeClose: otmCe.CLOSE,
    otmCeHigh: otmCe.HIGH,
    otmPeClose: otmPe.CLOSE,
    otmPeHigh: otmPe.HIGH,
  };
}

export function computePremiumRanges(spData: SyntheticPivotData): {
  ceRange: PremiumRange[];
  peRange: PremiumRange[];
} {
  return {
    ceRange: [
      { label: 'ATM CE', high: spData.atmCeHigh, close: spData.atmCeClose, sp: spData.syntheticPivot },
      { label: 'OTM PE', high: spData.otmPeHigh, close: spData.otmPeClose },
    ],
    peRange: [
      { label: 'ATM PE', high: spData.atmPeHigh, close: spData.atmPeClose, sp: spData.syntheticPivot },
      { label: 'OTM CE', high: spData.otmCeHigh, close: spData.otmCeClose },
    ],
  };
}

export function predictGap(pcr: number): GapPredictionResult {
  if (pcr >= 1.3) {
    return {
      prediction: 'Gap Down',
      confidence: 'High',
      description: 'Strong put writing indicates heavy bearish positioning. High probability of gap down opening.',
    };
  } else if (pcr >= 1.1) {
    return {
      prediction: 'Gap Down',
      confidence: 'Medium',
      description: 'Elevated PCR suggests bearish sentiment. Gap down likely.',
    };
  } else if (pcr >= 1.0) {
    return {
      prediction: 'Gap Down',
      confidence: 'Low',
      description: 'Slightly elevated PCR. Small gap down possible.',
    };
  } else if (pcr >= 0.9) {
    return {
      prediction: 'Neutral',
      confidence: 'Medium',
      description: 'PCR near equilibrium. Flat to slightly gap opening expected.',
    };
  } else if (pcr >= 0.7) {
    return {
      prediction: 'Gap Up',
      confidence: 'Medium',
      description: 'Low PCR indicates bullish sentiment. Gap up likely.',
    };
  } else {
    return {
      prediction: 'Gap Up',
      confidence: 'High',
      description: 'Very low PCR shows strong call writing. High probability of gap up opening.',
    };
  }
}
