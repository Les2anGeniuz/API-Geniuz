import serverless from "serverless-http";
import app from "../backend/server.js";

const handler = serverless(app);

export default function (req, res) {
  return handler(req, res);
}
