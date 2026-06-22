"use client";
import { useUIStore } from "@/stores/ui-store";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export function PostEditor() {
  const postId = useUIStore((s) => s.editPostId);
  const close = () => useUIStore.getState().openEditModal(null);
  const [content, setContent] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    if (postId) {
      fetchWithAuth(`/api/v1/calendar/posts/${postId}`)
        .then((r) => r.json())
        .then((p) => {
          setContent(p.content || "");
          setScheduledTime(p.scheduled_time ? p.scheduled_time.slice(0, 16) : "");
        });
    }
  }, [postId]);

  if (!postId) return null;

  const handleSave = async () => {
    await fetchWithAuth(`/api/v1/calendar/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify({ content, scheduledTime }),
    });
    close();
  };

  const handleRegenerate = async () => {
    await fetchWithAuth(`/api/v1/calendar/posts/${postId}/regenerate`, {
      method: "POST",
    });
    setTimeout(() => {
      fetchWithAuth(`/api/v1/calendar/posts/${postId}`)
        .then((r) => r.json())
        .then((p) => {
          setContent(p.content || "");
          setScheduledTime(p.scheduled_time ? p.scheduled_time.slice(0, 16) : "");
        });
    }, 3000);
  };

  return (
    <div style={{ position: "fixed", top: 40, left: "20%", background: "#fff", padding: 20, border: "2px solid" }}>
      <h3>Edit Post</h3>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2200} rows={5} cols={50} />
      <br />
      <input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
      <br />
      <button onClick={handleSave}>Save</button>
      <button onClick={handleRegenerate}>Regenerate</button>
      <button onClick={close}>Cancel</button>
    </div>
  );
}
