import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  const { data: authData } = await userClient.auth.getUser();
  const { data: currentProfile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', authData.user?.id)
    .single();
  if (currentProfile?.role !== 'admin') {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await req.json();

  if (body.action === 'delete') {
    const { error } = await adminClient.auth.admin.deleteUser(body.userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  const { name, username, password, role } = body;
  const normalizedUsername = String(username).trim().toLowerCase();
  const email = `${normalizedUsername}@quiniela.local`;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) return json({ error: error.message }, 400);

  const { error: profileError } = await adminClient.from('profiles').insert({
    id: data.user.id,
    name,
    username: normalizedUsername,
    role: role === 'admin' ? 'admin' : 'user',
  });

  if (profileError) return json({ error: profileError.message }, 400);
  return json({ id: data.user.id });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
