import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import { BhavCopyRow } from '@/types/options';
import { toast } from 'sonner';

interface FileUploaderProps {
  onDataLoaded: (data: BhavCopyRow[]) => void;
}

export const FileUploader = ({ onDataLoaded }: FileUploaderProps) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as BhavCopyRow[];
          
          // Validate data structure
          if (data.length === 0) {
            toast.error('CSV file is empty');
            return;
          }

          const firstRow = data[0];
          const requiredFields = ['SYMBOL', 'INSTRUMENT', 'OPTION_TYP', 'STRIKE_PR', 'OPEN_INT'];
          const missingFields = requiredFields.filter(field => !(field in firstRow));
          
          if (missingFields.length > 0) {
            toast.error(`Missing required fields: ${missingFields.join(', ')}`);
            return;
          }

          // Convert numeric fields
          const processedData = data.map(row => ({
            ...row,
            STRIKE_PR: Number(row.STRIKE_PR),
            OPEN: Number(row.OPEN),
            HIGH: Number(row.HIGH),
            LOW: Number(row.LOW),
            CLOSE: Number(row.CLOSE),
            SETTLE_PR: Number(row.SETTLE_PR),
            OPEN_INT: Number(row.OPEN_INT),
            CHG_IN_OI: Number(row.CHG_IN_OI),
          }));

          onDataLoaded(processedData);
          toast.success(`Loaded ${processedData.length} rows`);
        } catch (error) {
          toast.error('Error parsing CSV file');
          console.error(error);
        }
      },
      error: (error) => {
        toast.error('Error reading file');
        console.error(error);
      },
    });
  }, [onDataLoaded]);

  return (
    <Card className="p-8 border-2 border-dashed border-border hover:border-primary transition-colors">
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-1">
              Upload NSE Bhavcopy
            </p>
            <p className="text-sm text-muted-foreground">
              Drop your CSV file here or click to browse
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </label>
    </Card>
  );
};
