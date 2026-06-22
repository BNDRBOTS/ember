import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export async function generateGPT4Turbo(topic: string, tone: number): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-turbo",
    messages: [{ role: "user", content: `Write a marketing post about: ${topic}. Tone: ${tone}` }],
    max_tokens: 500,
  });
  return completion.choices[0].message.content || "";
}
