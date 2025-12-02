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
