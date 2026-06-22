import { facebookPublish } from "./facebook";
import { twitterPublish } from "./twitter";
import { linkedinPublish } from "./linkedin";
import { tiktokPublish } from "./tiktok";
import { pinterestPublish } from "./pinterest";

export async function publishToPlatform(
  platform: string,
  token: string,
  content: string,
  mediaUrl?: string
) {
  switch (platform) {
    case "facebook": return facebookPublish(token, content, mediaUrl);
    case "twitter": return twitterPublish(token, content, mediaUrl);
    case "linkedin": return linkedinPublish(token, content, mediaUrl);
    case "tiktok": return tiktokPublish(token, mediaUrl || "", content);
    case "pinterest": {
      const boardId = process.env.PINTEREST_BOARD_ID || "";
      return pinterestPublish(token, boardId, content, "", mediaUrl || "");
    }
    default: throw new Error(`Unknown platform: ${platform}`);
  }
}
