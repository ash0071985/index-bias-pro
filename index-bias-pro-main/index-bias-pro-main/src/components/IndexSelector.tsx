import { IndexName } from '@/types/options';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface IndexSelectorProps {
  selectedIndex: IndexName;
  onIndexChange: (index: IndexName) => void;
  spotClose: number;
  onSpotCloseChange: (value: number) => void;
}

const indices: { name: IndexName; label: string }[] = [
  { name: 'BANKNIFTY', label: 'Bank Nifty' },
  { name: 'NIFTY', label: 'Nifty 50' },
  { name: 'FINNIFTY', label: 'Fin Nifty' },
  { name: 'MIDCPNIFTY', label: 'Midcap Nifty' },
  { name: 'SENSEX', label: 'Sensex' },
];

export const IndexSelector = ({
  selectedIndex,
  onIndexChange,
  spotClose,
  onSpotCloseChange,
}: IndexSelectorProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-3 block">
            Select Index
          </label>
          <div className="flex flex-wrap gap-2">
            {indices.map((index) => (
              <Button
                key={index.name}
                variant={selectedIndex === index.name ? 'default' : 'outline'}
                onClick={() => onIndexChange(index.name)}
                className="transition-all"
              >
                {index.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Spot Close Price
          </label>
          <input
            type="number"
            value={spotClose}
            onChange={(e) => onSpotCloseChange(Number(e.target.value))}
            className="w-full px-4 py-2 bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter spot close price"
          />
        </div>
      </div>
    </Card>
  );
};
