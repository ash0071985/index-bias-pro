import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, ArrowLeft, Filter, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
import { getAnalysisHistory, deleteAnalysis } from '@/lib/database';
import { ExportButtons } from '@/components/ExportButtons';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { IndexAnalysis, IndexName } from '@/types/options';
import { toast } from 'sonner';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterIndex, setFilterIndex] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [filterIndex, user]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const indexFilter = filterIndex === 'all' ? undefined : filterIndex;
      const data = await getAnalysisHistory(50, indexFilter);
      setAnalyses(data);
    } catch (error: any) {
      if (error.message.includes('authenticated')) {
        toast.error('Please log in to view history');
      } else {
        toast.error('Failed to load history');
        console.error('Error loading history:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnalysis(id);
      toast.success('Analysis deleted');
      setAnalyses(analyses.filter(a => a.id !== id));
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete analysis');
      console.error('Error deleting analysis:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const convertToAnalysis = (data: any): IndexAnalysis => ({
    index: data.index_name,
    spot_close: parseFloat(data.spot_close),
    expiry: data.expiry_date,
    atm: parseFloat(data.atm_strike),
    pcr: parseFloat(data.pcr),
    bias: data.bias,
    support_zones: data.support_zones,
    resistance_zones: data.resistance_zones,
    premium_table: data.premium_table,
    strategy: data.strategy,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analysis History</h1>
                <p className="text-sm text-muted-foreground">View and export past analyses</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
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
          <span className="text-sm text-muted-foreground">
            {analyses.length} {analyses.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner message="Loading history..." />}

        {/* Results */}
        {!isLoading && analyses.length === 0 && (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No saved analyses found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Analyze some data and save it to see it here
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go to Analyzer
            </Button>
          </div>
        )}

        {/* Analysis Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => {
            const biasColor =
              analysis.bias === 'Bullish'
                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                : analysis.bias === 'Bearish'
                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';

            return (
              <Card key={analysis.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{analysis.index_name}</span>
                    <Badge className={biasColor}>{analysis.bias}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(analysis.analysis_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiry</p>
                      <p className="font-medium">{analysis.expiry_date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spot Close</p>
                      <p className="font-medium">{parseFloat(analysis.spot_close).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">PCR</p>
                      <p className="font-medium">{parseFloat(analysis.pcr).toFixed(3)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Strategy</p>
                    <p className="text-sm font-medium">{analysis.strategy || 'N/A'}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <ExportButtons analysis={convertToAnalysis(analysis)} />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteId(analysis.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}