import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { IndexSelector } from '@/components/IndexSelector';
import { DashboardSummary } from '@/components/DashboardSummary';
import { SupportResistanceTable } from '@/components/SupportResistanceTable';
import { PremiumTable } from '@/components/PremiumTable';
import { BhavCopyRow, IndexName, IndexAnalysis } from '@/types/options';
import { analyzeIndex } from '@/lib/optionsAnalysis';
import { BarChart3 } from 'lucide-react';

const Index = () => {
  const [rawData, setRawData] = useState<BhavCopyRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<IndexName>('BANKNIFTY');
  const [spotClose, setSpotClose] = useState<number>(46218);
  const [analysis, setAnalysis] = useState<IndexAnalysis | null>(null);

  const handleDataLoaded = (data: BhavCopyRow[]) => {
    setRawData(data);
  };

  const handleAnalyze = () => {
    if (rawData.length === 0 || !spotClose) return;

    // Filter data for selected index
    const indexData = rawData.filter(row => 
      row.SYMBOL === selectedIndex && 
      row.INSTRUMENT === 'OPTIDX' &&
      (row.OPTION_TYP === 'CE' || row.OPTION_TYP === 'PE')
    );

    if (indexData.length === 0) {
      return;
    }

    // Get expiry from first row
    const expiry = indexData[0]?.EXPIRY_DT || '';

    const result = analyzeIndex(selectedIndex, indexData, spotClose, expiry);
    setAnalysis(result);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">EOD Options Analyzer</h1>
              <p className="text-sm text-muted-foreground">NSE Options Chain Analysis Tool</p>
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
            <section>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Step 2: Configure Analysis</h2>
              <IndexSelector
                selectedIndex={selectedIndex}
                onIndexChange={setSelectedIndex}
                spotClose={spotClose}
                onSpotCloseChange={setSpotClose}
              />
              <div className="mt-4">
                <button
                  onClick={handleAnalyze}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Analyze Options Data
                </button>
              </div>
            </section>
          )}

          {/* Results Section */}
          {analysis && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">Analysis Results</h2>
                <DashboardSummary analysis={analysis} />
              </div>

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
