import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IndexAnalysis } from '@/types/options';

export function generatePDFReport(analysis: IndexAnalysis) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Options Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Index:', analysis.index],
    ['Spot Close:', analysis.spot_close.toFixed(2)],
    ['Expiry:', analysis.expiry],
    ['ATM Strike:', analysis.atm.toString()],
    ['PCR:', analysis.pcr.toFixed(3)],
    ['Bias:', analysis.bias],
    ['Strategy:', analysis.strategy || 'N/A'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Bias Indicator
  const biasColor = analysis.bias === 'Bullish' ? [34, 197, 94] : 
                    analysis.bias === 'Bearish' ? [239, 68, 68] : 
                    [234, 179, 8];
  
  doc.setFillColor(biasColor[0], biasColor[1], biasColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.rect(14, yPosition - 5, 50, 10, 'F');
  doc.text(`${analysis.bias}`, 16, yPosition + 2);
  doc.setTextColor(0, 0, 0);
  
  yPosition += 15;

  // Support Zones
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Support Zones', 14, yPosition);
  yPosition += 5;

  const supportHeaders = [['Strike', 'OI', 'Change in OI', 'Strength']];
  const supportRows = analysis.support_zones.map(zone => [
    zone.strike.toString(),
    zone.oi.toLocaleString(),
    zone.chg.toLocaleString(),
    zone.strength,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: supportHeaders,
    body: supportRows,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 9 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Resistance Zones
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resistance Zones', 14, yPosition);
  yPosition += 5;

  const resistanceHeaders = [['Strike', 'OI', 'Change in OI', 'Strength']];
  const resistanceRows = analysis.resistance_zones.map(zone => [
    zone.strike.toString(),
    zone.oi.toLocaleString(),
    zone.chg.toLocaleString(),
    zone.strength,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: resistanceHeaders,
    body: resistanceRows,
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
    styles: { fontSize: 9 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Premium Table
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Premium Levels', 14, yPosition);
  yPosition += 5;

  const premiumHeaders = [['Strike', 'CE Close', 'CE High', 'CE Low', 'PE Close', 'PE High', 'PE Low']];
  const premiumRows = analysis.premium_table.map(level => [
    level.strike === analysis.atm ? `${level.strike} (ATM)` : level.strike.toString(),
    level.ce_close.toFixed(2),
    level.ce_high.toFixed(2),
    level.ce_low.toFixed(2),
    level.pe_close.toFixed(2),
    level.pe_high.toFixed(2),
    level.pe_low.toFixed(2),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: premiumHeaders,
    body: premiumRows,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold' },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      'EOD Options Analyzer',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc;
}

export function downloadPDF(analysis: IndexAnalysis) {
  const doc = generatePDFReport(analysis);
  const filename = `${analysis.index}_${analysis.expiry.replace(/\//g, '-')}_Analysis.pdf`;
  doc.save(filename);
}

export function generateCSVReport(analysis: IndexAnalysis): string {
  let csv = 'EOD Options Analysis Report\n\n';
  
  // Summary
  csv += 'SUMMARY\n';
  csv += `Index,${analysis.index}\n`;
  csv += `Spot Close,${analysis.spot_close}\n`;
  csv += `Expiry,${analysis.expiry}\n`;
  csv += `ATM Strike,${analysis.atm}\n`;
  csv += `PCR,${analysis.pcr.toFixed(3)}\n`;
  csv += `Bias,${analysis.bias}\n`;
  csv += `Strategy,${analysis.strategy || 'N/A'}\n`;
  csv += `Generated,${new Date().toLocaleString()}\n\n`;

  // Support Zones
  csv += 'SUPPORT ZONES\n';
  csv += 'Strike,Open Interest,Change in OI,Strength\n';
  analysis.support_zones.forEach(zone => {
    csv += `${zone.strike},${zone.oi},${zone.chg},${zone.strength}\n`;
  });
  csv += '\n';

  // Resistance Zones
  csv += 'RESISTANCE ZONES\n';
  csv += 'Strike,Open Interest,Change in OI,Strength\n';
  analysis.resistance_zones.forEach(zone => {
    csv += `${zone.strike},${zone.oi},${zone.chg},${zone.strength}\n`;
  });
  csv += '\n';

  // Premium Table
  csv += 'PREMIUM LEVELS\n';
  csv += 'Strike,CE Close,CE High,CE Low,PE Close,PE High,PE Low\n';
  analysis.premium_table.forEach(level => {
    const strikeLabel = level.strike === analysis.atm ? `${level.strike} (ATM)` : level.strike;
    csv += `${strikeLabel},${level.ce_close},${level.ce_high},${level.ce_low},${level.pe_close},${level.pe_high},${level.pe_low}\n`;
  });

  return csv;
}

export function downloadCSV(analysis: IndexAnalysis) {
  const csv = generateCSVReport(analysis);
  const filename = `${analysis.index}_${analysis.expiry.replace(/\//g, '-')}_Analysis.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateJSONReport(analysis: IndexAnalysis) {
  return {
    metadata: {
      generated_at: new Date().toISOString(),
      version: '1.0',
      tool: 'EOD Options Analyzer',
    },
    analysis: {
      index: analysis.index,
      spot_close: analysis.spot_close,
      expiry: analysis.expiry,
      atm_strike: analysis.atm,
      pcr: analysis.pcr,
      bias: analysis.bias,
      strategy: analysis.strategy,
      support_zones: analysis.support_zones,
      resistance_zones: analysis.resistance_zones,
      premium_table: analysis.premium_table,
    },
  };
}

export function downloadJSON(analysis: IndexAnalysis) {
  const json = generateJSONReport(analysis);
  const filename = `${analysis.index}_${analysis.expiry.replace(/\//g, '-')}_Analysis.json`;
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}