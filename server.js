import http from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { pullRoutineData, pushRoutineData } from "./lib/sync.js";
import { createRoutineStore } from "./lib/store.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(__dirname, "public");
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const store = createRoutineStore();
const passwordProtectionEnabled = process.env.REQUIRE_APP_PASSWORD === "true";
const appPassword = process.env.APP_PASSWORD || "";
const sessionSecret = process.env.APP_SESSION_SECRET || appPassword;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
  }

  return body ? JSON.parse(body) : {};
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((item) => {
    const index = item.indexOf("=");
    return index === -1 ? [] : [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1))];
  }).filter(([key]) => key));
}

function sessionSignature(expiresAt) {
  return createHmac("sha256", sessionSecret).update(`ddubii-stock0:${expiresAt}`).digest("base64url");
}

function isAuthenticated(req) {
  if (!passwordProtectionEnabled) return true;
  if (!appPassword || !sessionSecret) return false;
  const token = parseCookies(req.headers.cookie).ddubii_stock0_session;
  const [expiresAt, signature] = String(token || "").split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  const expected = sessionSignature(expiresAt);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function setSession(res, req) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  res.setHeader("set-cookie", `ddubii_stock0_session=${expiresAt}.${sessionSignature(expiresAt)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`);
}

function clearSession(res) {
  res.setHeader("set-cookie", "ddubii_stock0_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

function loginPage(message = "") {
  const error = message ? `<p class="error">${message}</p>` : "";
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ddubii-stock0 로그인</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f6f8;color:#17212b;font-family:system-ui,sans-serif}.box{width:min(360px,calc(100% - 40px);padding:32px;background:#fff;border:1px solid #dfe3e8;border-radius:8px}h1{margin:0 0 8px;font-size:22px}p{color:#64707d;line-height:1.5}label,input,button{display:block;width:100%;box-sizing:border-box}input{margin:8px 0 16px;padding:12px;border:1px solid #bdc5ce;border-radius:5px;font:inherit}button{padding:12px;border:0;border-radius:5px;background:#176b54;color:#fff;font:inherit;font-weight:700}.error{color:#b42318}</style></head><body><main class="box"><h1>ddubii-stock0</h1><p>이 투자 루틴 기록은 암호로 보호됩니다.</p>${error}<form method="post" action="/login"><label for="password">암호</label><input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" required autofocus><button type="submit">접속</button></form></main></body></html>`;
}

async function readFormBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return new URLSearchParams(body).get("password") || "";
}

async function serveStatic(res, pathname) {
  const safePath = normalize(pathname === "/" ? "/index.html" : pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "content-type": contentType });
    res.end(content);
  } catch {
    const fallback = await readFile(join(PUBLIC_DIR, "index.html"));
    res.writeHead(200, { "content-type": mimeTypes[".html"] });
    res.end(fallback);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, app: "ddubii-stock0" });
      return;
    }

    if (url.pathname === "/login") {
      if (req.method === "GET") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        res.end(loginPage());
        return;
      }
      const password = await readFormBody(req);
      const valid = appPassword && Buffer.byteLength(password) === Buffer.byteLength(appPassword) && timingSafeEqual(Buffer.from(password), Buffer.from(appPassword));
      if (!valid) {
        res.writeHead(401, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        res.end(loginPage("암호가 맞지 않습니다."));
        return;
      }
      setSession(res, req);
      res.writeHead(303, { location: "/" });
      res.end();
      return;
    }

    if (url.pathname === "/logout") {
      clearSession(res);
      res.writeHead(303, { location: "/login" });
      res.end();
      return;
    }

    if (!isAuthenticated(req)) {
      if (url.pathname.startsWith("/api/")) {
        sendJson(res, 401, { ok: false, error: "Password required." });
      } else {
        res.writeHead(303, { location: "/login" });
        res.end();
      }
      return;
    }

    if (url.pathname === "/api/data") {
      if (req.method === "GET") {
        sendJson(res, 200, { ok: true, configured: true, provider: "oracle-file", data: await store.read() });
        return;
      }
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed." });
        return;
      }
      const payload = await readJsonBody(req);
      sendJson(res, 200, { ok: true, configured: true, provider: "oracle-file", data: await store.write(payload) });
      return;
    }

    if (url.pathname === "/api/sync") {
      if (req.method === "OPTIONS") {
        sendJson(res, 204, {});
        return;
      }

      if (req.method === "GET") {
        sendJson(res, 200, await pullRoutineData());
        return;
      }

      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed." });
        return;
      }

      const payload = await readJsonBody(req);
      sendJson(res, 200, await pushRoutineData(payload));
      return;
    }

    await serveStatic(res, decodeURIComponent(url.pathname));
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error"
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ddubii-stock0 is running at http://${HOST}:${PORT}`);
});
