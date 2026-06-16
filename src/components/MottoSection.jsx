import React, { useState } from 'react';

export default function MottoSection({ 
  mottos, 
  checkedMottoIds, 
  onToggleMotto, 
  onAddMotto, 
  onDeleteMotto 
}) {
  const [newMottoText, setNewMottoText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMottoText.trim()) return;
    onAddMotto(newMottoText.trim());
    setNewMottoText('');
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>
          💡 투자 좌우명 점검
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {checkedMottoIds.length} / {mottos.length} 완료
        </span>
      </div>

      <div className="motto-list">
        {mottos.map((motto) => {
          const isChecked = checkedMottoIds.includes(motto.id);
          return (
            <div key={motto.id} className={`motto-item ${isChecked ? 'checked' : ''}`}>
              <div 
                className={`custom-checkbox ${isChecked ? 'checked' : ''}`}
                onClick={() => onToggleMotto(motto.id)}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onToggleMotto(motto.id);
                  }
                }}
              >
                <svg viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span 
                className="motto-text" 
                onClick={() => onToggleMotto(motto.id)}
                style={{ cursor: 'pointer' }}
              >
                {motto.text}
              </span>
              <button 
                className="delete-btn" 
                onClick={() => onDeleteMotto(motto.id)}
                aria-label="좌우명 삭제"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="add-motto-form">
        <input
          type="text"
          value={newMottoText}
          onChange={(e) => setNewMottoText(e.target.value)}
          placeholder="새 투자 좌우명 추가..."
          maxLength={150}
        />
        <button type="submit" className="btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          추가
        </button>
      </form>
    </div>
  );
}
