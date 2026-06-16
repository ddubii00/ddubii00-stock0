import React, { useRef } from 'react';

export default function BackupSection({ dataToBackup, onImport, onReset }) {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `stock_checklist_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      alert("데이터 백업 파일 생성 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        // Basic validation
        if (!parsedData.mottos || !parsedData.history) {
          throw new Error("백업 파일 형식이 올바르지 않습니다. (mottos 및 history 필드 누락)");
        }

        if (!Array.isArray(parsedData.mottos)) {
          throw new Error("mottos 데이터 형식이 올바르지 않습니다.");
        }

        if (typeof parsedData.history !== 'object') {
          throw new Error("history 데이터 형식이 올바르지 않습니다.");
        }

        const confirmImport = window.confirm(
          "백업 파일을 가져오시겠습니까? 기존 데이터가 백업 파일 데이터로 대체됩니다."
        );
        
        if (confirmImport) {
          onImport(parsedData);
          alert("데이터를 성공적으로 복구했습니다!");
        }
      } catch (error) {
        alert("백업 파일 읽기 실패: " + error.message);
      }
      
      // Reset file input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      "경고: 모든 데이터(좌우명 수정내역, 일별 점검 기록)가 초기화됩니다. 이 작업은 취소할 수 없습니다. 계속하시겠습니까?"
    );
    if (confirmReset) {
      onReset();
      alert("모든 데이터가 초기 설정으로 리셋되었습니다.");
    }
  };

  return (
    <div className="backup-section">
      <button className="btn btn-secondary" onClick={handleExport}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        백업 받기 (Export)
      </button>

      <div className="backup-btn-container">
        <button className="btn btn-secondary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          복구 하기 (Import)
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="file-input-hidden"
          accept=".json"
          onChange={handleImport}
          title="백업 복구용 파일 선택"
        />
      </div>

      <button className="btn btn-danger" onClick={handleReset}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
        전체 초기화 (Reset)
      </button>
    </div>
  );
}
