import type { Env, UserRow } from "../types";
import { badRequest, json } from "../lib/http";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const MAX_TOPIC_LENGTH = 500;

interface SuggestResult {
  caption: string;
  hashtags: string[];
}

function extractJson(text: string): SuggestResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.caption === "string" && Array.isArray(parsed.hashtags)) {
      return { caption: parsed.caption, hashtags: parsed.hashtags.map(String).slice(0, 10) };
    }
  } catch {
    // fall through
  }
  return null;
}

export async function handleAiSuggest(request: Request, env: Env, _user: UserRow): Promise<Response> {
  let body: { topic?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json_body");
  }

  const topic = (body.topic ?? "").trim();
  if (!topic || topic.length > MAX_TOPIC_LENGTH) {
    return badRequest("topic_required");
  }

  const prompt = `Suggest a short, engaging TikTok caption and 3-6 relevant hashtags for a video about: "${topic}".
Reply with ONLY a JSON object, no other text: {"caption": "...", "hashtags": ["tag1", "tag2"]}
Hashtags should not include the "#" character. Caption should be under 150 characters.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error("anthropic_request_failed", res.status, await res.text());
    return json({ error: "ai_suggestion_failed" }, { status: 502 });
  }

  const data = await res.json<{ content: { type: string; text: string }[] }>();
  const text = data.content?.find((block) => block.type === "text")?.text ?? "";
  const suggestion = extractJson(text);

  if (!suggestion) {
    return json({ caption: text.trim().slice(0, 150), hashtags: [] });
  }

  return json(suggestion);
}
