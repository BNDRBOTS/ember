export async function applyAntiDetection(text: string): Promise<string> {
  const resp = await fetch(`${process.env.ANTI_DETECTION_URL}/transform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) throw new Error(`Anti-detection proxy failed: ${resp.status}`);
  const data = (await resp.json()) as { transformed?: string };
  return data.transformed || text;
}
