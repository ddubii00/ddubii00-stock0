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

  const handleExcelExport = () => {
    const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    const row = (values) => `<Row>${values.map((value) => `<Cell><Data ss:Type="String">${escape(value)}</Data></Cell>`).join('')}</Row>`;
    const dates = [...new Set([...Object.keys(dataToBackup.records || {}), dataToBackup.selectedDate])].filter(Boolean).sort();
    const rows = [row(['날짜', '항목', '수행여부', '오늘 핵심 메모', '못 한 이유', '내일 보완할 것'])];
    dates.forEach((date) => {
      const record = dataToBackup.records?.[date] || {};
      dataToBackup.tasks.forEach((task) => rows.push(row([
        date, task.title, record.checks?.[task.id] ? '함' : '안함',
        record.notes?.market || '', record.notes?.trade || '', record.notes?.tomorrow || ''
      ])));
    });
    const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="수행기록"><Table>${rows.join('')}</Table></Worksheet></Workbook>`;
    const blob = new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock_routine_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);

        // Basic validation
        if (!parsedData.mottos || !parsedData.tasks || !parsedData.records) {
          throw new Error("백업 파일 형식이 올바르지 않습니다. (mottos, tasks 및 records 필드 누락)");
        }

        if (!Array.isArray(parsedData.mottos)) {
          throw new Error("mottos 데이터 형식이 올바르지 않습니다.");
        }

        if (typeof parsedData.records !== 'object') {
          throw new Error("records 데이터 형식이 올바르지 않습니다.");
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

      <button className="btn btn-secondary" onClick={handleExcelExport}>Excel 저장</button>

      <div className="backup-btn-container">
        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
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
