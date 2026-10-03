import { pullRoutineData, pushRoutineData } from "../lib/sync.js";

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  return body ? JSON.parse(body) : {};
}

function send(res, status, data) {
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.status(status).send(JSON.stringify(data));
}

export default async function handler(req, res) {
  try {
    if (req.method === "OPTIONS") {
      send(res, 204, {});
      return;
    }

    if (req.method === "GET") {
      send(res, 200, await pullRoutineData());
      return;
    }

    if (req.method !== "POST") {
      send(res, 405, { ok: false, error: "Method not allowed." });
      return;
    }

    const payload = await readJson(req);
    send(res, 200, await pushRoutineData(payload));
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected sync error."
    });
  }
}
