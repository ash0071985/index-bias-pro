import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate checksum for Kite API
function generateChecksum(apiKey: string, requestToken: string, apiSecret: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + requestToken + apiSecret);
  
  // SHA256 hash using Web Crypto API
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }) as unknown as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const requestToken = url.searchParams.get('request_token');
    const status = url.searchParams.get('status');
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!requestToken) {
      // This is the redirect from Zerodha - redirect to frontend with token
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
      
      if (status === 'success' && url.searchParams.get('request_token')) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `${frontendUrl}/manual-entry?request_token=${url.searchParams.get('request_token')}`,
          }
        });
      }
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/manual-entry?error=auth_failed`,
        }
      });
    }

    // Exchange request_token for access_token
    const KITE_API_KEY = Deno.env.get('KITE_API_KEY');
    const KITE_API_SECRET = Deno.env.get('KITE_API_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!KITE_API_KEY || !KITE_API_SECRET) {
      console.error('Kite API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Kite API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate checksum
    const checksumInput = KITE_API_KEY + requestToken + KITE_API_SECRET;
    const encoder = new TextEncoder();
    const data = encoder.encode(checksumInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Exchanging request token for access token...');

    // Exchange for access token
    const tokenResponse = await fetch('https://api.kite.trade/session/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: KITE_API_KEY,
        request_token: requestToken,
        checksum: checksum,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.status === 'error') {
      console.error('Token exchange failed:', tokenData);
      return new Response(
        JSON.stringify({ error: tokenData.message || 'Token exchange failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Access token obtained successfully');

    // Get user ID from request body
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id;

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          access_token: tokenData.data.access_token,
          message: 'Token received but not stored (no user_id provided)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store token in database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Calculate expiry (Kite tokens expire at 6:00 AM IST next day)
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(30, 0, 0, 0); // Next day 6:00 AM

    const { error: dbError } = await supabase
      .from('zerodha_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.data.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Error storing token:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token stored successfully for user:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        expires_at: expiresAt.toISOString(),
        user_id: tokenData.data.user_id,
        user_name: tokenData.data.user_name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Callback error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
