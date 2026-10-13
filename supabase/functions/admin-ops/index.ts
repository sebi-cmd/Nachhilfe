import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function hmacVerify(secret: string, message: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, bookingId, token } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify token by checking against all admin password hashes
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [payload, sig] = parts;

    // Check token expiry
    try {
      const { exp } = JSON.parse(atob(payload));
      if (Date.now() >= exp) {
        return new Response(
          JSON.stringify({ error: "Sitzung abgelaufen" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin password hashes to verify token signature
    const { data: admins, error: adminError } = await sb.from('admin_users').select('password_hash');
    if (adminError || !admins || admins.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let valid = false;
    for (const admin of admins) {
      if (await hmacVerify(admin.password_hash, payload, sig)) {
        valid = true;
        break;
      }
    }

    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute admin action
    if (action === 'cancel' && bookingId) {
      const { error } = await sb.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === 'restore' && bookingId) {
      const { error } = await sb.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === 'delete' && bookingId) {
      const { error } = await sb.from('bookings').delete().eq('id', bookingId);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ error: "Unbekannte Aktion" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Server-Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
