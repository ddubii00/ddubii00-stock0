import React, { useEffect, useMemo, useState } from 'react';
import CalendarSection from './components/CalendarSection';
import MottoSection from './components/MottoSection';
import ChecklistSection from './components/ChecklistSection';
import DiarySection from './components/DiarySection';
import BackupSection from './components/BackupSection';

const CACHE_KEY = 'ddubii.stock0.react-cache.v1';
const DEFAULT_MOTTOS = [
  ['m1', '열심히 살자. 좌절하지 말자.'], ['m2', '자신감을 가지고 항상 긍정적으로 생각하자.'],
  ['m3', '나는 할 수 있다. 자신감 있어. 나는 상위 0.1% 이다.'], ['m4', '나는 은퇴시 100억 이상 모은다.'],
  ['m5', '항상 리스크 관리를 하자.'], ['m6', '가장 쉬운 투자는 가장 강한 종목에 붙는 것이다.'],
  ['m7', '거인의 어깨 위에 올라타라.'], ['m8', '주식이 강하지 않다면 주식을 매도하자.'],
  ['m9', '강하지 않은 주식에 대한 손절은 생명선이다.'], ['m10', '절대 손절선을 지키자.'],
  ['m11', '항상 오르는 주식은 없다.'], ['m12', '기도매매 하지 말자.']
].map(([id, text]) => ({ id, text }));
const DEFAULT_TASKS = [
  ['mindset-belief', '자신감 신념의 마력'], ['news-hankyung-pdf', '한국경제 신문 읽기 PDF'],
  ['news-hankyung-business', '한경비즈니스'], ['news-hankyung-home', '한국경제 홈페이지 뉴스 읽기'],
  ['news-naver', '네이버 홈페이지'], ['market-kospi-index', 'KOSPI 지수 차트 검토'],
  ['market-kospi-sector', 'KOSPI 업종 차트 검토'], ['market-nasdaq', '나스닥 분석'],
  ['holdings-current', '현재 보유 주식 검토 및 매도여부 검토'], ['holdings-etf', 'ETF 편입종목 검토'],
  ['holdings-guru', 'GURU 편입종목 검토'], ['holdings-msci', 'MSCI등 편입종목 검토'],
  ['discovery-golden', '검색식으로 신규 발굴: 5/20, 5/60, 20/60 골든'],
  ['discovery-pullback', '검색식으로 신규 발굴: 20 눌림목, 60 눌림목'],
  ['discovery-volume', '검색식으로 신규 발굴: 거래량 급등 후 감소'],
  ['discovery-candle', '검색식으로 신규 발굴: 캔들 상승 반전/상승 지속']
].map(([id, title]) => ({ id, title }));

function today(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function record(value = {}) { return { checks: value.checks || {}, mottos: Array.isArray(value.mottos) ? value.mottos : [], notes: { market: value.notes?.market || '', trade: value.notes?.trade || '', tomorrow: value.notes?.tomorrow || '' } }; }
function defaults() { return { selectedDate: today(), tasks: clone(DEFAULT_TASKS), mottos: clone(DEFAULT_MOTTOS), records: {} }; }
function cache() { try { return typeof window === 'undefined' ? null : JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } }
function mergedRecords(server = {}, local = {}) {
  return Object.fromEntries([...new Set([...Object.keys(server), ...Object.keys(local)])].map((date) => {
    const remote = record(server[date]); const cached = record(local[date]);
    return [date, { checks: { ...remote.checks, ...cached.checks }, mottos: [...new Set([...remote.mottos, ...cached.mottos])], notes: { market: cached.notes.market || remote.notes.market, trade: cached.notes.trade || remote.notes.trade, tomorrow: cached.notes.tomorrow || remote.notes.tomorrow } }];
  }));
}
function mergeData(server, local) {
  const remote = server || {}; const cached = local || {};
  return { selectedDate: cached.selectedDate || remote.selectedDate || today(), tasks: remote.tasks?.length ? remote.tasks : (cached.tasks?.length ? cached.tasks : clone(DEFAULT_TASKS)), mottos: remote.mottos?.length ? remote.mottos : (cached.mottos?.length ? cached.mottos : clone(DEFAULT_MOTTOS)), records: mergedRecords(remote.records, cached.records) };
}
function calendarHistory(records) { return Object.fromEntries(Object.entries(records).map(([date, value]) => { const item = record(value); return [date, { mottos: item.mottos, checklist: Object.entries(item.checks).filter(([, done]) => done).map(([id]) => id) }]; })); }

export default function App() {
  const localCache = useMemo(cache, []);
  const [data, setData] = useState(() => mergeData(null, localCache || defaults()));
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('서버 기록 불러오는 중');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch('./api/data', { headers: { accept: 'application/json' } });
        if (response.status === 401) return window.location.assign('./login');
        const result = await response.json();
        if (response.ok && result.configured && result.data) {
          if (mounted) { setData(mergeData(result.data, localCache)); setSaveState('서버 저장 연결됨'); }
        } else {
          const response = await fetch('./api/sync', { headers: { accept: 'application/json' } });
          const result = await response.json();
          if (mounted) { if (response.ok && result.configured) { setData(mergeData(result.upstream || result, localCache)); setSaveState('Google Sheets 동기화 연결됨'); } else setSaveState('브라우저 임시 저장'); }
        }
      } catch { if (mounted) setSaveState('오프라인 임시 저장'); }
      finally { if (mounted) setReady(true); }
    })();
    return () => { mounted = false; };
  }, [localCache]);

  useEffect(() => {
    if (!ready) return undefined;
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    const timer = setTimeout(async () => {
      setSaveState('저장 중');
      const payload = { ...data, clientSavedAt: new Date().toISOString(), categoryLabels: {} };
      try {
        let response = await fetch('./api/data', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        let result = await response.json();
        if (response.ok && result.configured) return setSaveState('서버에 저장됨');
        response = await fetch('./api/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error('sync failed');
        setSaveState('Google Sheets에 저장됨');
      } catch { setSaveState('브라우저에 임시 저장됨'); }
    }, 500);
    return () => clearTimeout(timer);
  }, [data, ready]);

  const selected = data.selectedDate;
  const activeRecord = record(data.records[selected]);
  const checkedItems = Object.entries(activeRecord.checks).filter(([, checked]) => checked).map(([id]) => id);
  const checkedTasks = checkedItems.filter((id) => data.tasks.some((task) => task.id === id)).length;
  const total = data.tasks.length + data.mottos.length;
  const overall = total ? Math.round(((checkedTasks + activeRecord.mottos.length) / total) * 100) : 0;
  const taskPercent = data.tasks.length ? Math.round((checkedTasks / data.tasks.length) * 100) : 0;
  const mottoPercent = data.mottos.length ? Math.round((activeRecord.mottos.length / data.mottos.length) * 100) : 0;
  const history = useMemo(() => calendarHistory(data.records), [data.records]);
  const checklistItems = useMemo(() => data.tasks.map(({ id, title }) => ({ id, title })), [data.tasks]);
  const formatted = `${selected.replaceAll('-', '.')} (${['일', '월', '화', '수', '목', '금', '토'][new Date(`${selected}T00:00:00`).getDay()]})`;
  const setSelected = (date) => setData((previous) => ({ ...previous, selectedDate: date }));
  const updateRecord = (change) => setData((previous) => ({ ...previous, records: { ...previous.records, [previous.selectedDate]: change(record(previous.records[previous.selectedDate])) } }));
  const toggleMotto = (id) => updateRecord((item) => ({ ...item, mottos: item.mottos.includes(id) ? item.mottos.filter((value) => value !== id) : [...item.mottos, id] }));
  const toggleTask = (id) => updateRecord((item) => ({ ...item, checks: { ...item.checks, [id]: !item.checks[id] } }));
  const toggleTasks = (ids, value) => updateRecord((item) => ({ ...item, checks: { ...item.checks, ...Object.fromEntries(ids.map((id) => [id, value])) } }));
  const weekly = useMemo(() => {
    const date = new Date(); const mondayOffset = date.getDay() === 0 ? -6 : 1 - date.getDay(); let sum = 0; let count = 0;
    for (let day = 0; day < 5; day += 1) { const itemDate = new Date(date); itemDate.setDate(date.getDate() + mondayOffset + day); if (itemDate > date) continue; const item = record(data.records[today(itemDate)]); sum += total ? (item.mottos.length + Object.values(item.checks).filter(Boolean).length) / total : 0; count += 1; }
    return count ? Math.round((sum / count) * 100) : 0;
  }, [data.records, total]);

  return <div className="app-container">
    <header><div className="logo-section"><h1>📈 주식투자 일일 점검기</h1><p>철저한 원칙 점검과 리스크 관리로 성공 투자를 실현합니다.</p></div><div className="header-actions"><span className="save-state">{saveState}</span><div className={`date-indicator ${selected !== today() ? 'not-today' : ''}`}>📅 {formatted}</div>{selected !== today() && <button className="btn" onClick={() => setSelected(today())}>오늘로 가기</button>}</div></header>
    {selected !== today() && <div className="viewing-past-alert"><span><strong>{formatted}</strong>의 점검 기록을 조회하고 있습니다.</span><button className="alert-btn" onClick={() => setSelected(today())}>오늘 날짜로 복귀</button></div>}
    <main className="dashboard-grid"><div className="top-row"><CalendarSection selectedDate={selected} setSelectedDate={setSelected} history={history} totalChecklistCount={data.tasks.length} totalMottosCount={data.mottos.length} /><section className="dashboard-summary"><div className="summary-card"><div className="summary-label">오늘의 종합 달성도</div><div className="summary-value success">{overall}%</div><div className="summary-subtext">좌우명 + 점검사항 합산 비율</div></div><div className="summary-card"><div className="summary-label">투자 좌우명 진행</div><div className="summary-value">{activeRecord.mottos.length} / {data.mottos.length}</div><div className="summary-subtext">{mottoPercent}% 완료</div></div><div className="summary-card"><div className="summary-label">점검사항 진행</div><div className="summary-value">{checkedTasks} / {data.tasks.length}</div><div className="summary-subtext">{taskPercent}% 완료</div></div><div className="summary-card"><div className="summary-label">이번 주 평일 평균 달성도</div><div className="summary-value success">{weekly}%</div><div className="summary-subtext">월요일부터 오늘까지의 평일 평균</div></div></section></div><div className="bottom-stack"><MottoSection mottos={data.mottos} checkedMottoIds={activeRecord.mottos} onToggleMotto={toggleMotto} onAddMotto={(text) => setData((previous) => ({ ...previous, mottos: [...previous.mottos, { id: `motto-${Date.now()}`, text }] }))} onDeleteMotto={(id) => { if (window.confirm('이 좌우명을 삭제하시겠습니까?')) setData((previous) => ({ ...previous, mottos: previous.mottos.filter((item) => item.id !== id), records: Object.fromEntries(Object.entries(previous.records).map(([date, value]) => [date, { ...record(value), mottos: record(value).mottos.filter((value) => value !== id) }])) })); }} /><ChecklistSection items={checklistItems} checkedItemIds={checkedItems} onToggleItem={toggleTask} onToggleMultipleItems={toggleTasks} /><DiarySection diaryText={activeRecord.notes.market} onSaveDiary={(market) => updateRecord((item) => ({ ...item, notes: { ...item.notes, market } }))} selectedDate={selected} /><BackupSection dataToBackup={data} onImport={(incoming) => setData(mergeData(incoming, null))} onReset={() => setData(defaults())} /></div></main>
  </div>;
}
