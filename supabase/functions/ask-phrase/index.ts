import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const system = `You help Korean travelers use natural, polite Japanese. Return JSON only with japanese, pronunciation, meaning, usage, caution. Keep each field concise. The pronunciation must be Korean Hangul. Prefer expressions that are immediately usable during travel.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const { question } = await request.json();
    if (!question || typeof question !== "string") throw new Error("question is required");
    const key = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL");
    if (!key || !model) throw new Error("AI service is not configured");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: [{ role: "developer", content: system }, { role: "user", content: question }], text: { format: { type: "json_object" } } })
    });
    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    const answer = JSON.parse(data.output_text);
    return new Response(JSON.stringify(answer), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400, headers });
  }
});
