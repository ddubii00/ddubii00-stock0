const APP_NAME = "ddubii-stock0";

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Sync payload must be an object.");
  }

  return {
    source: APP_NAME,
    selectedDate: String(payload.selectedDate || ""),
    clientId: String(payload.clientId || ""),
    clientSavedAt: String(payload.clientSavedAt || new Date().toISOString()),
    categoryLabels: payload.categoryLabels && typeof payload.categoryLabels === "object" ? payload.categoryLabels : {},
    tasks: Array.isArray(payload.tasks) ? payload.tasks.slice(0, 300) : [],
    mottos: Array.isArray(payload.mottos) ? payload.mottos.slice(0, 300) : [],
    records: payload.records && typeof payload.records === "object" ? payload.records : {}
  };
}

async function postToAppsScript(body, env) {
  const scriptUrl = env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return {
      ok: true,
      configured: false,
      synced: false,
      message: "Google Sheets sync is not configured."
    };
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      ...body,
      secret: env.GOOGLE_SYNC_SECRET || ""
    })
  });
  const text = await response.text();
  let upstream = text;

  try {
    upstream = JSON.parse(text);
  } catch {
    // Google Apps Script may return plain text on deployment/auth errors.
  }

  if (!response.ok) {
    throw new Error(typeof upstream === "string" ? upstream : upstream.error || `Sync failed with ${response.status}`);
  }

  if (upstream && typeof upstream === "object" && upstream.ok === false) {
    throw new Error(upstream.error || "Google Sheets sync failed.");
  }

  return {
    ok: true,
    configured: true,
    synced: true,
    provider: "google-apps-script",
    upstream
  };
}

export async function pushRoutineData(payload, env = process.env) {
  return postToAppsScript({
    mode: "push",
    payload: normalizePayload(payload),
    receivedAt: new Date().toISOString()
  }, env);
}

export async function pullRoutineData(env = process.env) {
  return postToAppsScript({
    mode: "pull",
    source: APP_NAME,
    receivedAt: new Date().toISOString()
  }, env);
}
