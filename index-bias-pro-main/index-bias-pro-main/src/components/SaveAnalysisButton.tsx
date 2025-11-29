import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { IndexAnalysis } from '@/types/options';
import { saveAnalysis } from '@/lib/database';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface SaveAnalysisButtonProps {
    analysis: IndexAnalysis;
    rawData?: any;
    className?: string;
    onSaved?: (id: string) => void;
}

export function SaveAnalysisButton({
    analysis,
    rawData,
    className,
    onSaved,
}: SaveAnalysisButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await saveAnalysis(analysis, rawData);
            toast.success('Analysis saved successfully');
            setIsOpen(false);
            if (onSaved) {
                onSaved(result.id);
            }
        } catch (error: any) {
            console.error('Error saving analysis:', error);
            if (error.message.includes('authenticated')) {
                toast.error('Please sign in to save analysis');
            } else {
                toast.error('Failed to save analysis');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className={className}>
                    <Save className="mr-2 h-4 w-4" />
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
                <div className="py-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Index:</span>
                            <span className="font-medium">{analysis.index}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Expiry:</span>
                            <span className="font-medium">{analysis.expiry}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bias:</span>
                            <span
                                className={`font-medium ${analysis.bias === 'Bullish'
                                        ? 'text-green-600'
                                        : analysis.bias === 'Bearish'
                                            ? 'text-red-600'
                                            : 'text-yellow-600'
                                    }`}
                            >
                                {analysis.bias}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">PCR:</span>
                            <span className="font-medium">{analysis.pcr.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
