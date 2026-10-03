const RECORD_SHEET = "수행기록";
const SUMMARY_SHEET = "일별요약";
const RECORD_HEADERS = [
  "날짜",
  "항목ID",
  "번호",
  "카테고리",
  "항목",
  "수행여부",
  "체크",
  "오늘 핵심 메모",
  "못 한 이유",
  "내일 보완할 것",
  "클라이언트ID",
  "클라이언트 저장시각",
  "시트 반영시각"
];
const SUMMARY_HEADERS = ["날짜", "완료", "전체", "완료율", "안한 항목 수", "못 한 항목"];

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");
    verifySecret_(body.secret || "");

    if (body.mode === "pull") {
      return json_({
        ok: true,
        records: readRecords_(),
        tasks: readTasks_()
      });
    }

    if (body.mode !== "push") {
      throw new Error("Unknown sync mode.");
    }

    const result = pushPayload_(body.payload || {});
    return json_({
      ok: true,
      ...result
    });
  } catch (error) {
    return json_({
      ok: false,
      error: error.message || String(error)
    });
  }
}

function verifySecret_(incomingSecret) {
  const expected = PropertiesService.getScriptProperties().getProperty("SYNC_SECRET") || "";
  if (expected && incomingSecret !== expected) {
    throw new Error("Invalid sync secret.");
  }
}

function pushPayload_(payload) {
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const records = payload.records || {};
  const categoryLabels = payload.categoryLabels || {};
  const recordSheet = ensureSheet_(RECORD_SHEET, RECORD_HEADERS);
  const existing = readExistingRecordIndex_(recordSheet);
  const now = new Date().toISOString();
  let written = 0;

  Object.keys(records).sort().forEach((dateText) => {
    const record = records[dateText] || {};
    const checks = record.checks || {};
    const notes = record.notes || {};

    tasks.forEach((task) => {
      if (!task || !task.id) return;
      const checked = checks[task.id] === true;
      const row = [
        dateText,
        task.id,
        task.no || "",
        categoryLabels[task.category] || task.category || "",
        task.title || "",
        checked ? "함" : "안함",
        checked ? "TRUE" : "FALSE",
        notes.market || "",
        notes.trade || "",
        notes.tomorrow || "",
        payload.clientId || "",
        payload.clientSavedAt || "",
        now
      ];
      const key = `${dateText}|${task.id}`;
      const rowNumber = existing[key];

      if (rowNumber) {
        recordSheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
      } else {
        recordSheet.appendRow(row);
        existing[key] = recordSheet.getLastRow();
      }
      written += 1;
    });
  });

  rebuildSummary_(recordSheet);
  return {
    written,
    updatedAt: now
  };
}

function readRecords_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(RECORD_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return {};

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, RECORD_HEADERS.length).getValues();
  const records = {};

  values.forEach((row) => {
    const dateText = normalizeDate_(row[0]);
    const taskId = String(row[1] || "");
    if (!dateText || !taskId) return;

    if (!records[dateText]) {
      records[dateText] = {
        checks: {},
        notes: {
          market: "",
          trade: "",
          tomorrow: ""
        }
      };
    }

    records[dateText].checks[taskId] = String(row[5]) === "함" || String(row[6]).toUpperCase() === "TRUE";
    records[dateText].notes.market = records[dateText].notes.market || String(row[7] || "");
    records[dateText].notes.trade = records[dateText].notes.trade || String(row[8] || "");
    records[dateText].notes.tomorrow = records[dateText].notes.tomorrow || String(row[9] || "");
  });

  return records;
}

function readTasks_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(RECORD_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const taskMap = {};

  values.forEach((row) => {
    const taskId = String(row[1] || "");
    if (!taskId || taskMap[taskId]) return;
    taskMap[taskId] = {
      id: taskId,
      no: String(row[2] || ""),
      category: categoryKey_(String(row[3] || "")),
      title: String(row[4] || "")
    };
  });

  return Object.values(taskMap);
}

function rebuildSummary_(recordSheet) {
  const summarySheet = ensureSheet_(SUMMARY_SHEET, SUMMARY_HEADERS);
  const lastRow = recordSheet.getLastRow();
  summarySheet.clearContents();
  summarySheet.getRange(1, 1, 1, SUMMARY_HEADERS.length).setValues([SUMMARY_HEADERS]);

  if (lastRow < 2) return;

  const values = recordSheet.getRange(2, 1, lastRow - 1, RECORD_HEADERS.length).getValues();
  const byDate = {};

  values.forEach((row) => {
    const dateText = normalizeDate_(row[0]);
    if (!dateText) return;

    if (!byDate[dateText]) {
      byDate[dateText] = {
        done: 0,
        total: 0,
        missed: []
      };
    }

    const done = String(row[5]) === "함" || String(row[6]).toUpperCase() === "TRUE";
    byDate[dateText].total += 1;
    if (done) {
      byDate[dateText].done += 1;
    } else {
      byDate[dateText].missed.push(`${row[2] ? `${row[2]}. ` : ""}${row[4] || ""}`);
    }
  });

  const rows = Object.keys(byDate).sort().map((dateText) => {
    const item = byDate[dateText];
    const percent = item.total ? Math.round((item.done / item.total) * 100) : 0;
    return [dateText, item.done, item.total, `${percent}%`, item.missed.length, item.missed.join(" / ")];
  });

  if (rows.length) {
    summarySheet.getRange(2, 1, rows.length, SUMMARY_HEADERS.length).setValues(rows);
  }
}

function readExistingRecordIndex_(sheet) {
  const index = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return index;

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  values.forEach((row, offset) => {
    const dateText = normalizeDate_(row[0]);
    const taskId = String(row[1] || "");
    if (dateText && taskId) {
      index[`${dateText}|${taskId}`] = offset + 2;
    }
  });
  return index;
}

function ensureSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (currentHeaders.join("|") !== headers.join("|")) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  sheet.setFrozenRows(1);
  return sheet;
}

function normalizeDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value || "");
}

function categoryKey_(label) {
  const map = {
    "마음가짐": "mindset",
    "뉴스/자료": "news",
    "시장/차트": "market",
    "보유/편입": "holdings",
    "신규 발굴": "discovery"
  };
  return map[label] || label;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
