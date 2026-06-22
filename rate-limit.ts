import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";

export default fp(async (fastify) => {
  fastify.register(rateLimit, {
    max: 1000,
    timeWindow: "1 hour",
    allowList: ["127.0.0.1"],
  });
});
