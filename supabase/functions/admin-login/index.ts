import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function createToken(passwordHash: string): Promise<string> {
  const payload = btoa(JSON.stringify({ exp: Date.now() + 1000 * 60 * 60 * 24 }));
  const sig = await hmacSign(passwordHash, payload);
  return `${payload}.${sig}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: adminUser, error } = await sb
      .from('admin_users')
      .select('password_hash')
      .eq('username', username.trim())
      .maybeSingle();

    if (error || !adminUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Falsche Zugangsdaten" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password using PBKDF2
    const [iterationsStr, saltHex, storedHashHex] = adminUser.password_hash.split(':');
    const iterations = parseInt(iterationsStr, 10);
    const saltBytes = new Uint8Array(
      saltHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16))
    );

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );

    const computedHashHex = [...new Uint8Array(derivedBits)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedHashHex !== storedHashHex) {
      return new Response(
        JSON.stringify({ success: false, error: "Falsche Zugangsdaten" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = await createToken(adminUser.password_hash);
    return new Response(
      JSON.stringify({ success: true, token }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Server-Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
