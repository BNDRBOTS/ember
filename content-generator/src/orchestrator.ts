import { generateClaude } from "./ai-clients/claude";
import { generateGPT4Turbo } from "./ai-clients/gpt4-turbo";
import { generateLlamaRunPod } from "./ai-clients/llama-runpod";

export async function orchestrateGeneration(
  userId: string,
  postType: string,
  topic: string,
  toneSlider: number
): Promise<string> {
  switch (postType) {
    case "story":
    case "reel-hook":
      return generateClaude(topic, toneSlider);
    case "product-launch":
    case "cta":
      return generateGPT4Turbo(topic, toneSlider);
    case "personal-rant":
    case "reply":
      return generateLlamaRunPod(userId, topic, toneSlider);
    default:
      return generateClaude(topic, toneSlider);
  }
}
