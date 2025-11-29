import { Card } from '@/components/ui/card';
import { FileText, Calendar, Target } from 'lucide-react';

interface DataSummaryCardProps {
  totalRows: number;
  detectedIndices: string[];
  expiry?: string;
}

export const DataSummaryCard = ({ totalRows, detectedIndices, expiry }: DataSummaryCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <h3 className="text-sm font-semibold text-foreground mb-4">Uploaded Data Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-lg font-bold text-foreground">{totalRows.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Indices Found</p>
            <p className="text-lg font-bold text-foreground">{detectedIndices.length}</p>
          </div>
        </div>

        {expiry && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiry Date</p>
              <p className="text-lg font-bold text-foreground">{expiry}</p>
            </div>
          </div>
        )}
      </div>

      {detectedIndices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Available Indices:</p>
          <div className="flex flex-wrap gap-2">
            {detectedIndices.map((index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs font-medium bg-background rounded-md border border-border"
              >
                {index}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
