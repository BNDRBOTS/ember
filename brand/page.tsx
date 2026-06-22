"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export default function BrandSettings() {
  const [tone, setTone] = useState(0);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchWithAuth("/api/v1/brand/settings")
      .then((r) => r.json())
      .then((d) => {
        setTone(d.tone_slider ?? 0);
        setBannedWords(d.banned_words ?? []);
      });
  }, []);

  const handleSave = async () => {
    await fetchWithAuth("/api/v1/brand/settings", {
      method: "PUT",
      body: JSON.stringify({ toneSlider: tone, bannedWords }),
    });
    setSaved(true);
  };

  return (
    <div>
      <h2>Brand Settings</h2>
      <label>Tone slider: {tone}</label>
      <input
        type="range"
        min={-2}
        max={2}
        step={1}
        value={tone}
        onChange={(e) => setTone(Number(e.target.value))}
      />
      <div>
        <label>Banned words (comma separated)</label>
        <input
          type="text"
          value={bannedWords.join(",")}
          onChange={(e) =>
            setBannedWords(e.target.value.split(",").filter(Boolean))
          }
        />
      </div>
      <button onClick={handleSave}>Save</button>
      {saved && <span>Saved!</span>}
    </div>
  );
}
