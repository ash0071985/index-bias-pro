import { supabase } from '@/integrations/supabase/client';
import { BhavCopyRow } from '@/types/options';

const SUPABASE_URL = 'https://skqkrdhozvtgypjmjscb.supabase.co';

export interface ZerodhaStatus {
  connected: boolean;
  expires_at?: string;
  expired?: boolean;
  error?: string;
}

export interface OptionChainResponse {
  data: BhavCopyRow[];
  underlying: {
    high: number;
    low: number;
    close: number;
    open: number;
  } | null;
  atm: number;
  timestamp: string;
  error?: string;
}

export async function getZerodhaLoginUrl(): Promise<{ login_url?: string; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/zerodha-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting login URL:', error);
    return { error: 'Failed to get login URL' };
  }
}

export async function checkZerodhaStatus(): Promise<ZerodhaStatus> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { connected: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/zerodha-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error checking status:', error);
    return { connected: false, error: 'Failed to check status' };
  }
}

export async function exchangeRequestToken(requestToken: string, userId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/zerodha-callback?request_token=${requestToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error exchanging token:', error);
    return { error: 'Failed to exchange token' };
  }
}

export async function fetchOptionChain(
  index: string,
  expiry: string,
  spotPrice: number,
  strikeRange: number = 10
): Promise<OptionChainResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { data: [], underlying: null, atm: 0, timestamp: '', error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/zerodha-option-chain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ index, expiry, spotPrice, strikeRange }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { data: [], underlying: null, atm: 0, timestamp: '', error: result.error || 'Failed to fetch' };
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching option chain:', error);
    return { data: [], underlying: null, atm: 0, timestamp: '', error: 'Failed to fetch option chain' };
  }
}

export async function disconnectZerodha(): Promise<{ success?: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/zerodha-disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error disconnecting:', error);
    return { error: 'Failed to disconnect' };
  }
}
