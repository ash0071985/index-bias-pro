import { BhavCopyRow, IndexAnalysis, SupportResistanceZone, PremiumLevel, TrendBias } from '@/types/options';

export function computeATM(spotClose: number, strikes: number[]): number {
  return strikes.reduce((prev, curr) => 
    Math.abs(curr - spotClose) < Math.abs(prev - spotClose) ? curr : prev
  );
}

export function computePCR(data: BhavCopyRow[]): number {
  const callOI = data
    .filter(row => row.OPTION_TYP === 'CE')
    .reduce((sum, row) => sum + row.OPEN_INT, 0);
  
  const putOI = data
    .filter(row => row.OPTION_TYP === 'PE')
    .reduce((sum, row) => sum + row.OPEN_INT, 0);
  
  return callOI > 0 ? putOI / callOI : 0;
}

export function detectSupportZones(data: BhavCopyRow[], topN: number = 5): SupportResistanceZone[] {
  const putData = data
    .filter(row => row.OPTION_TYP === 'PE')
    .sort((a, b) => b.OPEN_INT - a.OPEN_INT)
    .slice(0, topN);
  
  return putData.map(row => ({
    strike: row.STRIKE_PR,
    oi: row.OPEN_INT,
    chg: row.CHG_IN_OI,
    strength: row.CHG_IN_OI > 0 ? 'Strong' : row.CHG_IN_OI < -50000 ? 'Weak' : 'Moderate'
  }));
}

export function detectResistanceZones(data: BhavCopyRow[], topN: number = 5): SupportResistanceZone[] {
  const callData = data
    .filter(row => row.OPTION_TYP === 'CE')
    .sort((a, b) => b.OPEN_INT - a.OPEN_INT)
    .slice(0, topN);
  
  return callData.map(row => ({
    strike: row.STRIKE_PR,
    oi: row.OPEN_INT,
    chg: row.CHG_IN_OI,
    strength: row.CHG_IN_OI > 0 ? 'Strong' : row.CHG_IN_OI < -50000 ? 'Weak' : 'Moderate'
  }));
}

export function getPremiumLevels(data: BhavCopyRow[], atm: number, range: number = 500): PremiumLevel[] {
  const strikes = [...new Set(data.map(row => row.STRIKE_PR))]
    .filter(strike => Math.abs(strike - atm) <= range)
    .sort((a, b) => a - b);
  
  return strikes.map(strike => {
    const ce = data.find(row => row.STRIKE_PR === strike && row.OPTION_TYP === 'CE');
    const pe = data.find(row => row.STRIKE_PR === strike && row.OPTION_TYP === 'PE');
    
    return {
      strike,
      ce_close: ce?.CLOSE || 0,
      ce_high: ce?.HIGH || 0,
      ce_low: ce?.LOW || 0,
      pe_close: pe?.CLOSE || 0,
      pe_high: pe?.HIGH || 0,
      pe_low: pe?.LOW || 0,
    };
  });
}

export function predictTrend(
  pcr: number,
  supportZones: SupportResistanceZone[],
  resistanceZones: SupportResistanceZone[],
  spotClose: number,
  atm: number
): TrendBias {
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // PCR signals
  if (pcr > 1.3) bullishSignals += 2;
  if (pcr < 0.7) bearishSignals += 2;
  
  // OI build-up signals
  const strongPutWriting = supportZones.filter(z => z.strength === 'Strong').length;
  const strongCallWriting = resistanceZones.filter(z => z.strength === 'Strong').length;
  
  if (strongPutWriting > strongCallWriting) bullishSignals += 1;
  if (strongCallWriting > strongPutWriting) bearishSignals += 1;
  
  // Price position relative to ATM
  if (spotClose > atm) bullishSignals += 1;
  if (spotClose < atm) bearishSignals += 1;
  
  if (bullishSignals > bearishSignals + 1) return 'Bullish';
  if (bearishSignals > bullishSignals + 1) return 'Bearish';
  return 'Sideways';
}

export function suggestStrategy(bias: TrendBias): string {
  switch (bias) {
    case 'Bullish':
      return 'Bull Call Spread / Sell PE';
    case 'Bearish':
      return 'Bear Put Spread / Sell CE';
    case 'Sideways':
      return 'Short Straddle / Iron Fly';
  }
}

export function analyzeIndex(
  indexName: string,
  data: BhavCopyRow[],
  spotClose: number,
  expiry: string
): IndexAnalysis {
  const strikes = [...new Set(data.map(row => row.STRIKE_PR))];
  const atm = computeATM(spotClose, strikes);
  const pcr = computePCR(data);
  
  // Filter working range: ATM ± 1000
  const workingData = data.filter(row => Math.abs(row.STRIKE_PR - atm) <= 1000);
  
  const support_zones = detectSupportZones(workingData);
  const resistance_zones = detectResistanceZones(workingData);
  const premium_table = getPremiumLevels(workingData, atm);
  const bias = predictTrend(pcr, support_zones, resistance_zones, spotClose, atm);
  const strategy = suggestStrategy(bias);
  
  return {
    index: indexName,
    spot_close: spotClose,
    expiry,
    atm,
    pcr,
    bias,
    support_zones,
    resistance_zones,
    premium_table,
    strategy,
  };
}
