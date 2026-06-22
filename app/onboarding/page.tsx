"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [posts, setPosts] = useState(["", "", ""]);
  const [brandName, setBrandName] = useState("");
  const router = useRouter();

  const handleUpload = async () => {
    const res = await fetch("/api/v1/brand/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandName, posts }),
      credentials: "include",
    });
    if (res.ok) router.push("/dashboard/calendar");
    else alert("Failed to analyze voice");
  };

  return (
    <div>
      <h1>Set up your brand voice</h1>
      <input placeholder="Brand name" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
      {posts.map((p, i) => (
        <textarea
          key={i}
          placeholder={`Example post ${i + 1} (100–1000 chars, no URLs)`}
          value={p}
          onChange={(e) => {
            const copy = [...posts];
            copy[i] = e.target.value;
            setPosts(copy);
          }}
          maxLength={1000}
        />
      ))}
      <button onClick={handleUpload}>Analyze my voice</button>
    </div>
  );
}
