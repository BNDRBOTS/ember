import { parseJsonOrThrow, requireExternalId } from "./http";

export async function facebookPublish(token: string, content: string, mediaUrl?: string) {
  const form = new FormData();
  form.append("message", content);
  if (mediaUrl) form.append("url", mediaUrl);
  const resp = await fetch(`https://graph.facebook.com/v19.0/me/feed?access_token=${token}`, {
    method: "POST",
    body: form,
  });
  const data = await parseJsonOrThrow<{ id?: string }>(resp, "Facebook");
  return requireExternalId(data.id, "Facebook");
}
