import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UserPayload = {
  action?: "create" | "delete";
  name?: string;
  username?: string;
  password?: string;
  role?: "admin" | "user";
  userId?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Missing Supabase environment variables" }, 500);
    }

    if (!authorization) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Invalid session" }, 401);
    }

    const { data: currentProfile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || currentProfile?.role !== "admin") {
      return json({ error: "Only admins can manage users" }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const body = (await req.json()) as UserPayload;

    if (body.action === "delete") {
      if (!body.userId) {
        return json({ error: "Missing userId" }, 400);
      }

      const { error } = await adminClient.auth.admin.deleteUser(body.userId);
      if (error) return json({ error: error.message }, 400);

      return json({ ok: true });
    }

    const name = String(body.name ?? "").trim();
    const normalizedUsername = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "user";

    if (!name || !normalizedUsername || !password) {
      return json({ error: "Name, username and password are required" }, 400);
    }

    const email = `${normalizedUsername}@quiniela.local`;

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    const { error: profileInsertError } = await adminClient.from("profiles").insert({
      id: data.user.id,
      name,
      username: normalizedUsername,
      role,
    });

    if (profileInsertError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return json({ error: profileInsertError.message }, 400);
    }

    return json({
      id: data.user.id,
      username: normalizedUsername,
      role,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
