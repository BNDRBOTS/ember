export interface Post {
  id: string;
  content: string;
  platform: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledTime?: string;
}
