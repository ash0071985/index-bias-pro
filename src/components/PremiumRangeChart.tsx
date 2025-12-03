import { Card } from '@/components/ui/card';
import { SyntheticPivotData, computePremiumRanges } from '@/lib/syntheticAnalysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, LabelList } from 'recharts';

interface PremiumRangeChartProps {
  spData: SyntheticPivotData;
}

export function PremiumRangeChart({ spData }: PremiumRangeChartProps) {
  const { ceRange, peRange } = computePremiumRanges(spData);
  
  const ceChartData = [
    {
      name: 'ATM CE High',
      value: spData.atmCeHigh,
      fill: 'hsl(var(--chart-1))',
    },
    {
      name: 'ATM CE Close',
      value: spData.atmCeClose,
      fill: 'hsl(var(--chart-2))',
    },
    {
      name: 'SP',
      value: spData.syntheticPivot,
      fill: 'hsl(var(--primary))',
    },
    {
      name: 'OTM PE High',
      value: spData.otmPeHigh,
      fill: 'hsl(var(--chart-4))',
    },
    {
      name: 'OTM PE Close',
      value: spData.otmPeClose,
      fill: 'hsl(var(--chart-5))',
    },
  ];

  const peChartData = [
    {
      name: 'ATM PE High',
      value: spData.atmPeHigh,
      fill: 'hsl(var(--chart-1))',
    },
    {
      name: 'ATM PE Close',
      value: spData.atmPeClose,
      fill: 'hsl(var(--chart-2))',
    },
    {
      name: 'SP',
      value: spData.syntheticPivot,
      fill: 'hsl(var(--primary))',
    },
    {
      name: 'OTM CE High',
      value: spData.otmCeHigh,
      fill: 'hsl(var(--chart-4))',
    },
    {
      name: 'OTM CE Close',
      value: spData.otmCeClose,
      fill: 'hsl(var(--chart-5))',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Premium Range Waterfall</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CE Side Waterfall */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">
            ATM CE → SP → OTM PE
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ceChartData} layout="vertical">
                <XAxis type="number" domain={[0, 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'Premium']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {ceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="right" formatter={(v: number) => v.toFixed(1)} fill="hsl(var(--foreground))" fontSize={11} />
                </Bar>
                <ReferenceLine x={spData.syntheticPivot} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PE Side Waterfall */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">
            ATM PE → SP → OTM CE
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peChartData} layout="vertical">
                <XAxis type="number" domain={[0, 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'Premium']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {peChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="right" formatter={(v: number) => v.toFixed(1)} fill="hsl(var(--foreground))" fontSize={11} />
                </Bar>
                <ReferenceLine x={spData.syntheticPivot} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
          <span>Close</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
          <span>Synthetic Pivot</span>
        </div>
      </div>
    </Card>
  );
}
