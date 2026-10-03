import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const EMPTY_DATA = {
  selectedDate: "",
  categoryLabels: {},
  tasks: [],
  records: {},
  updatedAt: ""
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeData(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Saved routine data must be an object.");
  }

  const records = payload.records && typeof payload.records === "object" ? payload.records : {};
  if (JSON.stringify(records).length > 5_000_000) {
    throw new Error("Saved routine data is too large.");
  }

  return {
    selectedDate: String(payload.selectedDate || ""),
    categoryLabels: payload.categoryLabels && typeof payload.categoryLabels === "object" ? payload.categoryLabels : {},
    tasks: Array.isArray(payload.tasks) ? payload.tasks.slice(0, 300) : [],
    records,
    updatedAt: new Date().toISOString()
  };
}

export function createRoutineStore(env = process.env) {
  const dataDir = env.DATA_DIR || join(process.cwd(), "data");
  const dataFile = env.DATA_FILE || join(dataDir, "routine-data.json");

  async function read() {
    try {
      const content = await readFile(dataFile, "utf8");
      return { ...clone(EMPTY_DATA), ...JSON.parse(content) };
    } catch (error) {
      if (error && error.code === "ENOENT") return clone(EMPTY_DATA);
      throw error;
    }
  }

  async function write(payload) {
    const data = normalizeData(payload);
    await mkdir(dirname(dataFile), { recursive: true });
    const tempFile = `${dataFile}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempFile, JSON.stringify(data, null, 2), "utf8");
    await rename(tempFile, dataFile);
    return data;
  }

  return { dataFile, read, write };
}
