import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BhavCopyRow } from '@/types/options';

interface OIDistributionChartProps {
    data: BhavCopyRow[];
    atm: number;
    title?: string;
}

export function OIDistributionChart({ data, atm, title = 'Open Interest Distribution' }: OIDistributionChartProps) {
    // Prepare data for chart - group by strike
    const chartData = data.reduce((acc, row) => {
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

    // Sort by strike and filter to ATM ± 1000 range
    const filteredData = chartData
        .filter(item => Math.abs(item.strike - atm) <= 1000)
        .sort((a, b) => a.strike - b.strike)
        .map(item => ({
            ...item,
            strikeLabel: item.strike.toString(),
            isATM: item.strike === atm,
        }));

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
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Call OI: {data.callOI.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Put OI: {data.putOI.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="pt-1 border-t border-border mt-2">
                            <span className="font-medium">
                                PCR: {data.callOI > 0 ? (data.putOI / data.callOI).toFixed(2) : 'N/A'}
                            </span>
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
                    Call vs Put Open Interest across strike prices (ATM ± 1000)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                            label={{ value: 'Open Interest', angle: -90, position: 'insideLeft' }}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value.toString();
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="square"
                        />
                        <Bar dataKey="callOI" name="Call OI" fill="#ef4444" radius={[4, 4, 0, 0]}>
                            {filteredData.map((entry, index) => (
                                <Cell
                                    key={`cell-call-${index}`}
                                    fill={entry.isATM ? '#dc2626' : '#ef4444'}
                                    opacity={entry.isATM ? 1 : 0.8}
                                />
                            ))}
                        </Bar>
                        <Bar dataKey="putOI" name="Put OI" fill="#22c55e" radius={[4, 4, 0, 0]}>
                            {filteredData.map((entry, index) => (
                                <Cell
                                    key={`cell-put-${index}`}
                                    fill={entry.isATM ? '#16a34a' : '#22c55e'}
                                    opacity={entry.isATM ? 1 : 0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
