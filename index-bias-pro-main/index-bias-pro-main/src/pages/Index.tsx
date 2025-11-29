import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { IndexSelector } from '@/components/IndexSelector';
import { DashboardSummary } from '@/components/DashboardSummary';
import { SupportResistanceTable } from '@/components/SupportResistanceTable';
import { PremiumTable } from '@/components/PremiumTable';
import { InsightsPanel } from '@/components/InsightsPanel';
import { DataSummaryCard } from '@/components/DataSummaryCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SaveAnalysisButton } from '@/components/SaveAnalysisButton';
import { ExportButtons } from '@/components/ExportButtons';
import { OIDistributionChart } from '@/components/OIDistributionChart';
import { PCRTrendChart } from '@/components/PCRTrendChart';
import { OIChangeHeatmap } from '@/components/OIChangeHeatmap';
import { BhavCopyRow, IndexName, IndexAnalysis } from '@/types/options';
import { analyzeIndex } from '@/lib/optionsAnalysis';
import { getDetectedIndices, getExpiryDate } from '@/lib/validation';
import { BarChart3, History, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';

const Index = () => {
  const { rawData, setRawData, spotPrices, setSpotPrice } = useData();
  const [selectedIndices, setSelectedIndices] = useState<IndexName[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<IndexName>('BANKNIFTY');
  const [analysis, setAnalysis] = useState<IndexAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedIndices, setDetectedIndices] = useState<string[]>([]);

  const handleDataLoaded = (data: BhavCopyRow[]) => {
    setRawData(data);
    const indices = getDetectedIndices(data);
    setDetectedIndices(indices);

    // Auto-select first detected index
    if (indices.length > 0 && indices.includes(selectedIndex) === false) {
      setSelectedIndex(indices[0] as IndexName);
    }
  };

  const handleAnalyze = () => {
    const currentSpotPrice = spotPrices[selectedIndex];
    if (rawData.length === 0 || !currentSpotPrice) {
      toast.error('Please upload data and enter spot price');
      return;
    }

    if (!currentSpotPrice || currentSpotPrice <= 0) {
      toast.error('Please enter a valid spot close price');
      return;
    }

    setIsAnalyzing(true);

    // Simulate processing delay for better UX
    setTimeout(() => {
      try {
        // Filter data for selected index
        const indexData = rawData.filter(row =>
          row.SYMBOL === selectedIndex &&
          row.INSTRUMENT === 'OPTIDX' &&
          (row.OPTION_TYP === 'CE' || row.OPTION_TYP === 'PE')
        );

        if (indexData.length === 0) {
          toast.error(`No option chain data found for ${selectedIndex}`);
          setIsAnalyzing(false);
          return;
        }

        // Get expiry from data
        const expiry = getExpiryDate(rawData, selectedIndex);

        const result = analyzeIndex(selectedIndex, indexData, spotPrices[selectedIndex], expiry);
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
                <h1 className="text-2xl font-bold text-foreground">EOD Options Analyzer</h1>
                <p className="text-sm text-muted-foreground">NSE Options Chain Analysis Tool</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="font-medium">Multi-Index</span>
              </Link>
              <Link
                to="/history"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="font-medium">History</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Upload Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Step 1: Upload Bhavcopy</h2>
            <FileUploader onDataLoaded={handleDataLoaded} />
          </section>

          {/* Configuration Section */}
          {rawData.length > 0 && (
            <>
              <section>
                <h2 className="text-lg font-semibold mb-4 text-foreground">Step 2: Data Overview</h2>
                <DataSummaryCard
                  totalRows={rawData.length}
                  detectedIndices={detectedIndices}
                  expiry={getExpiryDate(rawData, selectedIndex)}
                />
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-4 text-foreground">Step 3: Configure Analysis</h2>
                <IndexSelector
                  selectedIndex={selectedIndex}
                  onIndexChange={setSelectedIndex}
                  spotClose={spotPrices[selectedIndex] || 0}
                  onSpotCloseChange={(price) => setSpotPrice(selectedIndex, price)}
                />
                <div className="mt-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Options Data'}
                  </button>
                </div>
              </section>
            </>
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
                  <SaveAnalysisButton analysis={analysis} rawData={rawData} />
                  <ExportButtons analysis={analysis} />
                </div>
              </div>

              <DashboardSummary analysis={analysis} />

              <InsightsPanel analysis={analysis} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OIDistributionChart
                  data={rawData.filter(row => row.SYMBOL === analysis.index)}
                  atm={analysis.atm}
                />
                <PCRTrendChart
                  data={rawData.filter(row => row.SYMBOL === analysis.index)}
                  atm={analysis.atm}
                />
              </div>

              <OIChangeHeatmap
                data={rawData.filter(row => row.SYMBOL === analysis.index)}
                atm={analysis.atm}
              />

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

          {/* Empty State */}
          {rawData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Upload a bhavcopy CSV file to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
