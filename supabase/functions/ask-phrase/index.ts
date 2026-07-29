import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const phraseSystem = `You help Korean travelers use natural, polite Japanese. Return JSON only with japanese, pronunciation, meaning, usage, caution. Keep each field concise. The pronunciation must be Korean Hangul. Prefer expressions that are immediately usable during travel.`;
const conversationSystem = `You help Korean travelers understand spoken Japanese during travel. Translate the supplied Japanese naturally into Korean. Return JSON only with korean, pronunciation, keywords. pronunciation must be Korean Hangul. keywords must be an array of at most 3 short Korean explanations. Be concise and do not invent details.`;
const speakSystem = `You help Korean travelers say natural, polite Japanese during travel. Convert the supplied Korean into one immediately usable Japanese expression. Return JSON only with japanese, pronunciation, meaning. pronunciation must be Korean Hangul. meaning must be a concise Korean explanation. Prefer simple beginner-friendly words.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const { question, japanese, korean, mode } = await request.json();
    const input = mode === "conversation" ? japanese : mode === "speak" ? korean : question;
    if (!input || typeof input !== "string") throw new Error("question is required");
    if (input.trim().length > 400) throw new Error("question is too long");
    const key = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL");
    if (!key || !model) throw new Error("AI service is not configured");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: [{ role: "developer", content: mode === "conversation" ? conversationSystem : mode === "speak" ? speakSystem : phraseSystem }, { role: "user", content: input }], text: { format: { type: "json_object" } } })
    });
    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    const answer = JSON.parse(data.output_text);
    return new Response(JSON.stringify(answer), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400, headers });
  }
});
