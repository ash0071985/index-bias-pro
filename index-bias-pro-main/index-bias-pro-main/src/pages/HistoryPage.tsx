import { useEffect, useState } from 'react';
import { getAnalysisHistory, deleteAnalysis } from '@/lib/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ExportButtons } from '@/components/ExportButtons';
import { IndexAnalysis } from '@/types/options';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function HistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterIndex, setFilterIndex] = useState<string>('all');

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const data = await getAnalysisHistory(
                50,
                filterIndex === 'all' ? undefined : filterIndex
            );
            setHistory(data);
        } catch (error: any) {
            console.error('Error loading history:', error);
            if (error.message.includes('authenticated')) {
                toast.error('Please sign in to view history');
            } else {
                toast.error('Failed to load analysis history');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [filterIndex]);

    const handleDelete = async (id: string) => {
        try {
            await deleteAnalysis(id);
            toast.success('Analysis deleted successfully');
            loadHistory();
        } catch (error) {
            console.error('Error deleting analysis:', error);
            toast.error('Failed to delete analysis');
        }
    };

    const getBiasIcon = (bias: string) => {
        if (bias === 'Bullish') return <TrendingUp className="h-4 w-4" />;
        if (bias === 'Bearish') return <TrendingDown className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    const getBiasColor = (bias: string) => {
        if (bias === 'Bullish') return 'bg-green-500/10 text-green-600 border-green-500/20';
        if (bias === 'Bearish') return 'bg-red-500/10 text-red-600 border-red-500/20';
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
                <p className="text-muted-foreground">
                    View and manage your saved analysis reports
                </p>
            </div>

            <div className="mb-6 flex items-center gap-4">
                <Select value={filterIndex} onValueChange={setFilterIndex}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by index" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Indices</SelectItem>
                        <SelectItem value="NIFTY">NIFTY</SelectItem>
                        <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
                        <SelectItem value="FINNIFTY">FINNIFTY</SelectItem>
                        <SelectItem value="MIDCPNIFTY">MIDCPNIFTY</SelectItem>
                        <SelectItem value="SENSEX">SENSEX</SelectItem>
                    </SelectContent>
                </Select>

                <div className="text-sm text-muted-foreground">
                    {history.length} {history.length === 1 ? 'record' : 'records'} found
                </div>
            </div>

            {history.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">No analysis history found</p>
                        <p className="text-sm text-muted-foreground">
                            Start analyzing indices to build your history
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {history.map((item) => {
                        // Convert database record to IndexAnalysis format
                        const analysis: IndexAnalysis = {
                            index: item.index_name,
                            spot_close: parseFloat(item.spot_close),
                            expiry: item.expiry_date,
                            atm: parseFloat(item.atm_strike),
                            pcr: parseFloat(item.pcr),
                            bias: item.bias as any,
                            support_zones: item.support_zones as any,
                            resistance_zones: item.resistance_zones as any,
                            premium_table: item.premium_table as any,
                            strategy: item.strategy,
                        };

                        return (
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {item.index_name}
                                                <Badge variant="outline" className={getBiasColor(item.bias)}>
                                                    {getBiasIcon(item.bias)}
                                                    <span className="ml-1">{item.bias}</span>
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span>
                                                        <Calendar className="inline h-3 w-3 mr-1" />
                                                        {new Date(item.analysis_date).toLocaleString('en-IN', {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short',
                                                        })}
                                                    </span>
                                                    <span>Expiry: {item.expiry_date}</span>
                                                </div>
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <ExportButtons analysis={analysis} />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="icon">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete this analysis? This action
                                                            cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Spot Close</p>
                                            <p className="font-medium">₹{parseFloat(item.spot_close).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">ATM Strike</p>
                                            <p className="font-medium">{item.atm_strike}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">PCR</p>
                                            <p className="font-medium">{parseFloat(item.pcr).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Strategy</p>
                                            <p className="font-medium text-xs">{item.strategy || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
