import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
    try {
        const { data: before } = await supabase.from('bundle_items').select('id, service_id, engagement_type').eq('engagement_type', 'saves');

        const { data, error } = await supabase
            .from("bundle_items")
            .update({ service_id: null })
            .eq("engagement_type", "saves")
            .select();

        if (error) throw error;

        return new Response(JSON.stringify({
            success: true,
            message: 'Unlinked Saves Items successfully',
            before,
            data
        }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Temp fix error:", err);
        return new Response(JSON.stringify({ error: err.message || "Failed to fix" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
});
