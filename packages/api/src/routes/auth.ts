import { FastifyInstance } from "fastify";
import { z } from "zod";
import { UserService } from "../services/user";
import pool from "../db";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  const userService = new UserService(pool);

  fastify.post("/register", async (request, reply) => {
    const parsed = registerSchema.parse(request.body);
    const userId = await userService.createUser(parsed.email, parsed.password, parsed.name);
    const token = fastify.jwt.sign({ sub: userId, email: parsed.email });
    const secure = process.env.NODE_ENV === "production";
    reply.setCookie("token", token, { httpOnly: true, secure, sameSite: "strict", path: "/" });
    return { userId };
  });

  fastify.post("/login", async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    const userId = await userService.validateUser(email, password);
    if (!userId) return reply.status(401).send({ error: "Invalid credentials" });
    const token = fastify.jwt.sign({ sub: userId, email });
    const secure = process.env.NODE_ENV === "production";
    reply.setCookie("token", token, { httpOnly: true, secure, sameSite: "strict", path: "/" });
    return { userId };
  });
}
