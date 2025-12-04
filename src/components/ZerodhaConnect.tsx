import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, Link2Off, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { checkZerodhaStatus, getZerodhaLoginUrl, disconnectZerodha, ZerodhaStatus } from '@/lib/zerodhaApi';
import { cn } from '@/lib/utils';

interface ZerodhaConnectProps {
  onStatusChange?: (connected: boolean) => void;
  className?: string;
}

export function ZerodhaConnect({ onStatusChange, className }: ZerodhaConnectProps) {
  const [status, setStatus] = useState<ZerodhaStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    const result = await checkZerodhaStatus();
    setStatus(result);
    onStatusChange?.(result.connected);
    setIsLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await getZerodhaLoginUrl();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.login_url) {
        // Open Zerodha login in new window
        window.open(result.login_url, '_blank', 'width=600,height=700');
        toast.info('Please complete login in the popup window, then click Refresh Status');
      }
    } catch (error) {
      toast.error('Failed to initiate connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const result = await disconnectZerodha();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setStatus({ connected: false });
      onStatusChange?.(false);
      toast.success('Disconnected from Zerodha');
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    return expiry.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-lg bg-muted/50", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking Zerodha status...</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <div className="flex items-center gap-2 flex-1">
        {status.connected ? (
          <>
            <Link2 className="w-4 h-4 text-green-500" />
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              Connected
            </Badge>
            {status.expires_at && (
              <span className="text-xs text-muted-foreground">
                Expires {formatExpiryTime(status.expires_at)}
              </span>
            )}
          </>
        ) : (
          <>
            <Link2Off className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Not Connected
            </Badge>
            {status.expired && (
              <span className="text-xs text-orange-500">Token expired</span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
        
        {status.connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-destructive hover:text-destructive"
          >
            {isDisconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Link2Off className="w-4 h-4 mr-2" />
            )}
            Disconnect
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="w-4 h-4 mr-2" />
            )}
            Connect Zerodha
          </Button>
        )}
      </div>
    </div>
  );
}
