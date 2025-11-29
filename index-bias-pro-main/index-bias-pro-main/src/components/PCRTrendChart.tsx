import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BhavCopyRow } from '@/types/options';

interface PCRTrendChartProps {
    data: BhavCopyRow[];
    atm: number;
    title?: string;
}

export function PCRTrendChart({ data, atm, title = 'PCR Trend Across Strikes' }: PCRTrendChartProps) {
    // Calculate PCR for each strike
    const pcrData = data.reduce((acc, row) => {
        const existing = acc.find(item => item.strike === row.STRIKE_PR);
        if (existing) {
            if (row.OPTION_TYP === 'CE') {
                existing.callOI = row.OPEN_INT;
            } else {
                existing.putOI = row.OPEN_INT;
            }
        } else {
            acc.push({
                strike: row.STRIKE_PR,
                callOI: row.OPTION_TYP === 'CE' ? row.OPEN_INT : 0,
                putOI: row.OPTION_TYP === 'PE' ? row.OPEN_INT : 0,
            });
        }
        return acc;
    }, [] as Array<{ strike: number; callOI: number; putOI: number }>);

    // Calculate PCR and filter to ATM ± 1000
    const chartData = pcrData
        .filter(item => Math.abs(item.strike - atm) <= 1000)
        .map(item => ({
            strike: item.strike,
            strikeLabel: item.strike.toString(),
            pcr: item.callOI > 0 ? item.putOI / item.callOI : 0,
            isATM: item.strike === atm,
        }))
        .sort((a, b) => a.strike - b.strike);

    // Calculate overall PCR for reference line
    const totalCallOI = pcrData.reduce((sum, item) => sum + item.callOI, 0);
    const totalPutOI = pcrData.reduce((sum, item) => sum + item.putOI, 0);
    const overallPCR = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold mb-2">
                        Strike: {data.strikeLabel}
                        {data.isATM && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">ATM</span>}
                    </p>
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <span>PCR:</span>
                            <span className={`font-medium ${data.pcr > 1.3 ? 'text-green-600' :
                                    data.pcr < 0.7 ? 'text-red-600' :
                                        'text-yellow-600'
                                }`}>
                                {data.pcr.toFixed(2)}
                            </span>
                        </div>
                        <div className="pt-1 border-t border-border mt-2 text-xs text-muted-foreground">
                            {data.pcr > 1.3 && '🟢 Bullish Signal'}
                            {data.pcr < 0.7 && '🔴 Bearish Signal'}
                            {data.pcr >= 0.7 && data.pcr <= 1.3 && '🟡 Neutral'}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    Put-Call Ratio across strike prices (Overall PCR: {overallPCR.toFixed(2)})
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="strikeLabel"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Strike Price', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            label={{ value: 'PCR', angle: -90, position: 'insideLeft' }}
                            domain={[0, 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {/* Reference lines for bullish/bearish zones */}
                        <ReferenceLine
                            y={1.3}
                            stroke="#22c55e"
                            strokeDasharray="3 3"
                            label={{ value: 'Bullish (1.3)', position: 'right', fill: '#22c55e', fontSize: 11 }}
                        />
                        <ReferenceLine
                            y={0.7}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{ value: 'Bearish (0.7)', position: 'right', fill: '#ef4444', fontSize: 11 }}
                        />
                        <ReferenceLine
                            y={overallPCR}
                            stroke="#3b82f6"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{ value: `Overall: ${overallPCR.toFixed(2)}`, position: 'top', fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}
                        />

                        <Line
                            type="monotone"
                            dataKey="pcr"
                            name="PCR"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                return (
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={payload.isATM ? 6 : 4}
                                        fill={payload.isATM ? '#8b5cf6' : '#a78bfa'}
                                        stroke="#fff"
                                        strokeWidth={payload.isATM ? 2 : 1}
                                    />
                                );
                            }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>PCR &gt; 1.3 (Bullish)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>0.7 ≤ PCR ≤ 1.3 (Neutral)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>PCR &lt; 0.7 (Bearish)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
