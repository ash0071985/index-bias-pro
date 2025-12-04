import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Instrument {
  instrument_token: number;
  exchange_token: number;
  tradingsymbol: string;
  name: string;
  expiry: string;
  strike: number;
  instrument_type: string;
  segment: string;
  exchange: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const KITE_API_KEY = Deno.env.get('KITE_API_KEY');
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('zerodha_tokens')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Zerodha not connected' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (new Date(tokenData.expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired, please reconnect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { index, expiry } = await req.json();

    if (!index) {
      return new Response(
        JSON.stringify({ error: 'Index parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching instruments for:', index, expiry);

    // Fetch NFO instruments from Kite
    const instrumentsResponse = await fetch(
      'https://api.kite.trade/instruments/NFO',
      {
        headers: {
          'Authorization': `token ${KITE_API_KEY}:${tokenData.access_token}`,
        },
      }
    );

    if (!instrumentsResponse.ok) {
      console.error('Failed to fetch instruments:', instrumentsResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch instruments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instrumentsCsv = await instrumentsResponse.text();
    
    // Parse CSV
    const lines = instrumentsCsv.split('\n');
    const headers = lines[0].split(',');
    
    const instruments: Instrument[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      const instrument: any = {};
      headers.forEach((header, idx) => {
        instrument[header.trim()] = values[idx]?.trim();
      });
      
      // Filter by index name and option type
      const symbolMatches = instrument.name === index || 
                           instrument.tradingsymbol?.includes(index);
      const isOption = instrument.instrument_type === 'CE' || 
                       instrument.instrument_type === 'PE';
      
      if (symbolMatches && isOption) {
        // Filter by expiry if provided
        if (expiry) {
          const instExpiry = new Date(instrument.expiry).toISOString().split('T')[0];
          const targetExpiry = new Date(expiry).toISOString().split('T')[0];
          if (instExpiry !== targetExpiry) continue;
        }
        
        instruments.push({
          instrument_token: parseInt(instrument.instrument_token),
          exchange_token: parseInt(instrument.exchange_token),
          tradingsymbol: instrument.tradingsymbol,
          name: instrument.name,
          expiry: instrument.expiry,
          strike: parseFloat(instrument.strike),
          instrument_type: instrument.instrument_type,
          segment: instrument.segment,
          exchange: instrument.exchange,
        });
      }
    }

    console.log(`Found ${instruments.length} instruments for ${index}`);

    return new Response(
      JSON.stringify({ instruments }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Instruments error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
