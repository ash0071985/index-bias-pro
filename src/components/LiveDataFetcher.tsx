import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchOptionChain, OptionChainResponse } from '@/lib/zerodhaApi';
import { IndexName } from '@/types/options';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LiveDataFetcherProps {
  index: IndexName;
  expiry: Date | undefined;
  spotPrice: string;
  isConnected: boolean;
  onDataFetched: (response: OptionChainResponse) => void;
}

export function LiveDataFetcher({ 
  index, 
  expiry, 
  spotPrice, 
  isConnected,
  onDataFetched 
}: LiveDataFetcherProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setError(null);
    
    if (!isConnected) {
      setError('Please connect to Zerodha first');
      return;
    }

    if (!expiry) {
      setError('Please select an expiry date');
      return;
    }

    const spot = parseFloat(spotPrice);
    if (!spot || spot <= 0) {
      setError('Please enter a valid spot price');
      return;
    }

    setIsFetching(true);

    try {
      const expiryStr = expiry.toISOString().split('T')[0];
      const result = await fetchOptionChain(index, expiryStr, spot, 10);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (result.data.length === 0) {
        setError('No option data found for the selected criteria');
        toast.warning('No data found');
        return;
      }

      onDataFetched(result);
      toast.success(`Fetched ${result.data.length} option records`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      toast.error(message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleFetch}
        disabled={isFetching || !isConnected}
        className="w-full"
        variant={isConnected ? "default" : "secondary"}
      >
        {isFetching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Fetching Live Data...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Fetch Live Option Chain
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <p className="text-xs text-muted-foreground text-center">
          Connect to Zerodha above to fetch live data
        </p>
      )}
    </div>
  );
}
