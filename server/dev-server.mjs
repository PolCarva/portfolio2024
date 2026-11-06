import { createServer } from "node:http";
import session from "../api/session.js";
import content from "../api/content.js";
import upload from "../api/upload.js";
import media from "../api/media.js";
const handlers = {
  "/api/session": session,
  "/api/content": content,
  "/api/upload": upload,
  "/api/media": media,
};
export function createApiServer() {
  return createServer(async (req, res) => {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (value) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(value));
    };
    res.send = (value) => res.end(value);
    const handler = handlers[new URL(req.url, "http://localhost").pathname];
    if (!handler) {
      res.statusCode = 404;
      return res.end();
    }
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error.name);
      res.status(500).json({ error: "Error interno." });
    }
  });
}
