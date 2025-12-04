import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BhavCopyRow {
  SYMBOL: string;
  INSTRUMENT: string;
  OPTION_TYP: 'CE' | 'PE';
  STRIKE_PR: number;
  EXPIRY_DT: string;
  OPEN: number;
  HIGH: number;
  LOW: number;
  CLOSE: number;
  SETTLE_PR: number;
  OPEN_INT: number;
  CHG_IN_OI: number;
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
    const { index, expiry, spotPrice, strikeRange = 10 } = await req.json();

    if (!index || !expiry || !spotPrice) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: index, expiry, spotPrice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching option chain for:', { index, expiry, spotPrice, strikeRange });

    // First, fetch instruments
    const instrumentsResponse = await fetch(
      'https://api.kite.trade/instruments/NFO',
      {
        headers: {
          'Authorization': `token ${KITE_API_KEY}:${tokenData.access_token}`,
        },
      }
    );

    if (!instrumentsResponse.ok) {
      console.error('Failed to fetch instruments');
      return new Response(
        JSON.stringify({ error: 'Failed to fetch instruments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instrumentsCsv = await instrumentsResponse.text();
    const lines = instrumentsCsv.split('\n');
    const headers = lines[0].split(',');
    
    // Determine strike interval based on index
    const strikeInterval = index === 'BANKNIFTY' ? 100 : 
                          index === 'NIFTY' ? 50 : 
                          index === 'SENSEX' ? 100 : 
                          index === 'FINNIFTY' ? 50 : 25;
    
    // Calculate ATM and strike range
    const atm = Math.round(spotPrice / strikeInterval) * strikeInterval;
    const minStrike = atm - (strikeRange * strikeInterval);
    const maxStrike = atm + (strikeRange * strikeInterval);

    console.log('ATM:', atm, 'Range:', minStrike, '-', maxStrike);

    // Parse instruments and filter
    const relevantInstruments: any[] = [];
    const targetExpiry = new Date(expiry).toISOString().split('T')[0];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      const instrument: any = {};
      headers.forEach((header, idx) => {
        instrument[header.trim()] = values[idx]?.trim();
      });
      
      const symbolMatches = instrument.name === index;
      const isOption = instrument.instrument_type === 'CE' || instrument.instrument_type === 'PE';
      const strike = parseFloat(instrument.strike);
      const inRange = strike >= minStrike && strike <= maxStrike;
      
      if (symbolMatches && isOption && inRange) {
        const instExpiry = new Date(instrument.expiry).toISOString().split('T')[0];
        if (instExpiry === targetExpiry) {
          relevantInstruments.push({
            instrument_token: instrument.instrument_token,
            tradingsymbol: instrument.tradingsymbol,
            strike: strike,
            instrument_type: instrument.instrument_type,
            expiry: instrument.expiry,
          });
        }
      }
    }

    console.log(`Found ${relevantInstruments.length} relevant instruments`);

    if (relevantInstruments.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No instruments found for the given criteria',
          data: [],
          underlying: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch quotes for all instruments (max 500 per request)
    const instrumentTokens = relevantInstruments.map(i => `NFO:${i.tradingsymbol}`);
    
    // Also add index spot for underlying price
    const indexSymbol = index === 'SENSEX' ? 'BSE:SENSEX' : `NSE:${index}`;
    instrumentTokens.push(indexSymbol);
    
    // Split into chunks of 500
    const chunks = [];
    for (let i = 0; i < instrumentTokens.length; i += 500) {
      chunks.push(instrumentTokens.slice(i, i + 500));
    }

    console.log(`Fetching quotes in ${chunks.length} chunk(s)...`);

    const allQuotes: any = {};
    
    for (const chunk of chunks) {
      const quotesUrl = `https://api.kite.trade/quote?${chunk.map(t => `i=${t}`).join('&')}`;
      
      const quotesResponse = await fetch(quotesUrl, {
        headers: {
          'Authorization': `token ${KITE_API_KEY}:${tokenData.access_token}`,
        },
      });

      if (!quotesResponse.ok) {
        const errorText = await quotesResponse.text();
        console.error('Quotes fetch failed:', errorText);
        continue;
      }

      const quotesData = await quotesResponse.json();
      if (quotesData.data) {
        Object.assign(allQuotes, quotesData.data);
      }
    }

    console.log('Quotes fetched, transforming data...');

    // Transform to BhavCopyRow format
    const bhavCopyData: BhavCopyRow[] = [];
    const expiryFormatted = new Date(expiry).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase().replace(/ /g, '-');

    for (const instrument of relevantInstruments) {
      const quoteKey = `NFO:${instrument.tradingsymbol}`;
      const quote = allQuotes[quoteKey];
      
      if (!quote) continue;

      bhavCopyData.push({
        SYMBOL: index,
        INSTRUMENT: 'OPTIDX',
        OPTION_TYP: instrument.instrument_type as 'CE' | 'PE',
        STRIKE_PR: instrument.strike,
        EXPIRY_DT: expiryFormatted,
        OPEN: quote.ohlc?.open || quote.last_price,
        HIGH: quote.ohlc?.high || quote.last_price,
        LOW: quote.ohlc?.low || quote.last_price,
        CLOSE: quote.last_price,
        SETTLE_PR: quote.last_price,
        OPEN_INT: quote.oi || 0,
        CHG_IN_OI: quote.oi_day_change || 0,
      });
    }

    // Get underlying data
    const underlyingQuote = allQuotes[indexSymbol];
    const underlying = underlyingQuote ? {
      high: underlyingQuote.ohlc?.high || underlyingQuote.last_price,
      low: underlyingQuote.ohlc?.low || underlyingQuote.last_price,
      close: underlyingQuote.last_price,
      open: underlyingQuote.ohlc?.open || underlyingQuote.last_price,
    } : null;

    console.log(`Returning ${bhavCopyData.length} option chain rows`);

    return new Response(
      JSON.stringify({ 
        data: bhavCopyData,
        underlying,
        atm,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Option chain error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
