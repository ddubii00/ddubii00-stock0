import React, { useState } from 'react';

export default function CalendarSection({
  selectedDate,
  setSelectedDate,
  history,
  totalChecklistCount,
  totalMottosCount
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = (year, month, day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Nav month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate calendar days
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0: Sun, 1: Mon, ...

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Previous month padding
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);

  const cells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      month: prevMonthIndex,
      year: prevYear,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true
    });
  }

  // Next month leading days to complete grid (6 rows * 7 columns = 42 cells)
  const remainingCells = 42 - cells.length;
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({
      day: i,
      month: nextMonthIndex,
      year: nextYear,
      isCurrentMonth: false
    });
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  // Check today helper
  const isToday = (year, month, day) => {
    const localToday = new Date();
    return (
      localToday.getFullYear() === year &&
      localToday.getMonth() === month &&
      localToday.getDate() === day
    );
  };

  // Check selected helper
  const isSelected = (year, month, day) => {
    const dateStr = getLocalDateString(year, month, day);
    return selectedDate === dateStr;
  };

  // Calculate day completion percentage
  const getDayCompletion = (year, month, day) => {
    const dateStr = getLocalDateString(year, month, day);
    const dayData = history[dateStr];
    if (!dayData) return 0;

    const checkedMottos = dayData.mottos?.length || 0;
    const checkedChecklist = dayData.checklist?.length || 0;
    const totalCount = totalChecklistCount + totalMottosCount;

    if (totalCount === 0) return 0;
    return Math.round(((checkedMottos + checkedChecklist) / totalCount) * 100);
  };

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <h3>
          {currentYear}년 {currentMonth + 1}월
        </h3>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevMonth} aria-label="이전 달">
            <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <button className="calendar-nav-btn" onClick={() => {
            const t = new Date();
            setCurrentYear(t.getFullYear());
            setCurrentMonth(t.getMonth());
            setSelectedDate(getLocalDateString(t.getFullYear(), t.getMonth(), t.getDate()));
          }} aria-label="오늘 이동">
            오늘
          </button>
          <button className="calendar-nav-btn" onClick={nextMonth} aria-label="다음 달">
            <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekdays.map((wd, index) => (
          <div key={wd} className="calendar-weekday">
            {wd}
          </div>
        ))}

        {cells.map((cell, idx) => {
          const { day, month, year, isCurrentMonth } = cell;
          const cellDateStr = getLocalDateString(year, month, day);

          // Determine day index: 0 is Sun, 6 is Sat.
          // In cells grid, we can compute day of week.
          const dateObj = new Date(year, month, day);
          const dayOfWeek = dateObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isWeekday = !isWeekend;

          const completion = isCurrentMonth ? getDayCompletion(year, month, day) : 0;
          const todayClass = isToday(year, month, day) ? 'today' : '';
          const selectedClass = isSelected(year, month, day) ? 'selected' : '';
          const monthClass = isCurrentMonth ? '' : 'other-month';
          const dayTypeClass = isWeekend ? 'is-weekend' : 'is-weekday';

          let completionClass = '';
          if (isCurrentMonth && completion > 0) {
            if (completion === 100) {
              completionClass = 'complete-full';
            } else if (completion >= 50) {
              completionClass = 'complete-high';
            }
          }

          return (
            <button
              key={`${year}-${month}-${day}-${idx}`}
              className={`calendar-day-cell ${todayClass} ${selectedClass} ${monthClass} ${dayTypeClass} ${completionClass}`}
              onClick={() => {
                if (isCurrentMonth) {
                  setSelectedDate(cellDateStr);
                }
              }}
              disabled={!isCurrentMonth}
            >
              <span className="calendar-day-number">{day}</span>
              {isCurrentMonth && (
                <>
                  <div className={`day-status-dot ${completion > 0 ? 'checked' : ''}`}></div>
                  <div className="day-completion-indicator">
                    <div
                      className="day-completion-fill"
                      style={{ width: `${completion}%` }}
                    ></div>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
