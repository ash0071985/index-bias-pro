import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardSummary } from '@/components/DashboardSummary';
import { SupportResistanceTable } from '@/components/SupportResistanceTable';
import { PremiumTable } from '@/components/PremiumTable';
import { InsightsPanel } from '@/components/InsightsPanel';
import { SaveAnalysisButton } from '@/components/SaveAnalysisButton';
import { ExportButtons } from '@/components/ExportButtons';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SyntheticPivotCard } from '@/components/SyntheticPivotCard';
import { PremiumRangeChart } from '@/components/PremiumRangeChart';
import { GapPrediction } from '@/components/GapPrediction';
import { IndexName, BhavCopyRow, IndexAnalysis } from '@/types/options';
import { analyzeIndex } from '@/lib/optionsAnalysis';
import { getDefaultLotSize, getStrikeInterval, computeOTMStrikes, computeSyntheticPivotData, predictGap } from '@/lib/syntheticAnalysis';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Zap, BarChart3, History } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ManualStrikeEntry {
  id: string;
  strike: number;
  ce_oi: number;
  ce_oi_chg: number;
  ce_close: number;
  ce_high: number;
  ce_low: number;
  pe_oi: number;
  pe_oi_chg: number;
  pe_close: number;
  pe_high: number;
  pe_low: number;
}

const ManualEntryPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<IndexName>('BANKNIFTY');
  const [spotClose, setSpotClose] = useState<string>('');
  const [underlyingHigh, setUnderlyingHigh] = useState<string>('');
  const [underlyingLow, setUnderlyingLow] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [entries, setEntries] = useState<ManualStrikeEntry[]>([]);
  const [analysis, setAnalysis] = useState<IndexAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Update lot size when index changes
  useEffect(() => {
    setLotSize(getDefaultLotSize(selectedIndex).toString());
  }, [selectedIndex]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const generateStrikesAroundATM = () => {
    const spot = parseFloat(spotClose);
    if (!spot || spot <= 0) {
      toast.error('Please enter a valid spot price first');
      return;
    }

    // Determine strike interval based on index
    const interval = selectedIndex === 'BANKNIFTY' ? 100 : 
                     selectedIndex === 'NIFTY' ? 50 : 
                     selectedIndex === 'SENSEX' ? 100 : 
                     selectedIndex === 'FINNIFTY' ? 50 : 25;

    // Find ATM strike (rounded to nearest interval)
    const atm = Math.round(spot / interval) * interval;

    // Generate 15 strikes: ATM ± 7 strikes
    const newEntries: ManualStrikeEntry[] = [];
    for (let i = -7; i <= 7; i++) {
      const strike = atm + (i * interval);
      newEntries.push({
        id: crypto.randomUUID(),
        strike,
        ce_oi: 0,
        ce_oi_chg: 0,
        ce_close: 0,
        ce_high: 0,
        ce_low: 0,
        pe_oi: 0,
        pe_oi_chg: 0,
        pe_close: 0,
        pe_high: 0,
        pe_low: 0,
      });
    }

    setEntries(newEntries);
    toast.success(`Generated ${newEntries.length} strike rows around ATM ${atm}`);
  };

  const addEmptyRow = () => {
    setEntries([...entries, {
      id: crypto.randomUUID(),
      strike: 0,
      ce_oi: 0,
      ce_oi_chg: 0,
      ce_close: 0,
      ce_high: 0,
      ce_low: 0,
      pe_oi: 0,
      pe_oi_chg: 0,
      pe_close: 0,
      pe_high: 0,
      pe_low: 0,
    }]);
  };

  const removeRow = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof ManualStrikeEntry, value: number) => {
    setEntries(entries.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const convertToRawData = (): BhavCopyRow[] => {
    if (!expiryDate) return [];
    
    const expiry = format(expiryDate, 'dd-MMM-yyyy').toUpperCase();
    const rawData: BhavCopyRow[] = [];

    entries.forEach(entry => {
      if (entry.strike > 0) {
        // CE row
        rawData.push({
          SYMBOL: selectedIndex,
          INSTRUMENT: 'OPTIDX',
          OPTION_TYP: 'CE',
          STRIKE_PR: entry.strike,
          EXPIRY_DT: expiry,
          OPEN: entry.ce_close, // Using close as approximation
          HIGH: entry.ce_high,
          LOW: entry.ce_low,
          CLOSE: entry.ce_close,
          SETTLE_PR: entry.ce_close,
          OPEN_INT: entry.ce_oi,
          CHG_IN_OI: entry.ce_oi_chg,
        });

        // PE row
        rawData.push({
          SYMBOL: selectedIndex,
          INSTRUMENT: 'OPTIDX',
          OPTION_TYP: 'PE',
          STRIKE_PR: entry.strike,
          EXPIRY_DT: expiry,
          OPEN: entry.pe_close,
          HIGH: entry.pe_high,
          LOW: entry.pe_low,
          CLOSE: entry.pe_close,
          SETTLE_PR: entry.pe_close,
          OPEN_INT: entry.pe_oi,
          CHG_IN_OI: entry.pe_oi_chg,
        });
      }
    });

    return rawData;
  };

  const handleAnalyze = () => {
    const spot = parseFloat(spotClose);
    
    if (!spot || spot <= 0) {
      toast.error('Please enter a valid spot close price');
      return;
    }

    if (!expiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    if (entries.length === 0 || entries.every(e => e.strike === 0)) {
      toast.error('Please add at least one strike entry');
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      try {
        const rawData = convertToRawData();
        const expiry = format(expiryDate, 'dd-MMM-yyyy').toUpperCase();
        
        const result = analyzeIndex(selectedIndex, rawData, spot, expiry, {
          underlyingHigh: underlyingHigh ? parseFloat(underlyingHigh) : undefined,
          underlyingLow: underlyingLow ? parseFloat(underlyingLow) : undefined,
          underlyingClose: spot,
          lotSize: lotSize ? parseInt(lotSize) : undefined,
        });
        setAnalysis(result);
        toast.success('Analysis completed successfully');
      } catch (error) {
        toast.error('Error analyzing data');
        console.error(error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  };

  if (!user) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Manual Entry</h1>
                <p className="text-sm text-muted-foreground">Enter option chain data manually</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Link
                to="/history"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="font-medium">History</span>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Configuration Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Index Selector */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Index</label>
                <Select value={selectedIndex} onValueChange={(value) => setSelectedIndex(value as IndexName)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
                    <SelectItem value="NIFTY">NIFTY</SelectItem>
                    <SelectItem value="FINNIFTY">FINNIFTY</SelectItem>
                    <SelectItem value="MIDCPNIFTY">MIDCPNIFTY</SelectItem>
                    <SelectItem value="SENSEX">SENSEX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Expiry Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, "dd-MMM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Lot Size */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Lot Size</label>
                <Input
                  type="number"
                  placeholder="e.g., 15"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                />
              </div>

              {/* Placeholder for alignment */}
              <div className="hidden lg:block" />
            </div>

            {/* Underlying Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Underlying High</label>
                <Input
                  type="number"
                  placeholder="e.g., 48700"
                  value={underlyingHigh}
                  onChange={(e) => setUnderlyingHigh(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Underlying Low</label>
                <Input
                  type="number"
                  placeholder="e.g., 48200"
                  value={underlyingLow}
                  onChange={(e) => setUnderlyingLow(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Underlying Close (Spot)</label>
                <Input
                  type="number"
                  placeholder="e.g., 48500"
                  value={spotClose}
                  onChange={(e) => setSpotClose(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={generateStrikesAroundATM} variant="default" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Add Strikes
              </Button>
              <Button onClick={addEmptyRow} variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Row
              </Button>
            </div>
          </Card>

          {/* Entry Table */}
          {entries.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Strike Data Entry</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Strike</TableHead>
                      <TableHead className="text-right">CE OI</TableHead>
                      <TableHead className="text-right">CE Chg</TableHead>
                      <TableHead className="text-right">CE Close</TableHead>
                      <TableHead className="text-right">CE High</TableHead>
                      <TableHead className="text-right">CE Low</TableHead>
                      <TableHead className="text-right">PE OI</TableHead>
                      <TableHead className="text-right">PE Chg</TableHead>
                      <TableHead className="text-right">PE Close</TableHead>
                      <TableHead className="text-right">PE High</TableHead>
                      <TableHead className="text-right">PE Low</TableHead>
                      <TableHead className="w-20">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.strike || ''}
                            onChange={(e) => updateEntry(entry.id, 'strike', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.ce_oi || ''}
                            onChange={(e) => updateEntry(entry.id, 'ce_oi', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.ce_oi_chg || ''}
                            onChange={(e) => updateEntry(entry.id, 'ce_oi_chg', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.ce_close || ''}
                            onChange={(e) => updateEntry(entry.id, 'ce_close', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.ce_high || ''}
                            onChange={(e) => updateEntry(entry.id, 'ce_high', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.ce_low || ''}
                            onChange={(e) => updateEntry(entry.id, 'ce_low', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.pe_oi || ''}
                            onChange={(e) => updateEntry(entry.id, 'pe_oi', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.pe_oi_chg || ''}
                            onChange={(e) => updateEntry(entry.id, 'pe_oi_chg', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.pe_close || ''}
                            onChange={(e) => updateEntry(entry.id, 'pe_close', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.pe_high || ''}
                            onChange={(e) => updateEntry(entry.id, 'pe_high', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.pe_low || ''}
                            onChange={(e) => updateEntry(entry.id, 'pe_low', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => removeRow(entry.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <Button onClick={handleAnalyze} disabled={isAnalyzing} size="lg">
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Options Data'}
                </Button>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <section>
              <LoadingSpinner message="Analyzing option chain data..." />
            </section>
          )}

          {/* Results Section */}
          {analysis && !isAnalyzing && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Analysis Results - {analysis.index}
                </h2>
                <div className="flex gap-2">
                  <SaveAnalysisButton analysis={analysis} rawData={convertToRawData()} />
                  <ExportButtons analysis={analysis} />
                </div>
              </div>

              <DashboardSummary analysis={analysis} />
              
              {/* Gap Prediction */}
              <GapPrediction 
                pcr={analysis.pcr} 
                prediction={predictGap(analysis.pcr)} 
              />
              
              {/* Synthetic Pivot Analysis */}
              {(() => {
                const rawData = convertToRawData();
                const strikeInterval = getStrikeInterval(selectedIndex);
                const { otmPeStrike, otmCeStrike } = computeOTMStrikes(analysis.atm, strikeInterval);
                const spData = computeSyntheticPivotData(rawData, analysis.atm, strikeInterval);
                
                if (spData) {
                  return (
                    <>
                      <SyntheticPivotCard 
                        spData={spData} 
                        atm={analysis.atm}
                        otmPeStrike={otmPeStrike}
                        otmCeStrike={otmCeStrike}
                      />
                      <PremiumRangeChart spData={spData} />
                    </>
                  );
                }
                return null;
              })()}
              
              <InsightsPanel analysis={analysis} />
              <SupportResistanceTable
                supportZones={analysis.support_zones}
                resistanceZones={analysis.resistance_zones}
              />
              <PremiumTable
                premiumLevels={analysis.premium_table}
                atm={analysis.atm}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManualEntryPage;
