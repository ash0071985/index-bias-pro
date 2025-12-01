import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IndexAnalysis } from '@/types/options';
import { saveAnalysis } from '@/lib/database';
import { toast } from 'sonner';

interface SaveAnalysisButtonProps {
  analysis: IndexAnalysis;
  rawData?: any;
}

export function SaveAnalysisButton({ analysis, rawData }: SaveAnalysisButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAnalysis(analysis, rawData);
      toast.success('Analysis saved successfully');
      setOpen(false);
    } catch (error: any) {
      if (error.message.includes('authenticated')) {
        toast.error('Please log in to save analysis');
      } else {
        toast.error('Failed to save analysis');
        console.error('Error saving analysis:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save className="w-4 h-4" />
          Save Analysis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Analysis</DialogTitle>
          <DialogDescription>
            Save this analysis to your history for future reference.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Index</p>
              <p className="text-lg font-semibold">{analysis.index}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bias</p>
              <p className="text-lg font-semibold">{analysis.bias}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Spot Close</p>
              <p className="text-lg font-semibold">{analysis.spot_close}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">PCR</p>
              <p className="text-lg font-semibold">{analysis.pcr.toFixed(3)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Strategy</p>
            <p className="text-base">{analysis.strategy}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}