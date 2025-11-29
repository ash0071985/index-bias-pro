import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { IndexAnalysis } from '@/types/options';
import {
    downloadPDFReport,
    downloadCSVReport,
    downloadJSONReport,
} from '@/lib/reportGenerator';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ExportButtonsProps {
    analysis: IndexAnalysis;
    className?: string;
}

export function ExportButtons({ analysis, className }: ExportButtonsProps) {
    const handleExportPDF = () => {
        try {
            downloadPDFReport(analysis);
            toast.success('PDF report downloaded successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF report');
        }
    };

    const handleExportCSV = () => {
        try {
            downloadCSVReport(analysis);
            toast.success('CSV report downloaded successfully');
        } catch (error) {
            console.error('Error generating CSV:', error);
            toast.error('Failed to generate CSV report');
        }
    };

    const handleExportJSON = () => {
        try {
            downloadJSONReport(analysis);
            toast.success('JSON report downloaded successfully');
        } catch (error) {
            console.error('Error generating JSON:', error);
            toast.error('Failed to generate JSON report');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={className}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export as JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
