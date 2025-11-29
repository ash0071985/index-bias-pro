import { useCallback, useState } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import { BhavCopyRow } from '@/types/options';
import { toast } from 'sonner';
import { validateBhavCopyData } from '@/lib/validation';
import { LoadingSpinner } from './LoadingSpinner';

interface FileUploaderProps {
  onDataLoaded: (data: BhavCopyRow[]) => void;
  isLoading?: boolean;
}

export const FileUploader = ({ onDataLoaded, isLoading }: FileUploaderProps) => {
  const [fileName, setFileName] = useState<string>('');
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    setIsUploaded(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as BhavCopyRow[];

          // Convert numeric fields
          const processedData = data.map(row => ({
            ...row,
            STRIKE_PR: Number(row.STRIKE_PR) || 0,
            OPEN: Number(row.OPEN) || 0,
            HIGH: Number(row.HIGH) || 0,
            LOW: Number(row.LOW) || 0,
            CLOSE: Number(row.CLOSE) || 0,
            SETTLE_PR: Number(row.SETTLE_PR) || 0,
            OPEN_INT: Number(row.OPEN_INT) || 0,
            CHG_IN_OI: Number(row.CHG_IN_OI) || 0,
          }));

          // Validate data
          const validation = validateBhavCopyData(processedData);
          
          if (!validation.isValid) {
            validation.errors.forEach(error => toast.error(error));
            return;
          }

          if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => toast.warning(warning));
          }

          onDataLoaded(processedData);
          setIsUploaded(true);
          toast.success(`✓ Loaded ${processedData.length} rows successfully`);
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

  if (isLoading) {
    return (
      <Card className="p-8 border-2 border-border">
        <LoadingSpinner message="Parsing CSV file..." />
      </Card>
    );
  }

  return (
    <Card className={`p-8 border-2 transition-all ${
      isUploaded 
        ? 'border-bullish bg-bullish/5' 
        : 'border-dashed border-border hover:border-primary'
    }`}>
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${
            isUploaded ? 'bg-bullish/20' : 'bg-primary/10'
          }`}>
            {isUploaded ? (
              <CheckCircle2 className="w-8 h-8 text-bullish" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-1">
              {isUploaded ? 'File Uploaded Successfully' : 'Upload NSE Bhavcopy'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isUploaded 
                ? `${fileName} - Click to upload a different file` 
                : 'Drop your CSV file here or click to browse'
              }
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
