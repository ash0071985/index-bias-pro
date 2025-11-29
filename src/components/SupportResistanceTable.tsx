import { SupportResistanceZone } from '@/types/options';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, AlertTriangle } from 'lucide-react';

interface SupportResistanceTableProps {
  supportZones: SupportResistanceZone[];
  resistanceZones: SupportResistanceZone[];
}

export const SupportResistanceTable = ({ supportZones, resistanceZones }: SupportResistanceTableProps) => {
  const formatNumber = (num: number) => {
    if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return 'text-bullish';
      case 'Moderate': return 'text-sideways';
      case 'Weak': return 'text-bearish';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-bullish" />
          <h3 className="text-lg font-semibold">Support Zones</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strike</TableHead>
                <TableHead>PUT OI</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Strength</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supportZones.map((zone, idx) => (
                <TableRow key={idx} className="hover:bg-accent/50">
                  <TableCell className="font-medium">{zone.strike}</TableCell>
                  <TableCell>{formatNumber(zone.oi)}</TableCell>
                  <TableCell className={zone.chg > 0 ? 'text-bullish' : 'text-bearish'}>
                    {zone.chg > 0 ? '+' : ''}{formatNumber(zone.chg)}
                  </TableCell>
                  <TableCell className={getStrengthColor(zone.strength)}>
                    {zone.strength}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-bearish" />
          <h3 className="text-lg font-semibold">Resistance Zones</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strike</TableHead>
                <TableHead>CALL OI</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Strength</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resistanceZones.map((zone, idx) => (
                <TableRow key={idx} className="hover:bg-accent/50">
                  <TableCell className="font-medium">{zone.strike}</TableCell>
                  <TableCell>{formatNumber(zone.oi)}</TableCell>
                  <TableCell className={zone.chg > 0 ? 'text-bullish' : 'text-bearish'}>
                    {zone.chg > 0 ? '+' : ''}{formatNumber(zone.chg)}
                  </TableCell>
                  <TableCell className={getStrengthColor(zone.strength)}>
                    {zone.strength}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
