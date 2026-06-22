import { parseJsonOrThrow, requireExternalId } from "./http";

export async function twitterPublish(token: string, text: string, mediaUrl?: string) {
  const body: any = { text };
  if (mediaUrl) body.media = { media_ids: [mediaUrl] };
  const resp = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonOrThrow<{ data?: { id?: string } }>(resp, "Twitter/X");
  return requireExternalId(data.data?.id, "Twitter/X");
}
