import { fetchWithAuth } from "./auth";

export async function generateWeek() {
  const res = await fetchWithAuth("/api/v1/calendar/generate", { method: "POST" });
  return res.json();
}

export async function publishPost(postId: string) {
  const res = await fetchWithAuth(`/api/v1/publish/${postId}`, { method: "POST" });
  return res.json();
}
