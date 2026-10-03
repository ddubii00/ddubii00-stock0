import React, { useState, useEffect } from 'react';

export default function DiarySection({ diaryText, onSaveDiary, selectedDate }) {
  const [text, setText] = useState(diaryText);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when selected date changes in parent
  useEffect(() => {
    setText(diaryText);
  }, [diaryText, selectedDate]);

  // Handle auto-saving on change (debounce)
  useEffect(() => {
    if (text === diaryText) return;

    setIsSaving(true);
    const delayDebounce = setTimeout(() => {
      onSaveDiary(text);
      setIsSaving(false);
    }, 500); // save 500ms after user stops typing

    return () => clearTimeout(delayDebounce);
  }, [text, onSaveDiary, diaryText]);

  // Format date display
  const formatDate = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>
          ✍️ {formatDate(selectedDate)} 투자 일기
        </span>
        <span style={{ fontSize: '0.75rem', color: isSaving ? 'var(--accent-blue)' : 'var(--accent-green-hover)' }}>
          {isSaving ? '● 입력 중...' : '✓ 자동 저장됨'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="오늘 매매에서 잘한 점, 잘못한 점, 심리 상태 및 내일의 대응 전략을 기록해 보세요..."
          style={{
            width: '100%',
            minHeight: '140px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.85rem',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>기록된 글자 수: {text.length}자</span>
          <span>주기적인 백업을 권장합니다.</span>
        </div>
      </div>
    </div>
  );
}
