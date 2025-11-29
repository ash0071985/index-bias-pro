export interface BhavCopyRow {
  SYMBOL: string;
  INSTRUMENT: string;
  OPTION_TYP: 'CE' | 'PE';
  STRIKE_PR: number;
  EXPIRY_DT: string;
  OPEN: number;
  HIGH: number;
  LOW: number;
  CLOSE: number;
  SETTLE_PR: number;
  OPEN_INT: number;
  CHG_IN_OI: number;
}

export interface SupportResistanceZone {
  strike: number;
  oi: number;
  chg: number;
  strength: 'Strong' | 'Moderate' | 'Weak';
}

export interface PremiumLevel {
  strike: number;
  ce_close: number;
  ce_high: number;
  ce_low: number;
  pe_close: number;
  pe_high: number;
  pe_low: number;
}

export type TrendBias = 'Bullish' | 'Bearish' | 'Sideways';

export interface IndexAnalysis {
  index: string;
  spot_close: number;
  expiry: string;
  atm: number;
  pcr: number;
  bias: TrendBias;
  support_zones: SupportResistanceZone[];
  resistance_zones: SupportResistanceZone[];
  premium_table: PremiumLevel[];
  strategy?: string;
}

export type IndexName = 'BANKNIFTY' | 'NIFTY' | 'SENSEX' | 'MIDCPNIFTY' | 'FINNIFTY';
