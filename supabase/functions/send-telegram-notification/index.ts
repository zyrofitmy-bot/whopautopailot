import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TG_BOT_TOKEN = "8709248334:AAFq3gcC0LG7yXZkNjQkweNOTb29v4QcgHE";
const TG_ADMIN_CHAT_ID = "8766641148";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, photo, photo_url, parse_mode = "HTML" } = await req.json();

        if (!message) {
            return new Response(JSON.stringify({ error: "No message provided" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let result;

        if (photo_url) {
            // Send photo via direct URL (e.g. avatar_url from profile)
            const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TG_ADMIN_CHAT_ID,
                    photo: photo_url,
                    caption: message,
                    parse_mode,
                }),
            });
            result = await response.json();

            // If photo send fails (e.g. URL not accessible), fall back to text
            if (!result.ok) {
                const fallback = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: TG_ADMIN_CHAT_ID,
                        text: message,
                        parse_mode,
                    }),
                });
                result = await fallback.json();
            }
        } else if (photo) {
            // Handle base64 Photo Upload
            const formData = new FormData();
            formData.append("chat_id", TG_ADMIN_CHAT_ID);
            formData.append("caption", message);
            formData.append("parse_mode", parse_mode);

            const base64Data = photo.split(",")[1];
            const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const blob = new Blob([binaryData], { type: "image/jpeg" });
            formData.append("photo", blob, "screenshot.jpg");

            const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`, {
                method: "POST",
                body: formData,
            });
            result = await response.json();
        } else {
            // Text Only
            const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TG_ADMIN_CHAT_ID,
                    text: message,
                    parse_mode,
                }),
            });
            result = await response.json();
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
