import fp from "fastify-plugin";
import websocket from "@fastify/websocket";

export default fp(async (fastify) => {
  fastify.register(websocket);
  fastify.get("/ws", { websocket: true }, (socket) => {
    socket.on("message", (msg: Buffer) => socket.send(msg));
  });
});
