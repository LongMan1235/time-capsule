import { env } from "../config/env.js";

export async function searchMemories(userId: string, query: string) {
  const response = await fetch(`${env.AI_SEARCH_URL}/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId, query })
  });

  if (!response.ok) {
    throw new Error(`AI search failed: ${response.status}`);
  }

  return response.json();
}

export async function queueMediaIndex(mediaId: string) {
  await fetch(`${env.AI_SEARCH_URL}/index`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mediaId })
  }).catch(() => undefined);
}
