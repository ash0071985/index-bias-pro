import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react';
import { IndexName, IndexAnalysis } from '@/types/options';
import { analyzeIndex } from '@/lib/optionsAnalysis';
import { getExpiryDate } from '@/lib/validation';
import { BiasIndicator } from '@/components/BiasIndicator';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useData } from '@/context/DataContext';

export default function MultiIndexDashboard() {
    const { rawData, spotPrices } = useData();
    const [analyses, setAnalyses] = useState<Record<string, IndexAnalysis>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const indices: IndexName[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];

    const analyzeAllIndices = () => {
        if (!rawData || rawData.length === 0) {
            toast.error('No data available for analysis');
            return;
        }

        setIsAnalyzing(true);
        const results: Record<string, IndexAnalysis> = {};

        try {
            indices.forEach((indexName) => {
                const indexData = rawData.filter(
                    (row) =>
                        row.SYMBOL === indexName &&
                        row.INSTRUMENT === 'OPTIDX' &&
                        (row.OPTION_TYP === 'CE' || row.OPTION_TYP === 'PE')
                );

                if (indexData.length > 0 && spotPrices[indexName]) {
                    const expiry = getExpiryDate(rawData, indexName);
                    const analysis = analyzeIndex(indexName, indexData, spotPrices[indexName], expiry);
                    results[indexName] = analysis;
                }
            });

            setAnalyses(results);
            toast.success(`Analyzed ${Object.keys(results).length} indices successfully`);
        } catch (error) {
            console.error('Error analyzing indices:', error);
            toast.error('Error analyzing indices');
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (rawData && rawData.length > 0 && Object.keys(spotPrices).length > 0) {
            analyzeAllIndices();
        }
    }, [rawData]);

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

    // Calculate market sentiment
    const marketSentiment = () => {
        const biases = Object.values(analyses).map((a) => a.bias);
        const bullish = biases.filter((b) => b === 'Bullish').length;
        const bearish = biases.filter((b) => b === 'Bearish').length;
        const sideways = biases.filter((b) => b === 'Sideways').length;

        if (bullish > bearish && bullish > sideways) return 'Bullish';
        if (bearish > bullish && bearish > sideways) return 'Bearish';
        return 'Mixed';
    };

    const analysisCount = Object.keys(analyses).length;
    const sentiment = analysisCount > 0 ? marketSentiment() : 'Unknown';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Multi-Index Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    Compare all indices side-by-side
                                </p>
                            </div>
                        </div>
                        <Button onClick={analyzeAllIndices} disabled={isAnalyzing || !rawData || rawData.length === 0}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Market Overview */}
                {analysisCount > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Market Overview</CardTitle>
                            <CardDescription>Overall market sentiment across all indices</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <div className="text-3xl font-bold">{analysisCount}</div>
                                    <div className="text-sm text-muted-foreground mt-1">Indices Analyzed</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <div className="text-3xl font-bold text-green-600">
                                        {Object.values(analyses).filter((a) => a.bias === 'Bullish').length}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">Bullish</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <div className="text-3xl font-bold text-red-600">
                                        {Object.values(analyses).filter((a) => a.bias === 'Bearish').length}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">Bearish</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <div className="text-3xl font-bold text-yellow-600">
                                        {Object.values(analyses).filter((a) => a.bias === 'Sideways').length}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">Sideways</div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <Badge variant="outline" className={`${getBiasColor(sentiment)} text-lg px-4 py-2`}>
                                    {getBiasIcon(sentiment)}
                                    <span className="ml-2">Overall Market: {sentiment}</span>
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Index Comparison Grid */}
                {analysisCount > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {indices.map((indexName) => {
                            const analysis = analyses[indexName];
                            if (!analysis) return null;

                            return (
                                <Card key={indexName} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl">{indexName}</CardTitle>
                                            <BiasIndicator bias={analysis.bias} size="sm" />
                                        </div>
                                        <CardDescription>Expiry: {analysis.expiry}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">Spot Close</div>
                                                <div className="text-lg font-semibold">₹{analysis.spot_close.toFixed(2)}</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">ATM Strike</div>
                                                <div className="text-lg font-semibold">{analysis.atm}</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">PCR</div>
                                                <div className={`text-lg font-semibold ${analysis.pcr > 1.3 ? 'text-green-600' :
                                                        analysis.pcr < 0.7 ? 'text-red-600' :
                                                            'text-yellow-600'
                                                    }`}>
                                                    {analysis.pcr.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">Bias</div>
                                                <div className={`text-lg font-semibold ${analysis.bias === 'Bullish' ? 'text-green-600' :
                                                        analysis.bias === 'Bearish' ? 'text-red-600' :
                                                            'text-yellow-600'
                                                    }`}>
                                                    {analysis.bias}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Strategy */}
                                        {analysis.strategy && (
                                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                                <div className="text-xs text-muted-foreground mb-1">Suggested Strategy</div>
                                                <div className="text-sm font-medium text-primary">{analysis.strategy}</div>
                                            </div>
                                        )}

                                        {/* Top Support/Resistance */}
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <div className="text-muted-foreground mb-2">Top Support</div>
                                                <div className="space-y-1">
                                                    {analysis.support_zones.slice(0, 2).map((zone, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-green-500/10">
                                                            <span className="font-medium">{zone.strike}</span>
                                                            <span className="text-muted-foreground">{zone.oi.toLocaleString('en-IN', { notation: 'compact' })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground mb-2">Top Resistance</div>
                                                <div className="space-y-1">
                                                    {analysis.resistance_zones.slice(0, 2).map((zone, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-red-500/10">
                                                            <span className="font-medium">{zone.strike}</span>
                                                            <span className="text-muted-foreground">{zone.oi.toLocaleString('en-IN', { notation: 'compact' })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-lg font-medium mb-2">No analysis data available</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Upload bhavcopy data and set spot prices to analyze all indices
                            </p>
                            <Link to="/">
                                <Button>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Go to Main Page
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
