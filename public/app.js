const categoryLabels = {
  mindset: "마음가짐",
  news: "뉴스/자료",
  market: "시장/차트",
  holdings: "보유/편입",
  discovery: "신규 발굴"
};

const defaultTasks = [
  { id: "mindset-belief", category: "mindset", no: "1", title: "자신감 신념의 마력" },
  { id: "news-hankyung-pdf", category: "news", no: "2", title: "한국경제 신문 읽기 PDF" },
  { id: "news-hankyung-business", category: "news", no: "3", title: "한경비즈니스" },
  { id: "news-hankyung-home", category: "news", no: "4", title: "한국경제 홈페이지 뉴스 읽기" },
  { id: "news-naver", category: "news", no: "5", title: "네이버 홈페이지" },
  { id: "market-kospi-index", category: "market", no: "6", title: "KOSPI 지수 차트 검토" },
  { id: "market-kospi-sector", category: "market", no: "7", title: "KOSPI 업종 차트 검토" },
  { id: "market-nasdaq", category: "market", no: "8", title: "나스닥 분석" },
  { id: "holdings-current", category: "holdings", no: "9", title: "현재 보유 주식 검토 및 매도여부 검토" },
  { id: "holdings-etf", category: "holdings", no: "10", title: "ETF 편입종목 검토" },
  { id: "holdings-guru", category: "holdings", no: "11", title: "GURU 편입종목 검토" },
  { id: "holdings-msci", category: "holdings", no: "12", title: "MSCI등 편입종목 검토" },
  { id: "discovery-golden", category: "discovery", no: "13-1", title: "검색식으로 신규 발굴: 5/20, 5/60, 20/60 골든" },
  { id: "discovery-pullback", category: "discovery", no: "13-2", title: "검색식으로 신규 발굴: 20 눌림목, 60 눌림목" },
  { id: "discovery-volume", category: "discovery", no: "13-3", title: "검색식으로 신규 발굴: 거래량 급등 후 감소" },
  { id: "discovery-candle", category: "discovery", no: "13-4", title: "검색식으로 신규 발굴: 캔들 상승 반전/상승 지속" }
];

const storage = {
  tasks: "ddubii.routine.tasks",
  records: "ddubii.routine.records",
  selectedDate: "ddubii.routine.selectedDate",
  taskVersion: "ddubii.routine.taskVersion",
  clientId: "ddubii.routine.clientId",
  lastSyncAt: "ddubii.routine.lastSyncAt"
};

const currentTaskVersion = "stock-routine-2026-05-23-v1";

const state = {
  tasks: initialTasks(),
  records: readJson(storage.records, {}),
  selectedDate: localStorage.getItem(storage.selectedDate) || formatDate(new Date()),
  clientId: getClientId(),
  saveTimer: null,
  syncTimer: null,
  syncing: false
};

const els = {
  dateInput: document.querySelector("#date-input"),
  todayButton: document.querySelector("#today-button"),
  pageTitle: document.querySelector("#page-title"),
  scoreRing: document.querySelector("#score-ring"),
  scorePercent: document.querySelector("#score-percent"),
  doneCount: document.querySelector("#done-count"),
  streakCount: document.querySelector("#streak-count"),
  weekList: document.querySelector("#week-list"),
  mindsetStatus: document.querySelector("#mindset-status"),
  newsStatus: document.querySelector("#news-status"),
  marketStatus: document.querySelector("#market-status"),
  holdingsStatus: document.querySelector("#holdings-status"),
  discoveryStatus: document.querySelector("#discovery-status"),
  completionLine: document.querySelector("#completion-line"),
  routineList: document.querySelector("#routine-list"),
  completeAll: document.querySelector("#complete-all-button"),
  resetDay: document.querySelector("#reset-day-button"),
  exportButton: document.querySelector("#export-button"),
  syncButton: document.querySelector("#sync-button"),
  syncState: document.querySelector("#sync-state"),
  restore: document.querySelector("#restore-button"),
  addForm: document.querySelector("#add-form"),
  categorySelect: document.querySelector("#category-select"),
  taskInput: document.querySelector("#task-input"),
  notes: [...document.querySelectorAll("textarea[data-note]")],
  saveState: document.querySelector("#save-state"),
  toast: document.querySelector("#toast")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getClientId() {
  const existing = localStorage.getItem(storage.clientId);
  if (existing) return existing;

  const next = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storage.clientId, next);
  return next;
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value || clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function initialTasks() {
  if (localStorage.getItem(storage.taskVersion) !== currentTaskVersion) {
    const tasks = clone(defaultTasks);
    writeJson(storage.tasks, tasks);
    localStorage.setItem(storage.taskVersion, currentTaskVersion);
    return tasks;
  }

  return readJson(storage.tasks, defaultTasks);
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveTasks({ sync = true } = {}) {
  writeJson(storage.tasks, state.tasks);
  if (sync) scheduleCloudSync();
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateText, amount) {
  const date = parseDate(dateText);
  date.setDate(date.getDate() + amount);
  return formatDate(date);
}

function weekdayLabel(dateText) {
  return new Intl.DateTimeFormat("ko-KR", {
    weekday: "short",
    month: "numeric",
    day: "numeric"
  }).format(parseDate(dateText));
}

function getRecord(dateText = state.selectedDate) {
  if (!state.records[dateText]) {
    state.records[dateText] = {
      checks: {},
      notes: {
        market: "",
        trade: "",
        tomorrow: ""
      }
    };
  }

  return state.records[dateText];
}

function saveRecords({ sync = true } = {}) {
  writeJson(storage.records, state.records);
  if (sync) scheduleCloudSync();
}

function setToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(setToast.timer);
  setToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2400);
}

function setSyncState(message, tone = "") {
  els.syncState.textContent = message;
  els.syncState.className = `sync-state${tone ? ` ${tone}` : ""}`;
}

function syncPayload() {
  return {
    selectedDate: state.selectedDate,
    clientId: state.clientId,
    clientSavedAt: new Date().toISOString(),
    categoryLabels,
    tasks: state.tasks,
    records: state.records
  };
}

function scheduleCloudSync() {
  setSyncState("동기화 대기", "pending");
  window.clearTimeout(state.syncTimer);
  state.syncTimer = window.setTimeout(() => {
    pushCloudData({ silent: true });
  }, 700);
}

function mergeCloudRecords(cloudRecords) {
  Object.entries(cloudRecords || {}).forEach(([dateText, cloudRecord]) => {
    const localRecord = state.records[dateText] || {};
    const localNotes = localRecord.notes || {};
    const cloudNotes = cloudRecord.notes || {};

    state.records[dateText] = {
      checks: {
        ...(cloudRecord.checks || {}),
        ...(localRecord.checks || {})
      },
      notes: {
        market: localNotes.market || cloudNotes.market || "",
        trade: localNotes.trade || cloudNotes.trade || "",
        tomorrow: localNotes.tomorrow || cloudNotes.tomorrow || ""
      }
    };
  });
}

function mergeCloudTasks(cloudTasks) {
  if (!Array.isArray(cloudTasks) || !cloudTasks.length) return;

  const taskIds = new Set(state.tasks.map((task) => task.id));
  cloudTasks.forEach((task) => {
    if (!task?.id || taskIds.has(task.id)) return;
    state.tasks.push(task);
    taskIds.add(task.id);
  });
}

function applyCloudData(data) {
  const upstream = data?.data && typeof data.data === "object"
    ? data.data
    : data?.upstream && typeof data.upstream === "object" ? data.upstream : data;
  mergeCloudTasks(upstream?.tasks);
  mergeCloudRecords(upstream?.records);
  saveTasks({ sync: false });
  saveRecords({ sync: false });
  render();
}

async function pullCloudData({ silent = false } = {}) {
  try {
    const serverResponse = await fetch("/api/data", {
      method: "GET",
      headers: { "accept": "application/json" }
    });
    const serverData = await serverResponse.json();

    if (serverResponse.ok && serverData.ok !== false && serverData.configured) {
      applyCloudData(serverData);
      localStorage.setItem(storage.lastSyncAt, new Date().toISOString());
      setSyncState("서버 저장됨", "synced");
      if (!silent) setToast("서버에 저장된 투자 루틴 기록을 불러왔습니다.");
      return true;
    }

    const response = await fetch("/api/sync", {
      method: "GET",
      headers: { "accept": "application/json" }
    });
    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "동기화 확인에 실패했습니다.");
    }

    if (!data.configured) {
      setSyncState("로컬 저장");
      if (!silent) setToast("Google Sheets 동기화 설정 전이라 로컬에만 저장됩니다.");
      return false;
    }

    applyCloudData(data);
    localStorage.setItem(storage.lastSyncAt, new Date().toISOString());
    setSyncState("동기화됨", "synced");
    if (!silent) setToast("Google Sheets 기록을 불러왔습니다.");
    return true;
  } catch (error) {
    setSyncState("동기화 실패", "error");
    if (!silent) setToast(error.message || "동기화에 실패했습니다.");
    return false;
  }
}

async function pushCloudData({ silent = false } = {}) {
  if (state.syncing) return false;
  state.syncing = true;
  setSyncState("동기화 중", "pending");

  try {
    const serverResponse = await fetch("/api/data", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(syncPayload())
    });
    const serverData = await serverResponse.json();

    if (serverResponse.ok && serverData.ok !== false && serverData.configured) {
      localStorage.setItem(storage.lastSyncAt, new Date().toISOString());
      setSyncState("서버 저장됨", "synced");
      if (!silent) setToast("서버에 투자 루틴 기록을 저장했습니다.");
      return true;
    }

    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(syncPayload())
    });
    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "동기화에 실패했습니다.");
    }

    if (!data.configured) {
      setSyncState("로컬 저장");
      if (!silent) setToast("Google Sheets 동기화 설정 전이라 로컬에만 저장됩니다.");
      return false;
    }

    localStorage.setItem(storage.lastSyncAt, new Date().toISOString());
    setSyncState("동기화됨", "synced");
    if (!silent) setToast("Google Sheets로 동기화했습니다.");
    return true;
  } catch (error) {
    setSyncState("동기화 실패", "error");
    if (!silent) setToast(error.message || "동기화에 실패했습니다.");
    return false;
  } finally {
    state.syncing = false;
  }
}

async function syncNow() {
  setSyncState("동기화 중", "pending");
  await pullCloudData({ silent: true });
  await pushCloudData({ silent: false });
}

function groupedTasks() {
  return Object.keys(categoryLabels).map((category) => ({
    category,
    label: categoryLabels[category],
    tasks: state.tasks.filter((task) => task.category === category)
  }));
}

function completionForDate(dateText) {
  const record = state.records[dateText];
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => record?.checks?.[task.id]).length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0
  };
}

function categoryCompletion(category) {
  const tasks = state.tasks.filter((task) => task.category === category);
  const record = getRecord();
  const done = tasks.filter((task) => record.checks[task.id]).length;
  return `${done}/${tasks.length}`;
}

function streakFrom(dateText) {
  let streak = 0;
  let cursor = dateText;

  while (completionForDate(cursor).percent === 100) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function render() {
  const record = getRecord();
  const completion = completionForDate(state.selectedDate);
  const degrees = Math.round((completion.percent / 100) * 360);

  els.dateInput.value = state.selectedDate;
  els.pageTitle.textContent = `${weekdayLabel(state.selectedDate)} 투자 루틴`;
  els.scorePercent.textContent = `${completion.percent}%`;
  els.scoreRing.style.background = `conic-gradient(var(--accent) ${degrees}deg, #e8edf0 ${degrees}deg)`;
  els.doneCount.textContent = `${completion.done}/${completion.total}`;
  els.streakCount.textContent = `${streakFrom(state.selectedDate)}일`;
  els.mindsetStatus.textContent = categoryCompletion("mindset");
  els.newsStatus.textContent = categoryCompletion("news");
  els.marketStatus.textContent = categoryCompletion("market");
  els.holdingsStatus.textContent = categoryCompletion("holdings");
  els.discoveryStatus.textContent = categoryCompletion("discovery");
  els.completionLine.textContent = completion.total
    ? `${completion.done}개 완료, ${completion.total - completion.done}개 남음`
    : "루틴 항목이 없습니다.";

  renderRoutine(record);
  renderNotes(record);
  renderWeek();

  localStorage.setItem(storage.selectedDate, state.selectedDate);
}

function renderRoutine(record) {
  els.routineList.innerHTML = "";

  groupedTasks().forEach((group) => {
    if (!group.tasks.length) return;

    const done = group.tasks.filter((task) => record.checks[task.id]).length;
    const section = document.createElement("section");
    section.className = "routine-section";
    section.innerHTML = `
      <div class="routine-section-head">
        <h4>${group.label}</h4>
        <span>${done}/${group.tasks.length}</span>
      </div>
    `;

    group.tasks.forEach((task) => {
      const checked = Boolean(record.checks[task.id]);
      const row = document.createElement("div");
      row.className = `task-row${checked ? " done" : ""}`;

      const main = document.createElement("label");
      main.className = "task-main";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = checked;
      checkbox.addEventListener("change", () => {
        record.checks[task.id] = checkbox.checked;
        saveRecords();
        render();
      });

      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.no ? `${task.no}. ${task.title}` : task.title;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-task";
      remove.title = "삭제";
      remove.textContent = "×";
      remove.addEventListener("click", () => removeTask(task.id));

      main.append(checkbox, title);
      row.append(main, remove);
      section.append(row);
    });

    els.routineList.append(section);
  });
}

function renderNotes(record) {
  els.notes.forEach((textarea) => {
    textarea.value = record.notes[textarea.dataset.note] || "";
  });
}

function renderWeek() {
  els.weekList.innerHTML = "";
  const dates = Array.from({ length: 7 }, (_, index) => addDays(state.selectedDate, index - 6));

  dates.forEach((dateText) => {
    const completion = completionForDate(dateText);
    const item = document.createElement("div");
    item.className = "week-item";
    item.innerHTML = `
      <span>${weekdayLabel(dateText)}</span>
      <div class="week-bar"><span style="width: ${completion.percent}%"></span></div>
      <strong>${completion.percent}%</strong>
    `;
    els.weekList.append(item);
  });
}

function removeTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  Object.values(state.records).forEach((record) => {
    delete record.checks[taskId];
  });
  saveTasks({ sync: false });
  saveRecords();
  render();
  setToast("루틴 항목을 삭제했습니다.");
}

function completeAll() {
  const record = getRecord();
  state.tasks.forEach((task) => {
    record.checks[task.id] = true;
  });
  saveRecords();
  render();
  setToast("오늘 루틴을 모두 완료 처리했습니다.");
}

function resetSelectedDay() {
  state.records[state.selectedDate] = {
    checks: {},
    notes: {
      market: "",
      trade: "",
      tomorrow: ""
    }
  };
  saveRecords();
  render();
  setToast("선택한 날짜의 기록을 초기화했습니다.");
}

function restoreDefaults() {
  state.tasks = clone(defaultTasks);
  localStorage.setItem(storage.taskVersion, currentTaskVersion);
  saveTasks();
  render();
  setToast("기본 루틴으로 복원했습니다.");
}

function addTask(event) {
  event.preventDefault();
  const title = els.taskInput.value.trim();

  if (!title) {
    setToast("추가할 루틴을 입력하세요.");
    return;
  }

  state.tasks.push({
    id: `custom-${Date.now()}`,
    category: els.categorySelect.value,
    title
  });
  saveTasks();
  els.taskInput.value = "";
  render();
  setToast("루틴 항목을 추가했습니다.");
}

function saveNote(event) {
  const record = getRecord();
  record.notes[event.target.dataset.note] = event.target.value;
  els.saveState.textContent = "저장 중";
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => {
    saveRecords();
    els.saveState.textContent = "저장됨";
  }, 220);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function cell(value, type = "String") {
  return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}

function row(values) {
  return `<Row>${values.map((value) => Array.isArray(value) ? cell(value[0], value[1]) : cell(value)).join("")}</Row>`;
}

function allRecordDates() {
  const dates = new Set(Object.keys(state.records));
  dates.add(state.selectedDate);
  return [...dates].sort();
}

function exportExcel() {
  const dates = allRecordDates();
  const recordRows = [
    row(["날짜", "번호", "카테고리", "항목", "수행여부", "오늘 핵심 메모", "못 한 이유", "내일 보완할 것"])
  ];
  const summaryRows = [
    row(["날짜", "완료", "전체", "완료율", "안한 항목 수", "못 한 항목"])
  ];

  dates.forEach((dateText) => {
    const record = getRecord(dateText);
    const completion = completionForDate(dateText);
    const missedTasks = state.tasks
      .filter((task) => !record.checks[task.id])
      .map((task) => `${task.no ? `${task.no}. ` : ""}${task.title}`);

    summaryRows.push(row([
      dateText,
      [completion.done, "Number"],
      [completion.total, "Number"],
      `${completion.percent}%`,
      [missedTasks.length, "Number"],
      missedTasks.join(" / ")
    ]));

    state.tasks.forEach((task) => {
      recordRows.push(row([
        dateText,
        task.no || "",
        categoryLabels[task.category] || task.category,
        task.title,
        record.checks[task.id] ? "함" : "안함",
        record.notes?.market || "",
        record.notes?.trade || "",
        record.notes?.tomorrow || ""
      ]));
    });
  });

  saveRecords({ sync: false });

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>ddubii-stock0</Author>
    <Title>주식투자 루틴 수행 기록</Title>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="맑은 고딕" ss:Size="10"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="수행기록">
    <Table>
      ${recordRows.join("\n")}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="일별요약">
    <Table>
      ${summaryRows.join("\n")}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ddubii-stock0-routine-${formatDate(new Date())}.xls`;
  link.click();
  URL.revokeObjectURL(url);
  setToast("Excel 문서로 저장했습니다. 체크하지 않은 항목은 안함으로 기록됩니다.");
}

els.dateInput.addEventListener("change", () => {
  state.selectedDate = els.dateInput.value || formatDate(new Date());
  render();
});

els.todayButton.addEventListener("click", () => {
  state.selectedDate = formatDate(new Date());
  render();
});

els.completeAll.addEventListener("click", completeAll);
els.resetDay.addEventListener("click", resetSelectedDay);
els.restore.addEventListener("click", restoreDefaults);
els.addForm.addEventListener("submit", addTask);
els.exportButton.addEventListener("click", exportExcel);
els.syncButton.addEventListener("click", syncNow);
els.notes.forEach((textarea) => textarea.addEventListener("input", saveNote));

render();
pullCloudData({ silent: true });
