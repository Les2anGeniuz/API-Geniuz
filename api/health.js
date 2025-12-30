import { cors } from "../lib/cors.js";

export default function handler(req, res) {
  cors(req, res);
  res.status(200).json({ status: "ok", service: "API-Geniuz" });
}
