import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apiErrorMessage } from '../shared';
import { over, drw, drH, drB, fld, selF, btnP, cp, Label } from '../uiStyles';

export default function HierarchyEntrySelector({ subjects, entries, parentSubject, orgId, projectId, year, authAxios, version, isVersionEditable, versionLockMessage, onClose, onRefresh, overlayZIndex, modalApi }) {
  const [selectedGwanId, setSelectedGwanId] = useState('');
  const [selectedHangId, setSelectedHangId] = useState('');
  const [selectedMokId, setSelectedMokId] = useState('');
  const [loading, setLoading] = useState(false);

  const usedMokIds = new Set(
    entries
      .filter(e => Number(e.organization) === Number(orgId) && Number(e.year) === Number(year))
      .map(e => Number(e.subject))
  );

  const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);

  const handleAddEntry = async (mokId) => {
    if (!isVersionEditable) {
      _alert(versionLockMessage);
      return;
    }
    if (!mokId) {
      _alert('목 항목을 선택하세요.');
      return;
    }
    try {
      setLoading(true);
      await authAxios.post('/api/entries/', {
        subject: Number(mokId),
        organization: Number(orgId),
        entrusted_project: projectId ? Number(projectId) : null,
        year: Number(year),
        supplemental_round: Number(version?.round ?? 0),
        budget_category: 'ORIGINAL',
        carryover_type: 'NONE',
      });
      onRefresh();
      onClose();
      _alert('예산 항목이 추가되었습니다.');
    } catch (e) {
      _alert(apiErrorMessage(e, '항목 추가 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const level = parentSubject.level;

  return (
    <div style={{ ...over, ...(overlayZIndex != null ? { zIndex: overlayZIndex } : null) }} onClick={onClose}>
      <div style={drw} onClick={e => e.stopPropagation()}>
        <div style={drH}>
          <h3>하위 항목 추가 · {parentSubject.name}</h3>
          <X size={20} onClick={onClose} style={cp} />
        </div>
        <div style={drB}>
          {level === 1 && (
            <div style={fld}>
              <Label>관 선택</Label>
              <select
                style={selF}
                value={selectedGwanId}
                onChange={e => {
                  setSelectedGwanId(e.target.value);
                  setSelectedHangId('');
                  setSelectedMokId('');
                }}
              >
                <option value="">-- 관을 선택하세요 --</option>
                {subjects
                  .filter(s => s.parent === parentSubject.id && s.level === 2 && s.subject_type === parentSubject.subject_type)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {(level <= 2 && (level === 2 || selectedGwanId)) && (
            <div style={fld}>
              <Label>항 선택</Label>
              <select
                style={selF}
                value={selectedHangId}
                onChange={e => {
                  setSelectedHangId(e.target.value);
                  setSelectedMokId('');
                }}
              >
                <option value="">-- 항을 선택하세요 --</option>
                {subjects
                  .filter(s => s.parent === Number(level === 2 ? parentSubject.id : selectedGwanId) && s.level === 3 && s.subject_type === parentSubject.subject_type)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {(level <= 3 && (level === 3 || selectedHangId)) && (
            <div style={fld}>
              <Label>목 선택</Label>
              <select
                style={selF}
                value={selectedMokId}
                onChange={e => setSelectedMokId(e.target.value)}
              >
                <option value="">-- 목을 선택하세요 --</option>
                {subjects
                  .filter(s => {
                    const parentMatch = s.parent === Number(level === 3 ? parentSubject.id : selectedHangId);
                    if (!parentMatch) return false;
                    if (s.subject_type !== parentSubject.subject_type) return false;

                    // Allow Level 4 OR any leaf node that is a child of the current parent
                    const isLevel4 = s.level === 4;
                    const isLeaf = !subjects.some(child => child.parent === s.id);
                    return isLevel4 || isLeaf;
                  })
                  .map(s => (
                    <option key={s.id} value={s.id} disabled={usedMokIds.has(s.id)}>
                      [{s.code}] {s.name} {usedMokIds.has(s.id) ? '(이미 추가됨)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <button
            style={btnP}
            onClick={() => handleAddEntry(selectedMokId)}
            disabled={loading || !selectedMokId || !isVersionEditable}
          >
            {loading ? '처리 중...' : '항목 추가'}
          </button>
        </div>
      </div>
    </div>
  );
}
