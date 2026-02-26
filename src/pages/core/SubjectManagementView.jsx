import React, { useEffect, useRef, useState } from 'react';
import {
  Check, ChevronDown, ChevronRight, Copy, Edit3, ExternalLink,
  FileSpreadsheet, GripVertical, Layers, Plus,
  RotateCcw, Search, Table2, Trash2, TriangleAlert, Users, X, Lock
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SubjectRow from './subjectManagement/components/SubjectRow';
import { ActionBtn } from './subjectManagement/components/ActionBtn';
import OrgAddModal from './subjectManagement/components/OrgAddModal';
import ProjCloneModal from './subjectManagement/components/ProjCloneModal';
import ProjDupDialog from './subjectManagement/components/ProjDupDialog';
import AddSubjectModal from './subjectManagement/components/AddSubjectModal';
import SnapshotPanel from './subjectManagement/components/SnapshotPanel';
import BulkInputTable from './subjectManagement/components/BulkInputTable';
import ProjectDetailModal from './subjectManagement/components/ProjectDetailModal';
import useOrgManagement from './subjectManagement/hooks/useOrgManagement';
import useProjectManagement from './subjectManagement/hooks/useProjectManagement';
import useSubjectManagement from './subjectManagement/hooks/useSubjectManagement';
import {
  LVL_COLORS, LVL_BG, LVL_BORDER, LVL_NAMES,
  thS, tdS, eInp, eSel, btnS
} from './subjectManagement/styles';

const num = (v) => (Number(v) || 0).toLocaleString();

const scoreReadableKorean = (text) => {
  if (!text) return 0;
  let score = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if ((code >= 0xac00 && code <= 0xd7a3) || ch === ' ' || ch === '\n' || ch === '\t') score += 2;
    else if ((code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) score += 1;
    else if (code === 0xfffd) score -= 4;
    else score -= 1;
  }
  return score;
};

const repairDisplayText = (value) => {
  if (value == null) return value;
  let text = String(value);
  if (!text) return text;

  if (/[\u0530-\u058F]/.test(text)) {
    text = text.replace(/[\u0530-\u058F]+/g, '\uc9c0\uae08');
  }

  const looksMojibake = /[ÃÂÐÑìíëêòøæœž]/.test(text);
  const isLatin1Range = [...text].every((ch) => ch.charCodeAt(0) <= 0xff);
  if (!looksMojibake || !isLatin1Range || typeof TextDecoder === 'undefined') return text;

  try {
    const bytes = Uint8Array.from([...text].map((ch) => ch.charCodeAt(0)));
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return scoreReadableKorean(repaired) > scoreReadableKorean(text) ? repaired : text;
  } catch {
    return text;
  }
};

const normalizeSubjectRecord = (subject) => ({
  ...subject,
  name: repairDisplayText(subject?.name),
  description: repairDisplayText(subject?.description),
});

const normalizeOrgRecord = (org) => ({
  ...org,
  name: repairDisplayText(org?.name),
});

// SubjectRow hover/action style 주입 (한 번만 DOM에 삽입)
if (typeof document !== 'undefined' && !document.getElementById('subject-row-style')) {
  const el = document.createElement('style');
  el.id = 'subject-row-style';
  el.textContent = `
    .srow { transition: background 0.1s; }
    .srow:hover { background: var(--srow-hov) !important; }
    .srow:hover .srow-actions { opacity: 1 !important; pointer-events: auto !important; }
    .srow-actions { opacity: 0; pointer-events: none; transition: opacity 0.12s; }
  `;
  document.head.appendChild(el);
}






// main component
export default function SubjectManagementView({ authAxios, subjects: subjectsProp, orgs: orgsProp, projects, entries = [], onRefresh, onNavigate, modalApi }) {
  const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
  // 로컬 상태 미러링: DnD 순서 변경 시 즉시 반영
  const [localSubjects, setLocalSubjects] = useState(() => (subjectsProp || []).map(normalizeSubjectRecord));
  const [localOrgs, setLocalOrgs] = useState(() => (orgsProp || []).map(normalizeOrgRecord));
  // 상위 props 갱신 시 로컬 상태 동기화
  // eslint-disable-next-line react-hooks/set-state-in-effect -- local mirror sync is intentional for DnD UX
  useEffect(() => { setLocalSubjects((subjectsProp || []).map(normalizeSubjectRecord)); }, [subjectsProp]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- local mirror sync is intentional for DnD UX
  useEffect(() => { setLocalOrgs((orgsProp || []).map(normalizeOrgRecord)); }, [orgsProp]);

  const subjects = localSubjects;
  const orgs = localOrgs;

  const [masterTab, setMasterTab] = useState('subjects');
  const [typeTab, setTypeTab] = useState('income');
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [projDetail, setProjDetail] = useState(null);

  const {
    orgSearchText, setOrgSearchText, orgExpanded, setOrgExpanded, orgAddModal, setOrgAddModal,
    orgEditId, orgEditData, setOrgEditData, orgBusyId, orgVisibleNodes, orgToggle, orgAllIds,
    confirmAddOrg, startOrgEdit, cancelOrgEdit, saveOrgEdit, deleteOrg, onOrgDragEnd
  } = useOrgManagement(orgs, setLocalOrgs, authAxios, modalApi);

  const {
    projSearchText, setProjSearchText, projYear, setProjYear,
    projForm, setProjForm, projEditId, setProjEditId, projEditData, setProjEditData, projCloneModal, setProjCloneModal,
    projBusy,
    projSelectedIds, setProjSelectedIds,
    filteredProjects, projYears, createProject, startProjEdit, saveProjEdit, deleteProj, bulkDeleteProjs, cloneProject,
    projSortConfig, setProjSortConfig,
    projDupDialog, setProjDupDialog, confirmCreateWithNewName,
    forceDeleteProjDialog, setForceDeleteProjDialog, confirmForceDeleteProj,
  } = useProjectManagement(projects, authAxios, onRefresh, modalApi);

  const exportProjectsToExcel = async () => {
    const XLSX = await import('xlsx');
    const data = filteredProjects.map(p => ({
      '연도': p.year,
      '코드': p.code,
      '사업명': p.name,
      '총 예산액': p.total_budget || 0,
      '관리부서': orgs.find(o => o.id === p.organization)?.name || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "수탁사업목록");
    XLSX.writeFile(wb, `수탁사업_목록_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleProjSort = (key) => {
    let direction = 'asc';
    if (projSortConfig && projSortConfig.key === key && projSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setProjSortConfig({ key, direction });
  };

  const {
    editingId, editData, setEditData, expanded, searchText, setSearchText,
    addModal, setAddModal, subjectBusyId,
    copiedSubjectName, setCopiedSubjectName, clipboardMode, hasClipboard, setHasClipboard,
    visibleNodes, countDescendants, toggle, startEdit, cancelEdit, saveEdit,
    expandAll, collapseAll, expandToLevel, subjectClipboardRef,
    deleteSubject, confirmAddSubject, onDragEnd, copySubjectToClipboard, cutSubjectToClipboard,
    pasteSubjectFromClipboard, promoteSubject, demoteSubject
  } = useSubjectManagement(subjects, setLocalSubjects, authAxios, onRefresh, typeTab, entries, modalApi);

  // counts
  const incomeCount = subjects.filter(s => s.subject_type === 'income').length;
  const expenseCount = subjects.filter(s => s.subject_type === 'expense').length;
  const canPaste = hasClipboard;

  // render
  return (
    <div style={{ width: '100%', minHeight: '800px' }}>
      {/* 상단 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #e2e8f0', paddingBottom: 0, height: 42 }}>
        {[
          { id: 'subjects', label: '예산 계정 체제', icon: <Table2 size={15} /> },
          { id: 'orgs', label: '부서/팀 관리', icon: <Users size={15} /> },
          { id: 'projects', label: '수탁사업 관리', icon: <Layers size={15} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setMasterTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: '8px 8px 0 0',
              border: masterTab === t.id ? '2px solid #e2e8f0' : '2px solid transparent',
              borderBottom: masterTab === t.id ? '2px solid #fff' : '2px solid transparent',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              background: masterTab === t.id ? '#fff' : 'transparent',
              color: masterTab === t.id ? '#1d4ed8' : '#64748b',
              marginBottom: -2,
              height: '100%',
              transition: 'background 0.2s, color 0.2s, border-color 0.2s',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 부서/팀 관리 */}
      {masterTab === 'orgs' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', width: 200 }}>
                <Search size={13} color="#94a3b8" />
                <input value={orgSearchText} onChange={e => setOrgSearchText(e.target.value)} placeholder="조직명 검색.."
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '12px', width: '100%' }} />
                {orgSearchText && <X size={12} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setOrgSearchText('')} />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setOrgExpanded(orgAllIds)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>전체 펼치기</button>
              <button onClick={() => setOrgExpanded({})} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>전체 접기</button>
              <BulkInputTable
                title="부서/팀 일괄 등록"
                submitLabel="일괄 등록"
                initialRows={3}
                columns={[
                  { key: 'name', label: '부서/팀명', placeholder: '예: 경영지원팀', required: true },
                  { key: 'parent', label: '상위 부서', type: 'select', required: false, placeholder: '(최상위)', options: orgs.filter(o => !o.parent).map(o => ({ value: String(o.id), label: o.name })) },
                  { key: 'code', label: '코드', placeholder: '자동생성', required: false },
                ]}
                onSubmit={async (rows) => {
                  let ok = 0; let fail = 0;
                  for (const row of rows) {
                    try {
                      await authAxios.post('/api/organizations/', {
                        name: row.name.trim(),
                        parent: row.parent || null,
                        code: row.code?.trim() || undefined,
                        org_type: row.parent ? 'TEAM' : 'DEPT',
                      });
                      ok++;
                    } catch { fail++; }
                  }
                  await onRefresh();
                  _alert(`일괄 등록 완료 (성공: ${ok}건${fail ? `, 실패: ${fail}건` : ''})`);
                }}
              />
              <button onClick={() => setOrgAddModal({ parent: null })}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Plus size={13} /> 부서 추가
              </button>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <DragDropContext onDragEnd={onOrgDragEnd}>
              <Droppable droppableId="org-list">
                {(provided) => (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }} ref={provided.innerRef} {...provided.droppableProps}>
                    <colgroup><col style={{ width: 4 }} /><col style={{ width: 20 }} /><col /></colgroup>
                    <tbody>
                      {orgVisibleNodes.length === 0 ? (
                        <tr><td colSpan={3} style={{ padding: 28, textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                          조직 정보가 없습니다. "부서 추가" 버튼으로 시작하세요.
                        </td></tr>
                      ) : orgVisibleNodes.map((o, idx) => {
                        const isTeam = !!(o.parent);
                        const lvlColor = isTeam ? '#0891b2' : '#1d4ed8';
                        const lvlBg = isTeam ? '#ecfeff' : '#eff6ff';
                        const lvlBdr = isTeam ? '#a5f3fc' : '#bfdbfe';
                        const rowBg = isTeam ? '#f7fffd' : '#f4f7ff';
                        const rowHov = isTeam ? '#d8fff8' : '#e0ecff';
                        const accentW = isTeam ? 2 : 4;
                        const isBusy = orgBusyId === o.id;
                        const isEd = orgEditId === o.id;
                        const indentPx = o.depth * 24;
                        return (
                          <Draggable key={String(o.id)} draggableId={String(o.id)} index={idx}>
                            {(drag, snap) => (
                              <tr ref={drag.innerRef} {...drag.draggableProps}
                                className="srow"
                                style={{ ...drag.draggableProps.style, display: 'table-row', '--srow-hov': rowHov, background: snap.isDragging ? '#e0e7ff' : isEd ? '#fefce8' : isBusy ? '#f8fafc' : rowBg, opacity: isBusy ? 0.6 : 1, borderTop: isTeam ? '1px solid #e6eff8' : '2px solid #d8e2f4', borderBottom: 'none' }}>
                                <td style={{ padding: 0, width: accentW, verticalAlign: 'stretch' }}>
                                  <div style={{ width: accentW, minHeight: '100%', background: lvlColor, opacity: isTeam ? 0.6 : 1 }} />
                                </td>
                                <td style={{ padding: '0 2px', width: 20, verticalAlign: 'middle' }}>
                                  <div {...drag.dragHandleProps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28, cursor: 'grab', color: '#cbd5e1' }}>
                                    <GripVertical size={12} />
                                  </div>
                                </td>
                                <td style={{ padding: `5px 8px 5px ${8 + indentPx}px`, verticalAlign: 'middle', position: 'relative' }}>
                                  {o.depth > 0 && <div style={{ position: 'absolute', left: 8 + (o.depth - 1) * 24 + 9, top: '50%', width: 15, height: 1, background: '#c8d5e8', pointerEvents: 'none' }} />}
                                  {o.depth > 0 && <div style={{ position: 'absolute', left: 8 + (o.depth - 1) * 24 + 9, top: 0, bottom: o.isLastChild ? '50%' : 0, width: 1, background: '#c8d5e8', pointerEvents: 'none' }} />}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                                    {o.children?.length > 0 ? (
                                      <span onClick={() => orgToggle(o.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 15, height: 15, borderRadius: 3, flexShrink: 0, background: lvlBg, border: `1px solid ${lvlBdr}`, color: lvlColor }}>
                                        {orgExpanded[o.id] ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
                                      </span>
                                    ) : <span style={{ width: 15, flexShrink: 0 }} />}
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 18, borderRadius: 4, fontSize: '10px', fontWeight: 800, background: lvlBg, color: lvlColor, border: `1px solid ${lvlBdr}`, flexShrink: 0 }}>
                                      {isTeam ? '팀' : '부서'}
                                    </span>
                                    {isEd ? (
                                      <input autoFocus style={{ border: `1.5px solid ${lvlColor}`, borderRadius: 5, padding: '3px 8px', fontSize: '12px', flex: 1, minWidth: 0, outline: 'none', fontWeight: 700, boxShadow: `0 0 0 2px ${lvlColor}22` }}
                                        value={orgEditData.name || ''}
                                        onChange={e => setOrgEditData(p => ({ ...p, name: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') saveOrgEdit(o.id); if (e.key === 'Escape') cancelOrgEdit(); }} />
                                    ) : (
                                      <span style={{ fontSize: isTeam ? '12px' : '13px', fontWeight: isTeam ? 600 : 800, color: isTeam ? '#1e293b' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {o.name}
                                      </span>
                                    )}
                                    {o.children?.length > 0 && !isEd && (
                                      <span style={{ fontSize: '10px', color: '#94a3b8', background: '#f1f5f9', borderRadius: 8, padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{o.children.length}</span>
                                    )}
                                    {isEd ? (
                                      <div style={{ display: 'inline-flex', gap: 4, flexShrink: 0 }}>
                                        <button onClick={() => saveOrgEdit(o.id)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Check size={10} /> 저장</button>
                                        <button onClick={cancelOrgEdit} style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>취소</button>
                                      </div>
                                    ) : (
                                      <div className="srow-actions" style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
                                        <ActionBtn icon={<Edit3 size={10} />} label="수정" color="#2563eb" bg="#eff6ff" border="#bfdbfe" onClick={() => startOrgEdit(o)} disabled={isBusy} />
                                        <ActionBtn icon={<Plus size={10} />} label="하위 추가" color="#059669" bg="#ecfdf5" border="#6ee7b7" onClick={() => setOrgAddModal({ parent: o })} disabled={isBusy} />
                                        <ActionBtn icon={<Trash2 size={10} />} label="삭제" color="#dc2626" bg="#fef2f2" border="#fecaca" onClick={() => deleteOrg(o.id)} disabled={isBusy} />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </tbody>
                  </table>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          {orgAddModal && (
            <OrgAddModal
              parent={orgAddModal.parent}
              onConfirm={(data) => confirmAddOrg(data, orgAddModal.parent)}
              onClose={() => setOrgAddModal(null)}
            />
          )}
        </>
      )}

      {/* 수탁사업 관리 */}
      {
        masterTab === 'projects' && (
          <>
            {/* 헤더/필터 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                  <button onClick={() => setProjYear(null)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', background: !projYear ? '#1d4ed8' : 'transparent', color: !projYear ? '#fff' : '#64748b' }}>전체</button>
                  {projYears.map(y => (
                    <button key={y} onClick={() => setProjYear(y)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', background: projYear === y ? '#1d4ed8' : 'transparent', color: projYear === y ? '#fff' : '#64748b' }}>{y}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', width: 200 }}>
                  <Search size={13} color="#94a3b8" />
                  <input value={projSearchText} onChange={e => setProjSearchText(e.target.value)} placeholder="사업명 검색.."
                    style={{ border: 'none', background: 'none', outline: 'none', fontSize: '12px', width: '100%' }} />
                  {projSearchText && <X size={12} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setProjSearchText('')} />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {projSelectedIds.length > 0 && (
                  <>
                    <button onClick={bulkDeleteProjs} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={13} /> 다중 삭제 ({projSelectedIds.length})
                    </button>
                    <button onClick={() => setProjCloneModal({ sources: filteredProjects.filter(p => projSelectedIds.includes(p.id)) })} style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Copy size={13} /> 다중 사업 복사 ({projSelectedIds.length})
                    </button>
                  </>
                )}
                <button onClick={exportProjectsToExcel} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileSpreadsheet size={13} /> 엑셀 다운로드
                </button>
                <BulkInputTable
                  title="수탁사업 일괄 등록"
                  submitLabel="일괄 등록"
                  initialRows={3}
                  columns={[
                    { key: 'name', label: '수탁사업명', placeholder: '사업명 입력', required: true },
                    { key: 'organization', label: '관리부서', type: 'select', required: true, placeholder: '부서 선택', options: orgs.filter(o => !o.parent).map(o => ({ value: String(o.id), label: o.name })) },
                    { key: 'year', label: '연도', type: 'number', width: 80, placeholder: String(new Date().getFullYear()), required: true, defaultValue: String(new Date().getFullYear()) },
                  ]}
                  onSubmit={async (rows) => {
                    let ok = 0; let fail = 0;
                    for (const row of rows) {
                      try {
                        await authAxios.post('/api/entrusted-projects/', {
                          name: row.name.trim(),
                          organization: Number(row.organization),
                          year: Number(row.year),
                          status: 'PLANNED',
                        });
                        ok++;
                      } catch { fail++; }
                    }
                    await onRefresh();
                    _alert(`일괄 등록 완료 (성공: ${ok}건${fail ? `, 실패: ${fail}건` : ''})`);
                  }}
                />
                <button onClick={() => setProjCloneModal(null) || document.getElementById('proj-add-form')?.scrollIntoView()}
                  style={{ display: 'none' }} />
              </div>
            </div>

            {/* 추가 폼 */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={projForm.name} onChange={e => setProjForm(p => ({ ...p, name: e.target.value }))} placeholder="수탁사업명 입력"
                style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 7, padding: '7px 12px', fontSize: '13px', outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter') createProject(); }} />
              <select value={projForm.organization} onChange={e => setProjForm(p => ({ ...p, organization: e.target.value }))}
                style={{ border: '1px solid #cbd5e1', borderRadius: 7, padding: '7px 10px', fontSize: '12px', outline: 'none', background: '#fff', minWidth: 130 }}>
                <option value="">관리부서 선택</option>
                {orgs.filter(o => !o.parent).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <input type="number" value={projForm.year} onChange={e => setProjForm(p => ({ ...p, year: Number(e.target.value) }))}
                style={{ width: 80, border: '1px solid #cbd5e1', borderRadius: 7, padding: '7px 10px', fontSize: '12px', outline: 'none' }} />
              <button onClick={createProject} disabled={projBusy}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                + 추가
              </button>
            </div>

            {/* 목록 */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ ...thS, width: 32, textAlign: 'center' }}><input type="checkbox" checked={filteredProjects.length > 0 && projSelectedIds.length === filteredProjects.length} onChange={e => setProjSelectedIds(e.target.checked ? filteredProjects.map(p => p.id) : [])} /></th>
                    <th style={{ ...thS, cursor: 'pointer', width: 80 }} onClick={() => handleProjSort('year')}>연도 {projSortConfig?.key === 'year' ? (projSortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th style={{ ...thS, cursor: 'pointer', width: 220 }} onClick={() => handleProjSort('organization_name')}>관리부서 {projSortConfig?.key === 'organization_name' ? (projSortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th style={{ ...thS, cursor: 'pointer' }} onClick={() => handleProjSort('name')}>수탁사업명 {projSortConfig?.key === 'name' ? (projSortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th style={{ ...thS, cursor: 'pointer', width: 120 }} onClick={() => handleProjSort('code')}>코드 {projSortConfig?.key === 'code' ? (projSortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th style={{ ...thS, textAlign: 'right', cursor: 'pointer', width: 150 }} onClick={() => handleProjSort('total_budget')}>예산액 {projSortConfig?.key === 'total_budget' ? (projSortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th style={{ ...thS, textAlign: 'right', width: 220 }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 28, textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>등록된 수탁사업이 없습니다.</td></tr>
                  ) : filteredProjects.map(p => {
                    const ie = projEditId === p.id;
                    return (
                      <tr key={p.id} className="srow" style={{ '--srow-hov': '#f0f4ff', background: ie ? '#fefce8' : 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ ...tdS, textAlign: 'center' }}><input type="checkbox" checked={projSelectedIds.includes(p.id)} onChange={e => setProjSelectedIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} /></td>
                        <td style={tdS}>{ie ? <input type="number" value={projEditData.year} onChange={e => setProjEditData(d => ({ ...d, year: Number(e.target.value) }))} style={{ ...eInp, width: 70 }} /> : <b style={{ color: '#1d4ed8' }}>{p.year}</b>}</td>
                        <td style={tdS}>{ie ? (
                          <select value={projEditData.organization} onChange={e => setProjEditData(d => ({ ...d, organization: e.target.value }))} style={{ ...eSel, width: '100%' }}>
                            {orgs.filter(o => !o.parent).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                        ) : <span style={{ fontSize: '12px', color: '#475569' }}>{orgs.find(o => o.id === p.organization)?.name || '-'}</span>}</td>
                        <td style={tdS}>{ie ? <input value={projEditData.name} onChange={e => setProjEditData(d => ({ ...d, name: e.target.value }))} style={{ ...eInp, width: '100%' }} onKeyDown={e => { if (e.key === 'Enter') saveProjEdit(p.id); }} /> : <b style={{ fontSize: '13px' }}>{p.name}</b>}</td>
                        <td style={tdS}><span style={{ fontSize: '11px', color: '#64748b' }}>{p.code}</span></td>
                        <td style={{ ...tdS, textAlign: 'right', fontSize: '12px' }}>{num(p.total_budget || 0)}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>
                          {ie ? (
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <button onClick={() => saveProjEdit(p.id)} style={btnS}>저장</button>
                              <button onClick={() => setProjEditId(null)} style={{ ...btnS, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>취소</button>
                            </div>
                          ) : p.status === 'CLOSED' ? (
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                              <ActionBtn icon={<Search size={10} />} label="상세보기" color="#0369a1" bg="#e0f2fe" border="#7dd3fc" onClick={() => setProjDetail(p)} />
                              <ActionBtn icon={<ExternalLink size={10} />} label="바로가기" color="#10b981" bg="#d1fae5" border="#6ee7b7" onClick={() => { window.history.pushState({}, '', `/planning?project=${p.id}`); onNavigate?.('planning'); }} />
                              <Lock size={12} /> 마감됨
                            </span>
                          ) : (
                            <div className="srow-actions" style={{ display: 'inline-flex', gap: 3, opacity: 0, pointerEvents: 'none', transition: 'opacity 0.12s' }}>
                              <ActionBtn icon={<ExternalLink size={10} />} label="바로가기" color="#10b981" bg="#d1fae5" border="#6ee7b7" onClick={() => { window.history.pushState({}, '', `/planning?project=${p.id}`); onNavigate?.('planning'); }} />
                              <ActionBtn icon={<Search size={10} />} label="상세보기" color="#0369a1" bg="#e0f2fe" border="#7dd3fc" onClick={() => setProjDetail(p)} />
                              <ActionBtn icon={<Edit3 size={10} />} label="수정" color="#2563eb" bg="#eff6ff" border="#bfdbfe" onClick={() => startProjEdit(p)} />
                              <ActionBtn icon={<Copy size={10} />} label="사업 복사" color="#7c3aed" bg="#f5f3ff" border="#c4b5fd" onClick={() => setProjCloneModal({ source: p })} />
                              <ActionBtn icon={<Trash2 size={10} />} label="삭제" color="#dc2626" bg="#fef2f2" border="#fecaca" onClick={() => deleteProj(p.id)} />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 중복 사업명 다이얼로그 */}
            <ProjDupDialog
              dialog={projDupDialog}
              onUseExisting={() => setProjDupDialog(null)}
              onAddWithNewName={confirmCreateWithNewName}
              onCancel={() => setProjDupDialog(null)}
            />

            {/* 수탁사업 강제 삭제 2중 확인 다이얼로그 */}
            {forceDeleteProjDialog && (
              <ForceDeleteProjDialog
                dialog={forceDeleteProjDialog}
                onConfirm={confirmForceDeleteProj}
                onCancel={() => setForceDeleteProjDialog(null)}
              />
            )}

            {/* 예산 참조 모달 */}
            {projCloneModal && (
              <ProjCloneModal
                source={projCloneModal.source}
                orgs={orgs}
                busy={projBusy}
                onConfirm={cloneProject}
                onClose={() => setProjCloneModal(null)}
              />
            )}

            {projDetail && (
              <ProjectDetailModal
                project={projDetail}
                orgs={orgs}
                authAxios={authAxios}
                onClose={() => setProjDetail(null)}
              />
            )}
          </>
        )
      }

      {/* 예산 계정 체제 */}
      {
        masterTab === 'subjects' && (
          <>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* 수입/지출 탭 */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                  <button onClick={() => setTypeTab('income')}
                    style={{
                      padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                      background: typeTab === 'income' ? '#0369a1' : 'transparent',
                      color: typeTab === 'income' ? '#fff' : '#64748b',
                    }}>
                    수입 <span style={{ opacity: 0.75, fontWeight: 600, fontSize: '10px' }}>({incomeCount})</span>
                  </button>
                  <button onClick={() => setTypeTab('expense')}
                    style={{
                      padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                      background: typeTab === 'expense' ? '#be123c' : 'transparent',
                      color: typeTab === 'expense' ? '#fff' : '#64748b',
                    }}>
                    지출 <span style={{ opacity: 0.75, fontWeight: 600, fontSize: '10px' }}>({expenseCount})</span>
                  </button>
                </div>

                {/* 검색 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', width: 220 }}>
                  <Search size={13} color="#94a3b8" />
                  <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="코드 또는 명칭 검색.."
                    style={{ border: 'none', background: 'none', outline: 'none', fontSize: '12px', width: '100%' }} />
                  {searchText && <X size={12} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSearchText('')} />}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* 전체 펼치기/접기 */}
                <button onClick={expandAll} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                  전체 펼치기
                </button>
                <button onClick={collapseAll} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                  전체 접기
                </button>


                {/* 기본값 */}
                <button onClick={() => setShowSnapshot(p => !p)}
                  style={{ background: showSnapshot ? '#fef3c7' : '#f8fafc', border: `1px solid ${showSnapshot ? '#fde68a' : '#e2e8f0'}`, borderRadius: 6, padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: showSnapshot ? '#92400e' : '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <RotateCcw size={12} /> 기본값 복원
                </button>

                {/* 최상위 추가 */}
                <button onClick={() => setAddModal({ parent: null })}
                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Plus size={13} /> {typeTab === 'income' ? '수입' : '지출'} 장 추가
                </button>
              </div>
            </div>

            {/* 기본값 복원 */}
            {showSnapshot && (
              <SnapshotPanel typeTab={typeTab} authAxios={authAxios} onRefresh={onRefresh} />
            )}


            {copiedSubjectName && (
              <div style={{ marginBottom: 8, padding: '6px 12px', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 7, fontSize: '11px', color: '#5b21b6', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Copy size={12} />
                복사된 <b>{copiedSubjectName}</b> 항목은 각 행의 "붙여넣기" 버튼으로 붙여넣을 수 있습니다.
                <button onClick={() => { subjectClipboardRef.current = null; setCopiedSubjectName(''); setHasClipboard(false); }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed' }}><X size={12} /></button>
              </div>
            )}

            {/* 계층 범례 — 클릭하면 해당 레벨까지 펼침 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginRight: 4 }}>계층:</span>
              {LVL_NAMES.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  title={i === 0 ? '장만 보기 (모두 접기)' : i + 1 >= 4 ? '전체 펼치기' : `${name}(Level ${i + 1})까지 펼치기`}
                  onClick={() => {
                    if (i === 0) collapseAll();          // 장만 보기 (모두 접기)
                    else if (i + 1 >= 4) expandAll();    // 전체 펼치기
                    else expandToLevel(i + 1);            // 해당 레벨까지 펼치기
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: LVL_BG[i], border: `1px solid ${LVL_BORDER[i]}`, borderRadius: 5, padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: LVL_COLORS[i], cursor: 'pointer' }}
                >
                  {name} <span style={{ fontWeight: 400, color: LVL_COLORS[i], opacity: 0.7 }}>Level {i + 1}</span>
                </button>
              ))}
              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}>
                행에 마우스를 올리면 수정·추가·복사·이동·삭제 버튼이 표시됩니다.
              </span>
            </div>

            {/* 트리 테이블 */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 6 }} />   {/* accent */}
                  <col style={{ width: 24 }} />  {/* drag grip */}
                  <col />                         {/* badge + name + action */}
                </colgroup>
                <thead>
                  <tr style={{ background: '#f0f4fa', borderBottom: '2px solid #d1daf0' }}>
                    <th style={{ padding: 0 }} />
                    <th style={{ padding: 0 }} />
                    <th style={{ padding: '7px 8px', fontSize: '10px', fontWeight: 700, color: '#64748b', textAlign: 'left' }}>계층 및 명칭</th>
                  </tr>
                </thead>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="subjects-list">
                    {(provided) => (
                      <tbody {...provided.droppableProps} ref={provided.innerRef}>
                        {visibleNodes.length === 0 ? (
                          <tr><td colSpan={3} style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                            {searchText ? '검색 결과가 없습니다.' : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                <span>{typeTab === 'income' ? '수입' : '지출'} 계정이 없습니다.</span>
                                <button onClick={() => setAddModal({ parent: null })}
                                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                  + 첫 번째 장 추가하기
                                </button>
                              </div>
                            )}
                          </td></tr>
                        ) : (
                          visibleNodes.map((s, index) => (
                            <Draggable key={String(s.id)} draggableId={String(s.id)} index={index}>
                              {(vProv, vSnap) => (
                                <SubjectRow
                                  s={s}
                                  depth={s.depth}
                                  lineData={s.lineData}
                                  isLastChild={s.isLastChild}
                                  dragProvided={vProv}
                                  isDragging={vSnap.isDragging}
                                  editingId={editingId}
                                  editData={editData}
                                  setEditData={setEditData}
                                  saveEdit={saveEdit}
                                  cancelEdit={cancelEdit}
                                  subjectBusyId={subjectBusyId}
                                  expanded={expanded}
                                  toggle={toggle}
                                  countDescendants={countDescendants}
                                  onStartEdit={startEdit}
                                  onAddChild={(parent) => setAddModal({ parent })}
                                  onCopy={copySubjectToClipboard}
                                  onCut={cutSubjectToClipboard}
                                  onPaste={pasteSubjectFromClipboard}
                                  onDelete={deleteSubject}
                                  onPromote={promoteSubject}
                                  onDemote={demoteSubject}
                                  canPaste={canPaste}
                                  clipboardMode={clipboardMode}
                                />
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                </DragDropContext>
              </table>
            </div>
          </>
        )
      }

      {/* 추가 모달 */}
      {
        addModal && (
          <AddSubjectModal
            parent={addModal.parent}
            onConfirm={(data) => confirmAddSubject(data, addModal.parent)}
            onClose={() => setAddModal(null)}
          />
        )
      }

    </div >
  );
}

function ForceDeleteProjDialog({ dialog, onConfirm, onCancel }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: 480, maxWidth: '90vw',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <TriangleAlert size={22} color="#fff" />
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>수탁사업 강제 삭제</span>
        </div>
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: 12, padding: '14px 16px', marginBottom: 20,
          }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#b91c1c', fontSize: 14 }}>
              ⚠ 이 작업은 되돌릴 수 없습니다
            </p>
            <p style={{ margin: 0, color: '#7f1d1d', fontSize: 13, lineHeight: 1.6 }}>
              <strong>"{dialog.name}"</strong> 수탁사업과 연결된{' '}
              <strong>예산 항목 {dialog.entryCount.toLocaleString()}건</strong>이 모두 영구 삭제됩니다.
            </p>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569', fontWeight: 600 }}>
            계속하려면 아래 입력란에{' '}
            <code style={{
              background: '#f1f5f9', padding: '2px 7px', borderRadius: 5,
              fontFamily: 'monospace', fontWeight: 800, color: '#dc2626', fontSize: 13,
            }}>DELETE</code>를 입력하세요.
          </p>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input === 'DELETE') onConfirm(); }}
            placeholder="DELETE"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `2px solid ${input === 'DELETE' ? '#dc2626' : '#e2e8f0'}`,
              borderRadius: 10, padding: '10px 14px',
              fontSize: 15, fontWeight: 700, fontFamily: 'monospace',
              outline: 'none', color: '#0f172a', transition: 'border-color 0.2s',
            }}
          />
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{
            padding: '10px 22px', borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14,
          }}>취소</button>
          <button type="button" disabled={input !== 'DELETE'} onClick={onConfirm} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none',
            background: input === 'DELETE' ? '#dc2626' : '#fca5a5',
            color: '#fff', fontWeight: 800, fontSize: 14,
            cursor: input === 'DELETE' ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            boxShadow: input === 'DELETE' ? '0 4px 6px -1px rgba(220,38,38,0.3)' : 'none',
          }}>강제 삭제</button>
        </div>
      </div>
    </div>
  );
}
