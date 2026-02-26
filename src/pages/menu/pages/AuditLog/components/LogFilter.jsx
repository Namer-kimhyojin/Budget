import React from 'react';
import { menuStyles } from '../../../shared/menuUi';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleInput, simpleSelect, menuGhostBtn } = menuStyles;
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' };

export default function LogFilter({
  keyword,
  setKeyword,
  statusFilter,
  setStatusFilter,
  logTypeFilter,
  setLogTypeFilter,
  actionFilter,
  setActionFilter,
  actorFilter,
  setActorFilter,
  entryFilter,
  setEntryFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  resetFilters,
}) {
  const setToday = () => {
    const s = new Date().toISOString().slice(0, 10);
    setFromDate(s);
    setToDate(s);
  };

  const setLastWeek = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    setToDate(to.toISOString().slice(0, 10));
    setFromDate(from.toISOString().slice(0, 10));
  };

  const setLastMonth = () => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    setToDate(to.toISOString().slice(0, 10));
    setFromDate(from.toISOString().slice(0, 10));
  };

  return (
    <section style={menuPanelCard}>
      <div style={menuPanelHead}>검색 / 필터</div>
      <div style={menuPanelBody}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <div>
            <label style={labelStyle}>키워드</label>
            <input
              style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
              placeholder="처리자/사유/리소스"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>로그 구분</label>
            <select
              style={{ ...simpleSelect, width: '100%', boxSizing: 'border-box' }}
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
            >
              <option value="">전체</option>
              <option value="WORKFLOW">WORKFLOW</option>
              <option value="AUTH">AUTH</option>
              <option value="CRUD">CRUD</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>상태</label>
            <select
              style={{ ...simpleSelect, width: '100%', boxSizing: 'border-box' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">전체</option>
              <option value="DRAFT">작성중</option>
              <option value="PENDING">제출</option>
              <option value="REVIEWING">검토중</option>
              <option value="FINALIZED">확정</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>액션</label>
            <input
              style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
              placeholder="예: CREATE, UPDATE"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>처리자</label>
            <input
              style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
              placeholder="처리자명"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Entry ID</label>
            <input
              style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
              placeholder="예: 42"
              value={entryFilter}
              onChange={(e) => setEntryFilter(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>시작일</label>
            <input
              style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>종료일</label>
            <input
              style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <button style={menuGhostBtn} onClick={setToday}>오늘</button>
          <button style={menuGhostBtn} onClick={setLastWeek}>1주일</button>
          <button style={menuGhostBtn} onClick={setLastMonth}>1개월</button>
          <button
            style={{ ...menuGhostBtn, marginLeft: 'auto', color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={resetFilters}
          >
            초기화
          </button>
        </div>
      </div>
    </section>
  );
}
