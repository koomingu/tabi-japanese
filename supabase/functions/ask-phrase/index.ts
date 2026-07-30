import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const phraseSystem = `You help Korean travelers use natural, polite Japanese. Return JSON only with japanese, pronunciation, meaning, usage, caution. Keep each field concise. The pronunciation must be Korean Hangul. Prefer expressions that are immediately usable during travel.`;
const conversationSystem = `You help Korean travelers understand spoken Japanese during travel. Translate the supplied Japanese naturally into Korean. Return JSON only with korean, pronunciation, keywords. pronunciation must be Korean Hangul. keywords must be an array of at most 3 short Korean explanations. Be concise and do not invent details.`;
const speakSystem = `You help Korean travelers say natural, polite Japanese during travel. Convert the supplied Korean into one immediately usable Japanese expression. Return JSON only with japanese, pronunciation, meaning. pronunciation must be Korean Hangul. meaning must be a concise Korean explanation. Prefer simple beginner-friendly words.`;
const importSystem = `You extract useful Japanese phrases from a social-media screenshot, a public post caption, or provided text for Korean travelers. Return JSON only in this exact shape: {"phrases":[{"japanese":"...","pronunciation":"Korean Hangul reading","meaning":"natural Korean meaning","category":"식당|교통|쇼핑|숙소|길 묻기|관광지|카페|병원·약국|기타","usage":"short Korean usage note"}]}. Extract at most 8 phrases. Exclude usernames, hashtags, brand names, song lyrics, duplicated text, isolated words, and text that is not Japanese. Preserve Japanese punctuation. Never invent phrases not present in the supplied content.`;

function isAllowedInstagramUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "instagram.com" || host.endsWith(".instagram.com"));
  } catch {
    return false;
  }
}

async function getInstagramOembedText(url: string) {
  if (!isAllowedInstagramUrl(url)) throw new Error("인스타그램 공개 링크만 분석할 수 있어요.");
  const token = Deno.env.get("INSTAGRAM_OEMBED_ACCESS_TOKEN");
  if (!token) throw new Error("링크 분석이 아직 설정되지 않았어요. 스크린샷 또는 자막 텍스트를 사용해 주세요.");
  const endpoint = new URL("https://graph.facebook.com/instagram_oembed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("access_token", token);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("공개 게시물 정보를 읽지 못했어요. 스크린샷 또는 자막 텍스트를 사용해 주세요.");
  const data = await response.json();
  return typeof data.title === "string" ? data.title : "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const { question, japanese, korean, mode, imageDataUrl, url, sourceText } = await request.json();
    const key = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL");
    if (!key || !model) throw new Error("AI service is not configured");

    if (mode === "import") {
      if (imageDataUrl && (typeof imageDataUrl !== "string" || !/^data:image\/(png|jpeg|webp);base64,/i.test(imageDataUrl) || imageDataUrl.length > 7_000_000)) throw new Error("invalid image");
      if (url && (typeof url !== "string" || url.length > 2000)) throw new Error("invalid url");
      if (sourceText && (typeof sourceText !== "string" || sourceText.length > 3000)) throw new Error("source text is too long");
      if (!imageDataUrl && !url && !sourceText) throw new Error("an image, link, or text is required");

      const oembedText = url ? await getInstagramOembedText(url) : "";
      const text = [sourceText, oembedText].filter(Boolean).join("\n").slice(0, 3000);
      const content: Array<Record<string, string>> = [{ type: "input_text", text: `${importSystem}\n\nProvided post text:\n${text || "(none; inspect the image)"}` }];
      if (imageDataUrl) content.push({ type: "input_image", image_url: imageDataUrl, detail: "high" });
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: [{ role: "user", content }], text: { format: { type: "json_object" } } })
      });
      if (!response.ok) throw new Error("AI request failed");
      const answer = JSON.parse((await response.json()).output_text);
      return new Response(JSON.stringify(answer), { headers });
    }

    const input = mode === "conversation" ? japanese : mode === "speak" ? korean : question;
    if (!input || typeof input !== "string") throw new Error("question is required");
    if (input.trim().length > 400) throw new Error("question is too long");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: [{ role: "developer", content: mode === "conversation" ? conversationSystem : mode === "speak" ? speakSystem : phraseSystem }, { role: "user", content: input }], text: { format: { type: "json_object" } } })
    });
    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    return new Response(JSON.stringify(JSON.parse(data.output_text)), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400, headers });
  }
});
