import { parseJsonOrThrow, requireExternalId } from "./http";

export async function tiktokPublish(token: string, videoUrl: string, caption: string) {
  if (!videoUrl) throw new Error("TikTok publish requires a video URL");
  const resp = await fetch("https://open.tiktokapis.com/v2/video/publish/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ video_url: videoUrl, caption }),
  });
  const data = await parseJsonOrThrow<{ data?: { video_id?: string } }>(resp, "TikTok");
  return requireExternalId(data.data?.video_id, "TikTok");
}
