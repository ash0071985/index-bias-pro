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
  // New fields for enhanced analysis
  underlying_high?: number;
  underlying_low?: number;
  underlying_close?: number;
  synthetic_pivot?: number;
  otm_pe_strike?: number;
  otm_ce_strike?: number;
  lot_size?: number;
  gap_prediction?: 'Gap Up' | 'Gap Down' | 'Neutral';
  gap_confidence?: 'Low' | 'Medium' | 'High';
}

export type IndexName = 'BANKNIFTY' | 'NIFTY' | 'SENSEX' | 'MIDCPNIFTY' | 'FINNIFTY';
