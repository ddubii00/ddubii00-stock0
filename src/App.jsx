import React, { useState, useEffect } from 'react';
import CalendarSection from './components/CalendarSection';
import MottoSection from './components/MottoSection';
import ChecklistSection from './components/ChecklistSection';
import DiarySection from './components/DiarySection';
import BackupSection from './components/BackupSection';

// Initial default configuration for 17 investment mottos
const DEFAULT_MOTTOS = [
  { id: "m1", text: "열심히 살자. 좌절하지 말자." },
  { id: "m2", text: "자신감을 가지고 항상 긍정적으로 생각하자." },
  { id: "m3", text: "나는 할 수 있다. 자신감 있어. 나는 상위 0.1% 이다." },
  { id: "m4", text: "나는 은퇴시 100억 이상 모은다." },
  { id: "m5", text: "한번 더 큰 실수(2024년~2025년의 고통) 하면 내 인생은 정말 끝난다." },
  { id: "m6", text: "항상 리스크 관리를 하자." },
  { id: "m7", text: "가장 쉬운 투자는 가장 강한놈한테 붙는 것이다. (예: 미국주식, 한국 반도체)" },
  { id: "m8", text: "거인의 어깨위에 올라타라." },
  { id: "m9", text: "주식이 강하지 않는다면 주식을 매도하자." },
  { id: "m10", text: "강하지 않은 주식에 대한 손절은 생명선이다." },
  { id: "m11", text: "절대손절선을 지키자" },
  { id: "m12", text: "항상 오르는 주식은 없다." },
  { id: "m13", text: "기도매매 하지 말자. 기도매매 하는 것은 불운의 전조이다." },
  { id: "m14", text: "때로는 기민하게 행동하고, 때로는 신중하게 행동하자." },
  { id: "m15", text: "행복한 상상/망상을 하면 주의 경고이다. 이때 매도 하는 것이 바람직하다." },
  { id: "m16", text: "강한 주식은 강한 이유가 있다." },
  { id: "m17", text: "물의 방향이 위인지(레버리지: 20%), 횡보인지(무 레버리지), 아래인지(현금화 또는 역방향) 먼저 판단하자." }
];

// Initial default daily checklist
const DEFAULT_CHECKLIST = [
  { id: "c1", title: "주식 좌우명 확인" },
  { id: "c2", title: "한국경제 신문 읽기 PDF" },
  { id: "c3", title: "한경비즈니스" },
  { id: "c4", title: "한국경제 홈페이지 뉴스 읽기" },
  { id: "c5", title: "네이버 홈페이지" },
  { id: "c6", title: "KOSPI 지수 차트 검토" },
  { id: "c7", title: "KOSPI 업종 차트 검토" },
  { id: "c8", title: "나스닥 분석" },
  { id: "c9", title: "현재 보유 주식 검토 및 매도여부 검토" },
  { id: "c10", title: "ETF 편입종목 검토" },
  { id: "c11", title: "GURU 편입종목 검토" },
  { id: "c12", title: "MSCI등 편입종목 검토" },
  { 
    id: "c13", 
    title: "검색식으로 신규 발굴",
    subItems: [
      { id: "c13-1", title: "5/20, 5/60, 20/60 골든" },
      { id: "c13-2", title: "20 눌림목, 60 눌림목" }
    ]
  }
];

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get day of the week in Korean
const getKoreanDayOfWeek = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
};

// Leaf items count helper (12 single items + 2 sub-items = 14)
const getChecklistLeafCount = () => {
  let count = 0;
  DEFAULT_CHECKLIST.forEach(item => {
    if (item.subItems && item.subItems.length > 0) {
      count += item.subItems.length;
    } else {
      count += 1;
    }
  });
  return count;
};

export default function App() {
  const todayStr = getLocalDateString();
  const totalLeafCount = getChecklistLeafCount();

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Mottos state (persisted in local storage)
  const [mottos, setMottos] = useState(() => {
    try {
      const saved = localStorage.getItem('stock_checklist_mottos');
      return saved ? JSON.parse(saved) : DEFAULT_MOTTOS;
    } catch (e) {
      console.error(e);
      return DEFAULT_MOTTOS;
    }
  });

  // History state (persisted in local storage)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('stock_checklist_history');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  // Save mottos to local storage when changed
  useEffect(() => {
    localStorage.setItem('stock_checklist_mottos', JSON.stringify(mottos));
  }, [mottos]);

  // Save history to local storage when changed
  useEffect(() => {
    localStorage.setItem('stock_checklist_history', JSON.stringify(history));
  }, [history]);

  // Fetch checked data for active date
  const dayData = history[selectedDate] || { mottos: [], checklist: [], diary: "" };
  const checkedMottoIds = dayData.mottos || [];
  const checkedItemIds = dayData.checklist || [];
  const diaryText = dayData.diary || "";

  // Toggle single motto check
  const handleToggleMotto = (id) => {
    setHistory(prev => {
      const dayRecord = prev[selectedDate] || { mottos: [], checklist: [], diary: "" };
      const currentMottos = [...(dayRecord.mottos || [])];
      const idx = currentMottos.indexOf(id);

      if (idx > -1) {
        currentMottos.splice(idx, 1);
      } else {
        currentMottos.push(id);
      }

      // Check if all mottos are checked now
      const currentChecklist = [...(dayRecord.checklist || [])];
      const c1Idx = currentChecklist.indexOf('c1');
      const allChecked = currentMottos.length === mottos.length && mottos.length > 0;

      if (allChecked) {
        if (c1Idx === -1) {
          currentChecklist.push('c1');
        }
      } else {
        if (c1Idx > -1) {
          currentChecklist.splice(c1Idx, 1);
        }
      }

      return {
        ...prev,
        [selectedDate]: {
          ...dayRecord,
          mottos: currentMottos,
          checklist: currentChecklist
        }
      };
    });
  };

  // Toggle single checklist item check
  const handleToggleItem = (id) => {
    setHistory(prev => {
      const dayRecord = prev[selectedDate] || { mottos: [], checklist: [], diary: "" };
      const currentChecklist = [...(dayRecord.checklist || [])];
      const idx = currentChecklist.indexOf(id);

      let currentMottos = [...(dayRecord.mottos || [])];

      if (idx > -1) {
        currentChecklist.splice(idx, 1);
        // If unchecking "주식 좌우명 확인", uncheck all mottos
        if (id === 'c1') {
          currentMottos = [];
        }
      } else {
        currentChecklist.push(id);
        // If checking "주식 좌우명 확인", check all mottos
        if (id === 'c1') {
          currentMottos = mottos.map(m => m.id);
        }
      }

      return {
        ...prev,
        [selectedDate]: {
          ...dayRecord,
          checklist: currentChecklist,
          mottos: currentMottos
        }
      };
    });
  };

  // Toggle multiple items (for parent checklist node batch click)
  const handleToggleMultipleItems = (ids, shouldCheck) => {
    setHistory(prev => {
      const dayRecord = prev[selectedDate] || { mottos: [], checklist: [], diary: "" };
      let currentChecklist = [...(dayRecord.checklist || [])];

      ids.forEach(id => {
        const idx = currentChecklist.indexOf(id);
        if (shouldCheck) {
          if (idx === -1) currentChecklist.push(id);
        } else {
          if (idx > -1) currentChecklist.splice(idx, 1);
        }
      });

      return {
        ...prev,
        [selectedDate]: {
          ...dayRecord,
          checklist: currentChecklist
        }
      };
    });
  };

  // Save diary note for selected date
  const handleSaveDiary = (text) => {
    setHistory(prev => {
      const dayRecord = prev[selectedDate] || { mottos: [], checklist: [], diary: "" };
      return {
        ...prev,
        [selectedDate]: {
          ...dayRecord,
          diary: text
        }
      };
    });
  };

  // Add custom motto
  const handleAddMotto = (text) => {
    const newMotto = {
      id: `motto_${Date.now()}`,
      text: text
    };
    
    setMottos(prev => [...prev, newMotto]);

    // Uncheck 'c1' since there's a new unchecked motto
    setHistory(prev => {
      const dayRecord = prev[selectedDate] || { mottos: [], checklist: [], diary: "" };
      const currentChecklist = (dayRecord.checklist || []).filter(cid => cid !== 'c1');
      return {
        ...prev,
        [selectedDate]: {
          ...dayRecord,
          checklist: currentChecklist
        }
      };
    });
  };

  // Delete motto
  const handleDeleteMotto = (id) => {
    const confirmDelete = window.confirm("이 좌우명을 삭제하시겠습니까?");
    if (!confirmDelete) return;

    const newMottos = mottos.filter(m => m.id !== id);
    setMottos(newMottos);
    
    // Also clean up references in history and update 'c1' if needed
    setHistory(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(date => {
        if (updated[date].mottos) {
          const currentCheckedMottos = updated[date].mottos.filter(mid => mid !== id);
          updated[date].mottos = currentCheckedMottos;
          
          const currentChecklist = [...(updated[date].checklist || [])];
          const c1Idx = currentChecklist.indexOf('c1');
          const allChecked = currentCheckedMottos.length === newMottos.length && newMottos.length > 0;
          
          if (allChecked) {
            if (c1Idx === -1) currentChecklist.push('c1');
          } else {
            if (c1Idx > -1) currentChecklist.splice(c1Idx, 1);
          }
          updated[date].checklist = currentChecklist;
        }
      });
      return updated;
    });
  };

  // Import Backup data
  const handleImportData = (data) => {
    setMottos(data.mottos);
    setHistory(data.history);
  };

  // Factory reset data
  const handleResetData = () => {
    setMottos(DEFAULT_MOTTOS);
    setHistory({});
  };

  // Calculation for current active date's progress values
  const activeMottosCount = mottos.length;
  const checkedMottosCount = checkedMottoIds.length;
  const checkedChecklistCount = checkedItemIds.length;

  const mottoPercent = activeMottosCount > 0 ? Math.round((checkedMottosCount / activeMottosCount) * 100) : 0;
  const checklistPercent = totalLeafCount > 0 ? Math.round((checkedChecklistCount / totalLeafCount) * 100) : 0;

  const totalPossibleItems = activeMottosCount + totalLeafCount;
  const totalCheckedItems = checkedMottosCount + checkedChecklistCount;
  const overallPercent = totalPossibleItems > 0 ? Math.round((totalCheckedItems / totalPossibleItems) * 100) : 0;

  // Calculate completion percentage for weekdays (Mon-Fri) of the current week (from monday to today)
  const getWeeklyWeekdayProgress = () => {
    const today = new Date();
    const currentDay = today.getDay();
    
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    let totalCompletions = 0;
    let activeWeekdayCount = 0;
    
    for (let i = 0; i < 5; i++) { // Mon to Fri
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      if (dayStart <= todayStart) {
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const dateVal = String(day.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dateVal}`;
        
        const dayData = history[dateStr];
        const leafCount = 14;
        const mottosCount = mottos.length;
        
        let checkedCount = 0;
        if (dayData) {
          checkedCount += (dayData.mottos?.length || 0);
          checkedCount += (dayData.checklist?.length || 0);
        }
        
        const totalItems = leafCount + mottosCount;
        const completion = totalItems > 0 ? (checkedCount / totalItems) : 0;
        totalCompletions += completion;
        activeWeekdayCount++;
      }
    }
    
    if (activeWeekdayCount === 0) return 0;
    return Math.round((totalCompletions / activeWeekdayCount) * 100);
  };

  const weeklyWeekdayProgress = getWeeklyWeekdayProgress();
  const formattedSelectedDate = `${selectedDate.replace(/-/g, '.')} (${getKoreanDayOfWeek(selectedDate)})`;

  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <h1>📈 주식투자 일일 점검기</h1>
          <p>철저한 원칙 점검과 리스크 관리로 성공 투자를 실현합니다.</p>
        </div>

        <div className="header-actions">
          <div className={`date-indicator ${selectedDate !== todayStr ? 'not-today' : ''}`}>
            <span>📅 {formattedSelectedDate}</span>
            {selectedDate !== todayStr && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(조회 모드)</span>}
          </div>
          {selectedDate !== todayStr && (
            <button className="btn" onClick={() => setSelectedDate(todayStr)}>
              오늘로 가기
            </button>
          )}
        </div>
      </header>

      {selectedDate !== todayStr && (
        <div className="viewing-past-alert">
          <span><strong>{formattedSelectedDate}</strong>의 점검 기록을 조회하고 있습니다.</span>
          <button className="alert-btn" onClick={() => setSelectedDate(todayStr)}>
            오늘 날짜로 복귀
          </button>
        </div>
      )}

      {/* Grid Content Layout */}
      <main className="dashboard-grid">
        {/* Top Row: Calendar (left) and Dashboard Stats (right) side-by-side */}
        <div className="top-row">
          <CalendarSection
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            history={history}
            totalChecklistCount={totalLeafCount}
            totalMottosCount={activeMottosCount}
          />
          
          <section className="dashboard-summary">
            <div className="summary-card">
              <div className="summary-label">오늘의 종합 달성도</div>
              <div className="summary-value success">{overallPercent}%</div>
              <div className="summary-subtext">좌우명 + 점검사항 합산 비율</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">투자 좌우명 진행</div>
              <div className="summary-value">{checkedMottosCount} / {activeMottosCount}</div>
              <div className="summary-subtext">{mottoPercent}% 완료</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">점검사항 진행</div>
              <div className="summary-value">{checkedChecklistCount} / {totalLeafCount}</div>
              <div className="summary-subtext">{checklistPercent}% 완료</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">이번 주 평일 평균 달성도</div>
              <div className="summary-value success">{weeklyWeekdayProgress}%</div>
              <div className="summary-subtext">월요일부터 오늘까지의 평일 평균</div>
            </div>
          </section>
        </div>
        
        {/* Bottom stacked sections: Mottos first, then Checklist, then Diary (full width) */}
        <div className="bottom-stack">
          <MottoSection
            mottos={mottos}
            checkedMottoIds={checkedMottoIds}
            onToggleMotto={handleToggleMotto}
            onAddMotto={handleAddMotto}
            onDeleteMotto={handleDeleteMotto}
          />
          
          <ChecklistSection
            items={DEFAULT_CHECKLIST}
            checkedItemIds={checkedItemIds}
            onToggleItem={handleToggleItem}
            onToggleMultipleItems={handleToggleMultipleItems}
          />

          <DiarySection
            diaryText={diaryText}
            onSaveDiary={handleSaveDiary}
            selectedDate={selectedDate}
          />
          
          <BackupSection
            dataToBackup={{ mottos, history }}
            onImport={handleImportData}
            onReset={handleResetData}
          />
        </div>
      </main>
    </div>
  );
}
