import { FastifyInstance } from "fastify";
import { PublisherService } from "../services/publisher";

export async function publishRoutes(fastify: FastifyInstance) {
  const publisher = new PublisherService(fastify.redis);

  fastify.post("/:postId", { preHandler: [fastify.authenticate] }, async (req) => {
    const { postId } = req.params as any;
    const job = await publisher.publishPost(postId, req.user.sub);
    return { jobId: job.id };
  });

  fastify.get("/status/:jobId", { preHandler: [fastify.authenticate] }, async (req) => {
    const { jobId } = req.params as any;
    const status = await publisher.getJobStatus(jobId);
    return status || { error: "Job not found" };
  });
}
