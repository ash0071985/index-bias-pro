import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IndexAnalysis, SupportResistanceZone, PremiumLevel } from '@/types/options';

/**
 * Generate a PDF report from analysis data
 */
export function generatePDFReport(analysis: IndexAnalysis): Blob {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Index Bias Pro - Analysis Report', 14, 20);

    // Subtitle with date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const reportDate = new Date().toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
    });
    doc.text(`Generated on: ${reportDate}`, 14, 28);

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Market Summary', 14, 42);

    doc.setFontSize(10);
    const summaryY = 50;
    const lineHeight = 7;

    doc.text(`Index: ${analysis.index}`, 14, summaryY);
    doc.text(`Spot Close: ₹${analysis.spot_close.toFixed(2)}`, 14, summaryY + lineHeight);
    doc.text(`Expiry Date: ${analysis.expiry}`, 14, summaryY + lineHeight * 2);
    doc.text(`ATM Strike: ${analysis.atm}`, 14, summaryY + lineHeight * 3);
    doc.text(`PCR: ${analysis.pcr.toFixed(2)}`, 14, summaryY + lineHeight * 4);

    // Bias with color coding
    const biasY = summaryY + lineHeight * 5;
    doc.text('Market Bias: ', 14, biasY);

    // Set color based on bias
    if (analysis.bias === 'Bullish') {
        doc.setTextColor(34, 197, 94); // Green
    } else if (analysis.bias === 'Bearish') {
        doc.setTextColor(239, 68, 68); // Red
    } else {
        doc.setTextColor(234, 179, 8); // Yellow
    }
    doc.text(analysis.bias, 45, biasY);

    doc.setTextColor(40, 40, 40);
    if (analysis.strategy) {
        doc.text(`Suggested Strategy: ${analysis.strategy}`, 14, biasY + lineHeight);
    }

    // Support Zones Table
    let currentY = biasY + lineHeight * 3;
    doc.setFontSize(12);
    doc.text('Support Zones (Put OI)', 14, currentY);

    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [['Strike', 'Open Interest', 'Change in OI', 'Strength']],
        body: analysis.support_zones.map((zone: SupportResistanceZone) => [
            zone.strike.toString(),
            zone.oi.toLocaleString('en-IN'),
            zone.chg.toLocaleString('en-IN'),
            zone.strength,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { halign: 'right' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'center' },
        },
    });

    // Resistance Zones Table
    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Resistance Zones (Call OI)', 14, currentY);

    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [['Strike', 'Open Interest', 'Change in OI', 'Strength']],
        body: analysis.resistance_zones.map((zone: SupportResistanceZone) => [
            zone.strike.toString(),
            zone.oi.toLocaleString('en-IN'),
            zone.chg.toLocaleString('en-IN'),
            zone.strength,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { halign: 'right' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'center' },
        },
    });

    // Add new page for premium table
    doc.addPage();

    // Premium Table
    doc.setFontSize(14);
    doc.text('Premium Levels (ATM Range)', 14, 20);

    autoTable(doc, {
        startY: 28,
        head: [['Strike', 'CE Close', 'CE High', 'CE Low', 'PE Close', 'PE High', 'PE Low']],
        body: analysis.premium_table.map((level: PremiumLevel) => [
            level.strike.toString(),
            level.ce_close.toFixed(2),
            level.ce_high.toFixed(2),
            level.ce_low.toFixed(2),
            level.pe_close.toFixed(2),
            level.pe_high.toFixed(2),
            level.pe_low.toFixed(2),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { halign: 'center', fontStyle: 'bold' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
        },
        // Highlight ATM row
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 0) {
                const strike = parseInt(data.cell.text[0]);
                if (strike === analysis.atm) {
                    data.cell.styles.fillColor = [255, 237, 213];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${pageCount} | Index Bias Pro`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc.output('blob');
}

/**
 * Download PDF report
 */
export function downloadPDFReport(analysis: IndexAnalysis, filename?: string) {
    const blob = generatePDFReport(analysis);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${analysis.index}_${analysis.expiry}_analysis.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate CSV report from analysis data
 */
export function generateCSVReport(analysis: IndexAnalysis): string {
    const lines: string[] = [];

    // Header
    lines.push('Index Bias Pro - Analysis Report');
    lines.push(`Generated on: ${new Date().toLocaleString('en-IN')}`);
    lines.push('');

    // Summary
    lines.push('MARKET SUMMARY');
    lines.push(`Index,${analysis.index}`);
    lines.push(`Spot Close,${analysis.spot_close}`);
    lines.push(`Expiry Date,${analysis.expiry}`);
    lines.push(`ATM Strike,${analysis.atm}`);
    lines.push(`PCR,${analysis.pcr.toFixed(2)}`);
    lines.push(`Market Bias,${analysis.bias}`);
    if (analysis.strategy) {
        lines.push(`Suggested Strategy,${analysis.strategy}`);
    }
    lines.push('');

    // Support Zones
    lines.push('SUPPORT ZONES (PUT OI)');
    lines.push('Strike,Open Interest,Change in OI,Strength');
    analysis.support_zones.forEach((zone: SupportResistanceZone) => {
        lines.push(`${zone.strike},${zone.oi},${zone.chg},${zone.strength}`);
    });
    lines.push('');

    // Resistance Zones
    lines.push('RESISTANCE ZONES (CALL OI)');
    lines.push('Strike,Open Interest,Change in OI,Strength');
    analysis.resistance_zones.forEach((zone: SupportResistanceZone) => {
        lines.push(`${zone.strike},${zone.oi},${zone.chg},${zone.strength}`);
    });
    lines.push('');

    // Premium Table
    lines.push('PREMIUM LEVELS (ATM RANGE)');
    lines.push('Strike,CE Close,CE High,CE Low,PE Close,PE High,PE Low');
    analysis.premium_table.forEach((level: PremiumLevel) => {
        lines.push(
            `${level.strike},${level.ce_close},${level.ce_high},${level.ce_low},${level.pe_close},${level.pe_high},${level.pe_low}`
        );
    });

    return lines.join('\n');
}

/**
 * Download CSV report
 */
export function downloadCSVReport(analysis: IndexAnalysis, filename?: string) {
    const csv = generateCSVReport(analysis);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${analysis.index}_${analysis.expiry}_analysis.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate JSON report
 */
export function generateJSONReport(analysis: IndexAnalysis): string {
    return JSON.stringify(
        {
            ...analysis,
            generated_at: new Date().toISOString(),
            report_version: '1.0',
        },
        null,
        2
    );
}

/**
 * Download JSON report
 */
export function downloadJSONReport(analysis: IndexAnalysis, filename?: string) {
    const json = generateJSONReport(analysis);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${analysis.index}_${analysis.expiry}_analysis.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
