import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const admin = createClient(url, serviceKey);
    const { data: profile } = await admin.from("profiles").select("role, active").eq("id", user.id).single();
    if (!profile?.active || !["super_admin", "administrator"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Administrator access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { username, fullName, role, teamId, temporaryPassword } = await req.json();
    if (!username || !fullName || !role || !temporaryPassword) throw new Error("Missing required fields");

    const email = `${String(username).trim().toLowerCase()}@coachbase.local`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      app_metadata: { username, full_name: fullName, role, must_change_password: true },
      user_metadata: { full_name: fullName },
    });
    if (createError || !created.user) throw createError ?? new Error("User creation failed");

    if (teamId && ["coach", "manager", "player"].includes(role)) {
      const { error: memberError } = await admin.from("team_members").insert({ team_id: teamId, user_id: created.user.id, role });
      if (memberError) throw memberError;
    }

    return new Response(JSON.stringify({ id: created.user.id, username, role }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
