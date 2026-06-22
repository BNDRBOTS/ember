import { parseJsonOrThrow, requireExternalId } from "./http";

export async function linkedinPublish(token: string, text: string, mediaUrl?: string) {
  const body: any = {
    author: `urn:li:organization:${process.env.LINKEDIN_ORG_ID}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: mediaUrl ? "IMAGE" : "NONE",
        media: mediaUrl ? [{ status: "READY", originalUrl: mediaUrl }] : [],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonOrThrow<{ id?: string }>(resp, "LinkedIn");
  return requireExternalId(data.id, "LinkedIn");
}
