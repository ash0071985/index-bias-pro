import { BhavCopyRow } from '@/types/options';

export function validateBhavCopyData(data: BhavCopyRow[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  const requiredFields = ['SYMBOL', 'INSTRUMENT', 'OPTION_TYP', 'STRIKE_PR', 'OPEN_INT', 'EXPIRY_DT'];
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));

  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    return { isValid: false, errors, warnings };
  }

  // Check for OPTIDX instruments
  const optionData = data.filter(row => row.INSTRUMENT === 'OPTIDX');
  if (optionData.length === 0) {
    errors.push('No option chain data (OPTIDX) found in the file');
    return { isValid: false, errors, warnings };
  }

  // Check for valid option types
  const invalidTypes = optionData.filter(row => row.OPTION_TYP !== 'CE' && row.OPTION_TYP !== 'PE');
  if (invalidTypes.length > 0) {
    warnings.push(`Found ${invalidTypes.length} rows with invalid option types`);
  }

  // Check for valid symbols
  const validIndices = ['BANKNIFTY', 'NIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];
  const uniqueSymbols = [...new Set(optionData.map(row => row.SYMBOL))];
  const detectedIndices = uniqueSymbols.filter(symbol => validIndices.includes(symbol));

  if (detectedIndices.length === 0) {
    warnings.push('No recognized indices found. Available: BANKNIFTY, NIFTY, FINNIFTY, MIDCPNIFTY, SENSEX');
  }

  // Check for numeric validity
  const invalidNumeric = optionData.filter(row => 
    isNaN(row.STRIKE_PR) || 
    isNaN(row.OPEN_INT) || 
    row.STRIKE_PR <= 0
  );

  if (invalidNumeric.length > 0) {
    warnings.push(`Found ${invalidNumeric.length} rows with invalid numeric values`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function getDetectedIndices(data: BhavCopyRow[]): string[] {
  const validIndices = ['BANKNIFTY', 'NIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];
  const optionData = data.filter(row => row.INSTRUMENT === 'OPTIDX');
  const uniqueSymbols = [...new Set(optionData.map(row => row.SYMBOL))];
  return uniqueSymbols.filter(symbol => validIndices.includes(symbol));
}

export function getExpiryDate(data: BhavCopyRow[], index: string): string {
  const indexData = data.filter(row => 
    row.SYMBOL === index && 
    row.INSTRUMENT === 'OPTIDX'
  );
  
  if (indexData.length === 0) return '';
  
  // Get the nearest expiry
  const expiries = [...new Set(indexData.map(row => row.EXPIRY_DT))].sort();
  return expiries[0] || '';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Handle DD-MMM-YYYY format (e.g., "28-NOV-2025")
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const monthMap: { [key: string]: string } = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      const monthNum = monthMap[month.toUpperCase()];
      if (monthNum) {
        return `${day}-${month}-${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
