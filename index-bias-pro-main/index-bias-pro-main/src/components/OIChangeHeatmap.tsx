import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BhavCopyRow } from '@/types/options';

interface OIChangeHeatmapProps {
    data: BhavCopyRow[];
    atm: number;
    title?: string;
}

export function OIChangeHeatmap({ data, atm, title = 'OI Change Heatmap' }: OIChangeHeatmapProps) {
    // Prepare data for heatmap
    const heatmapData = data.reduce((acc, row) => {
        const existing = acc.find(item => item.strike === row.STRIKE_PR);
        if (existing) {
            if (row.OPTION_TYP === 'CE') {
                existing.callChange = row.CHG_IN_OI;
                existing.callOI = row.OPEN_INT;
            } else {
                existing.putChange = row.CHG_IN_OI;
                existing.putOI = row.OPEN_INT;
            }
        } else {
            acc.push({
                strike: row.STRIKE_PR,
                callChange: row.OPTION_TYP === 'CE' ? row.CHG_IN_OI : 0,
                putChange: row.OPTION_TYP === 'PE' ? row.CHG_IN_OI : 0,
                callOI: row.OPTION_TYP === 'CE' ? row.OPEN_INT : 0,
                putOI: row.OPTION_TYP === 'PE' ? row.OPEN_INT : 0,
            });
        }
        return acc;
    }, [] as Array<{ strike: number; callChange: number; putChange: number; callOI: number; putOI: number }>);

    // Filter to ATM ± 500 and sort
    const filteredData = heatmapData
        .filter(item => Math.abs(item.strike - atm) <= 500)
        .sort((a, b) => b.strike - a.strike); // Sort descending for better visualization

    // Find max absolute change for color scaling
    const maxChange = Math.max(
        ...filteredData.flatMap(item => [Math.abs(item.callChange), Math.abs(item.putChange)])
    );

    const getColorIntensity = (change: number) => {
        const intensity = Math.min(Math.abs(change) / maxChange, 1);
        if (change > 0) {
            // Green for positive (building)
            return `rgba(34, 197, 94, ${0.2 + intensity * 0.8})`;
        } else if (change < 0) {
            // Red for negative (unwinding)
            return `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`;
        }
        return 'rgba(156, 163, 175, 0.2)'; // Gray for no change
    };

    const formatChange = (change: number) => {
        const sign = change >= 0 ? '+' : '';
        if (Math.abs(change) >= 1000000) {
            return `${sign}${(change / 1000000).toFixed(1)}M`;
        }
        if (Math.abs(change) >= 1000) {
            return `${sign}${(change / 1000).toFixed(0)}K`;
        }
        return `${sign}${change}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    Change in Open Interest - Green (Building) | Red (Unwinding)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="p-3 text-left font-semibold text-sm">Strike</th>
                                <th className="p-3 text-center font-semibold text-sm">Call Change</th>
                                <th className="p-3 text-center font-semibold text-sm">Put Change</th>
                                <th className="p-3 text-right font-semibold text-sm">Interpretation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => {
                                const isATM = item.strike === atm;
                                const interpretation =
                                    item.callChange > 0 && item.putChange < 0 ? '🔴 Bearish' :
                                        item.callChange < 0 && item.putChange > 0 ? '🟢 Bullish' :
                                            item.callChange > 0 && item.putChange > 0 ? '🟡 Volatile' :
                                                item.callChange < 0 && item.putChange < 0 ? '⚪ Unwinding' :
                                                    '➖ Neutral';

                                return (
                                    <tr
                                        key={item.strike}
                                        className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${isATM ? 'bg-primary/5 font-semibold' : ''
                                            }`}
                                    >
                                        <td className="p-3 text-left">
                                            {item.strike}
                                            {isATM && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">ATM</span>}
                                        </td>
                                        <td
                                            className="p-3 text-center font-mono text-sm"
                                            style={{ backgroundColor: getColorIntensity(item.callChange) }}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className={item.callChange > 0 ? 'text-green-700' : item.callChange < 0 ? 'text-red-700' : ''}>
                                                    {formatChange(item.callChange)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    OI: {item.callOI.toLocaleString('en-IN', { notation: 'compact' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            className="p-3 text-center font-mono text-sm"
                                            style={{ backgroundColor: getColorIntensity(item.putChange) }}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className={item.putChange > 0 ? 'text-green-700' : item.putChange < 0 ? 'text-red-700' : ''}>
                                                    {formatChange(item.putChange)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    OI: {item.putOI.toLocaleString('en-IN', { notation: 'compact' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right text-sm">
                                            {interpretation}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <span>🟢</span>
                        <span>Call Unwinding + Put Building = Bullish</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <span>🔴</span>
                        <span>Call Building + Put Unwinding = Bearish</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <span>🟡</span>
                        <span>Both Building = High Volatility Expected</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <span>⚪</span>
                        <span>Both Unwinding = Position Squaring</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
