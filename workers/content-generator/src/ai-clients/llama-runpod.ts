export async function generateLlamaRunPod(userId: string, topic: string, tone: number): Promise<string> {
  const resp = await fetch(process.env.RUNPOD_ENDPOINT!, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: { prompt: `Write a social media post about: ${topic}. Tone: ${tone}`, max_tokens: 500 } }),
  });
  const data = (await resp.json()) as { output?: { text?: string } };
  return data.output?.text || "";
}
