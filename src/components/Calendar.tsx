"use client";
import { useUIStore } from "@/stores/ui-store";

export function Calendar({ posts, view }: { posts: any[]; view: "week" | "month" }) {
  const openEdit = useUIStore((s) => s.openEditModal);
  return (
    <div>
      <h2>{view} view</h2>
      {posts.length === 0 ? (
        <p>No posts yet. Generate your first week!</p>
      ) : (
        posts.map((p) => (
          <div
            key={p.id}
            onClick={() => openEdit(p.id)}
            style={{ cursor: "pointer", border: "1px solid #ccc", margin: 4, padding: 8 }}
          >
            <strong>{p.platform}</strong> – {p.status} – {p.content?.substring(0, 60)}...
          </div>
        ))
      )}
    </div>
  );
}
