import { FastifyInstance } from "fastify";
import { MediaService } from "../services/media";
import pool from "../db";

export async function integrationRoutes(fastify: FastifyInstance) {
  const mediaService = new MediaService(pool);

  // Google Drive OAuth
  fastify.get("/drive/auth", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const state = fastify.jwt.sign({ sub: req.user.sub, provider: "google_drive" }, { expiresIn: "10m" });
    const redirectUri = `${process.env.BASE_URL}/api/v1/integrations/drive/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&state=${state}&access_type=offline&prompt=consent`;
    reply.redirect(authUrl);
  });

  fastify.get("/drive/callback", async (req, reply) => {
    const { code, state } = req.query as any;
    let decoded: { sub: string; provider: string };
    try {
      decoded = fastify.jwt.verify<{ sub: string; provider: string }>(state);
    } catch {
      return reply.status(400).send({ error: "Invalid OAuth state" });
    }
    if (decoded.provider !== "google_drive") return reply.status(400).send({ error: "Invalid OAuth state" });
    const userId = decoded.sub;
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const body = new URLSearchParams();
    body.append("code", code);
    body.append("client_id", process.env.GOOGLE_CLIENT_ID!);
    body.append("client_secret", process.env.GOOGLE_CLIENT_SECRET!);
    body.append("redirect_uri", `${process.env.BASE_URL}/api/v1/integrations/drive/callback`);
    body.append("grant_type", "authorization_code");
    const tokenRes = await fetch(tokenUrl, { method: "POST", body });
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (tokenData.access_token) {
      await mediaService.storeToken(userId, "google_drive", tokenData.access_token);
    }
    reply.redirect(`${process.env.WEB_BASE_URL || "http://localhost:3000"}/dashboard/settings?connected=drive`);
  });

  // Dropbox OAuth
  fastify.get("/dropbox/auth", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const redirectUri = `${process.env.BASE_URL}/api/v1/integrations/dropbox/callback`;
    const state = fastify.jwt.sign({ sub: req.user.sub, provider: "dropbox" }, { expiresIn: "10m" });
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&state=${state}&token_access_type=offline`;
    reply.redirect(authUrl);
  });

  fastify.get("/dropbox/callback", async (req, reply) => {
    const { code, state } = req.query as any;
    let decoded: { sub: string; provider: string };
    try {
      decoded = fastify.jwt.verify<{ sub: string; provider: string }>(state);
    } catch {
      return reply.status(400).send({ error: "Invalid OAuth state" });
    }
    if (decoded.provider !== "dropbox") return reply.status(400).send({ error: "Invalid OAuth state" });
    const userId = decoded.sub;
    const tokenUrl = "https://api.dropboxapi.com/oauth2/token";
    const body = new URLSearchParams();
    body.append("code", code);
    body.append("grant_type", "authorization_code");
    body.append("client_id", process.env.DROPBOX_CLIENT_ID!);
    body.append("client_secret", process.env.DROPBOX_CLIENT_SECRET!);
    body.append("redirect_uri", `${process.env.BASE_URL}/api/v1/integrations/dropbox/callback`);
    const tokenRes = await fetch(tokenUrl, { method: "POST", body });
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (tokenData.access_token) {
      await mediaService.storeToken(userId, "dropbox", tokenData.access_token);
    }
    reply.redirect(`${process.env.WEB_BASE_URL || "http://localhost:3000"}/dashboard/settings?connected=dropbox`);
  });

  // Integration status check
  fastify.get("/status", { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = req.user.sub;
    const status = await mediaService.getIntegrationStatus(userId);
    return status;
  });

  // Canva embed
  fastify.post("/canva/embed", { preHandler: [fastify.authenticate] }, async (req) => {
    const token = fastify.jwt.sign({ userId: req.user.sub }, { expiresIn: "1h" });
    const embedUrl = `https://canva.com/embed?token=${token}`;
    return { embedUrl };
  });

  // Media listing endpoints
  fastify.get("/drive/files", { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = req.user.sub;
    const files = await mediaService.listDriveFiles(userId);
    return files;
  });

  fastify.get("/drive/file/:fileId/download", { preHandler: [fastify.authenticate] }, async (req) => {
    const { fileId } = req.params as any;
    const url = await mediaService.getDriveFileDownloadUrl(req.user.sub, fileId);
    return { url };
  });

  fastify.get("/dropbox/files", { preHandler: [fastify.authenticate] }, async (req) => {
    const files = await mediaService.listDropboxFiles(req.user.sub);
    return files;
  });

  fastify.get("/dropbox/file/download", { preHandler: [fastify.authenticate] }, async (req) => {
    const { path } = req.query as any;
    if (!path) return { error: "path required" };
    const url = await mediaService.getDropboxFileDownloadUrl(req.user.sub, path);
    return { url };
  });
}
