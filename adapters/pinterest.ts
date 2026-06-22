import { parseJsonOrThrow, requireExternalId } from "./http";

export async function pinterestPublish(token: string, boardId: string, note: string, link: string, imageUrl: string) {
  if (!boardId) throw new Error("Pinterest publish requires PINTEREST_BOARD_ID");
  if (!imageUrl) throw new Error("Pinterest publish requires an image URL");
  const body = {
    board_id: boardId,
    title: note,
    description: note,
    link: link || "https://ember.ai",
    media_source: { source_type: "image_url", url: imageUrl },
  };
  const resp = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonOrThrow<{ id?: string }>(resp, "Pinterest");
  return requireExternalId(data.id, "Pinterest");
}
