// api/index.js
import serverless from "serverless-http";
import app from "../backend/server.js";

const handler = serverless(app);

export const config = {
  runtime: "nodejs",
};

export default async function (req, res) {
  return await handler(req, res);
}
