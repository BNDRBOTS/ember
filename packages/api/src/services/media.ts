import { Pool } from "pg";
import { decrypt, encrypt } from "./crypto";

export class MediaService {
  constructor(private pool: Pool) {}

  async storeToken(userId: string, platform: string, token: string, externalUserId?: string) {
    const encrypted = encrypt(token);
    await this.pool.query(
      `INSERT INTO user_platform_tokens (user_id, platform, token_encrypted, external_user_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, platform) DO UPDATE SET token_encrypted=$3, external_user_id=$4`,
      [userId, platform, encrypted, externalUserId || null]
    );
  }

  async getToken(userId: string, platform: string): Promise<string | null> {
    const res = await this.pool.query(
      `SELECT token_encrypted FROM user_platform_tokens WHERE user_id=$1 AND platform=$2`,
      [userId, platform]
    );
    if (res.rowCount === 0) return null;
    return decrypt(res.rows[0].token_encrypted);
  }

  async getIntegrationStatus(userId: string) {
    const res = await this.pool.query(
      `SELECT platform FROM user_platform_tokens WHERE user_id=$1`,
      [userId]
    );
    const status: any = { google_drive: false, dropbox: false };
    for (const row of res.rows) {
      if (row.platform === "google_drive") status.google_drive = true;
      if (row.platform === "dropbox") status.dropbox = true;
    }
    return status;
  }

  async listDriveFiles(userId: string, query?: string): Promise<any[]> {
    const token = await this.getToken(userId, "google_drive");
    if (!token) throw new Error("Not connected to Google Drive");
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("fields", "files(id,name,mimeType,webViewLink)");
    if (query) url.searchParams.set("q", query);
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    return data.files || [];
  }

  async getDriveFileDownloadUrl(userId: string, fileId: string): Promise<string> {
    const token = await this.getToken(userId, "google_drive");
    if (!token) throw new Error("Not connected to Google Drive");
    const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual",
    });
    if (resp.status === 302 || resp.status === 307) {
      return resp.headers.get("location")!;
    }
    const blob = await resp.blob();
    return `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
  }

  async listDropboxFiles(userId: string, path: string = ""): Promise<any[]> {
    const token = await this.getToken(userId, "dropbox");
    if (!token) throw new Error("Not connected to Dropbox");
    const resp = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });
    const data = await resp.json();
    return data.entries || [];
  }

  async getDropboxFileDownloadUrl(userId: string, path: string): Promise<string> {
    const token = await this.getToken(userId, "dropbox");
    if (!token) throw new Error("Not connected to Dropbox");
    const resp = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path }),
      },
    });
    const blob = await resp.blob();
    return `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
  }
}
