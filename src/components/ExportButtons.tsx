import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IndexAnalysis } from '@/types/options';
import { downloadPDF, downloadCSV, downloadJSON } from '@/lib/reportGenerator';
import { toast } from 'sonner';

interface ExportButtonsProps {
  analysis: IndexAnalysis;
}

export function ExportButtons({ analysis }: ExportButtonsProps) {
  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    try {
      switch (format) {
        case 'pdf':
          downloadPDF(analysis);
          toast.success('PDF report downloaded');
          break;
        case 'csv':
          downloadCSV(analysis);
          toast.success('CSV report downloaded');
          break;
        case 'json':
          downloadJSON(analysis);
          toast.success('JSON report downloaded');
          break;
      }
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Export error:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
          <FileText className="w-4 h-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2">
          <FileJson className="w-4 h-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}