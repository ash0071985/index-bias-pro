import { PremiumLevel } from '@/types/options';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign } from 'lucide-react';

interface PremiumTableProps {
  premiumLevels: PremiumLevel[];
  atm: number;
}

export const PremiumTable = ({ premiumLevels, atm }: PremiumTableProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Premium Levels (HLC)</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Strike</TableHead>
              <TableHead colSpan={3} className="text-center border-r border-border">Call Premium</TableHead>
              <TableHead colSpan={3} className="text-center">Put Premium</TableHead>
            </TableRow>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className="text-xs">High</TableHead>
              <TableHead className="text-xs">Low</TableHead>
              <TableHead className="text-xs border-r border-border">Close</TableHead>
              <TableHead className="text-xs">High</TableHead>
              <TableHead className="text-xs">Low</TableHead>
              <TableHead className="text-xs">Close</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {premiumLevels.map((level, idx) => (
              <TableRow 
                key={idx} 
                className={`hover:bg-accent/50 ${level.strike === atm ? 'bg-primary/5' : ''}`}
              >
                <TableCell className="font-medium">
                  {level.strike}
                  {level.strike === atm && (
                    <span className="ml-2 text-xs text-primary">ATM</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{level.ce_high.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">{level.ce_low.toFixed(2)}</TableCell>
                <TableCell className="font-semibold border-r border-border">{level.ce_close.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">{level.pe_high.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">{level.pe_low.toFixed(2)}</TableCell>
                <TableCell className="font-semibold">{level.pe_close.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
