import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export async function generateClaude(topic: string, tone: number): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 500,
    system: `You are a social media expert. Tone modifier: ${tone}. Write a post about: ${topic}`,
    messages: [{ role: "user", content: topic }],
  });
  const first = msg.content[0];
  return first.type === "text" ? first.text : "";
}
