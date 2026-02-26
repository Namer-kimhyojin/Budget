import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { apiErrorMessage } from '../shared';
import { btnG, btnP, fld, selF, mOv, mCd, Label } from '../uiStyles';

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function getAncestorPath(mok, subjectById) {
  const parts = [];
  let cursor = subjectById[Number(mok.parent)];
  while (cursor && Number(cursor.level) > 1) {
    parts.unshift(cursor.name);
    cursor = subjectById[Number(cursor.parent)];
  }
  return parts.join(' > ');
}

export default function QuickAddModal({
  subjects,
  entries,
  projects,
  orgId,
  year,
  viewType,
  authAxios,
  version,
  isVersionEditable,
  versionLockMessage,
  onClose,
  onRefresh,
  onRefreshProjects,
  onRefreshSubjects,
  overlayZIndex,
  leafSubjectIds,
  modalApi,
}) {
  const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
  const [jId, setJId] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedMokId, setSelectedMokId] = useState('all');

  const jL = useMemo(
    () => subjects.filter((subject) => Number(subject.level) === 1 && subject.subject_type === viewType),
    [subjects, viewType]
  );

  useEffect(() => {
    if (!jL.length) {
      if (jId) setJId('');
      return;
    }
    if (!jL.some((item) => String(item.id) === String(jId))) {
      setJId('');
    }
  }, [jId, jL]);

  // Reset mok selection when jang changes
  useEffect(() => {
    setSelectedMokId('all');
  }, [jId]);

  const selectedJang = useMemo(
    () => jL.find((item) => String(item.id) === String(jId)) || null,
    [jL, jId]
  );

  const isPurposeBusiness = useMemo(
    () => viewType === 'expense' && String(selectedJang?.name || '').includes('목적사업비'),
    [viewType, selectedJang?.name]
  );

  useEffect(() => {
    if (!isPurposeBusiness && projectName) {
      setProjectName('');
    }
  }, [isPurposeBusiness, projectName]);

  const trimmedProjectName = String(projectName || '').trim();
  const normalizedProjectName = normalizeName(trimmedProjectName);

  const hasDuplicateProjectName = useMemo(() => {
    if (!isPurposeBusiness || !normalizedProjectName) return false;
    return projects.some((project) => (
      Number(project.organization) === Number(orgId)
      && Number(project.year) === Number(year)
      && normalizeName(project.name) === normalizedProjectName
    ));
  }, [projects, orgId, year, isPurposeBusiness, normalizedProjectName]);

  const subjectById = useMemo(() => {
    const map = {};
    subjects.forEach((subject) => {
      map[Number(subject.id)] = subject;
    });
    return map;
  }, [subjects]);

  // All leaf subjects under selected jang
  const allMokCandidates = useMemo(() => {
    const targetJangId = Number(jId);
    if (!targetJangId || !leafSubjectIds) return [];

    return subjects
      .filter((subject) => leafSubjectIds.has(Number(subject.id)) && subject.subject_type === viewType)
      .filter((mok) => {
        let cursor = mok;
        while (cursor && Number(cursor.level) > 1) {
          cursor = subjectById[Number(cursor.parent)];
        }
        return cursor && Number(cursor.id) === targetJangId;
      })
      .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
  }, [jId, subjects, leafSubjectIds, subjectById, viewType]);

  // Unregistered mok candidates (for current org/year/round/project)
  const unregisteredMoks = useMemo(() => {
    if (!allMokCandidates.length || !orgId) return allMokCandidates;
    const organizationId = Number(orgId);
    const roundNo = Number(version?.round ?? 0);
    // entrustedProjectId is null for non-purpose-business (we don't know project id yet at this stage)
    // For non-purpose-business, filter by entrusted_project=null
    // For purpose-business, we can't pre-filter since project doesn't exist yet
    if (isPurposeBusiness) return allMokCandidates; // all are candidates when creating new project

    return allMokCandidates.filter((mok) => {
      const exists = entries.some((entry) => (
        Number(entry.subject) === Number(mok.id)
        && Number(entry.organization) === organizationId
        && Number(entry.year) === Number(year)
        && Number(entry.supplemental_round ?? 0) === roundNo
        && (entry.entrusted_project == null ? null : Number(entry.entrusted_project)) === null
      ));
      return !exists;
    });
  }, [allMokCandidates, entries, orgId, year, version, isPurposeBusiness]);

  const createPurposeProject = async () => {
    if (!trimmedProjectName) {
      _alert('과제명을 입력해 주세요.');
      return null;
    }
    if (hasDuplicateProjectName) {
      _alert('동일한 과제명이 이미 등록되어 있습니다. 다른 과제명을 입력해 주세요.');
      return null;
    }

    const response = await authAxios.post('/api/entrusted-projects/', {
      name: trimmedProjectName,
      organization: Number(orgId),
      year: Number(year),
      status: 'ACTIVE',
    });

    return Number(response?.data?.id || 0) || null;
  };

  const createEntry = async () => {
    if (!orgId) {
      _alert('부서/팀 범위를 먼저 선택해 주세요.');
      return;
    }
    if (!isVersionEditable) {
      _alert(versionLockMessage);
      return;
    }
    if (!jId) {
      _alert('장을 선택해 주세요.');
      return;
    }
    if (isPurposeBusiness && !trimmedProjectName) {
      _alert('목적사업비는 과제명을 입력해야 합니다.');
      return;
    }
    if (isPurposeBusiness && hasDuplicateProjectName) {
      _alert('동일한 과제명이 이미 등록되어 있습니다. 다른 과제명을 입력해 주세요.');
      return;
    }
    const organizationId = Number(orgId);
    const roundNo = Number(version?.round ?? 0);

    try {
      setLoading(true);

      let entrustedProjectId = null;
      if (isPurposeBusiness) {
        entrustedProjectId = await createPurposeProject();
        if (!entrustedProjectId) return;
      }

      // 목적사업비: 과제 생성 후 첫 번째 목 1개만 추가 (장 행이 예산대장에 표시되도록)
      if (isPurposeBusiness) {
        if (!allMokCandidates.length) {
          _alert('선택한 장에 등록 가능한 목 항목이 없습니다. 과목 관리에서 하위 목을 먼저 등록해 주세요.');
          return;
        }
        const firstMok = allMokCandidates[0];
        await authAxios.post('/api/entries/', {
          subject: Number(firstMok.id),
          organization: organizationId,
          entrusted_project: entrustedProjectId,
          year: Number(year),
          supplemental_round: roundNo,
          budget_category: 'ORIGINAL',
          carryover_type: 'NONE',
        });
        await Promise.all([onRefresh(), onRefreshProjects?.(), onRefreshSubjects?.()]);
        onClose();
        return;
      }

      if (!allMokCandidates.length) {
        _alert('선택한 장에 등록 가능한 목 항목이 없습니다. 과목 관리에서 하위 목을 먼저 등록해 주세요.');
        return;
      }

      // Determine which moks to add
      let toAdd = [];
      if (selectedMokId === 'all') {
        toAdd = allMokCandidates.filter((mok) => {
          const exists = entries.some((entry) => (
            Number(entry.subject) === Number(mok.id)
            && Number(entry.organization) === organizationId
            && Number(entry.year) === Number(year)
            && Number(entry.supplemental_round ?? 0) === roundNo
            && ((entry.entrusted_project == null ? null : Number(entry.entrusted_project)) === entrustedProjectId)
          ));
          return !exists;
        });
      } else {
        const selected = allMokCandidates.find((mok) => String(mok.id) === String(selectedMokId));
        if (!selected) {
          _alert('선택한 목 항목을 찾을 수 없습니다.');
          return;
        }
        const exists = entries.some((entry) => (
          Number(entry.subject) === Number(selected.id)
          && Number(entry.organization) === organizationId
          && Number(entry.year) === Number(year)
          && Number(entry.supplemental_round ?? 0) === roundNo
          && ((entry.entrusted_project == null ? null : Number(entry.entrusted_project)) === entrustedProjectId)
        ));
        if (exists) {
          _alert('선택한 목 항목이 이미 등록되어 있습니다.');
          return;
        }
        toAdd = [selected];
      }

      if (!toAdd.length) {
        _alert('선택한 장의 목 항목이 이미 모두 등록되어 있습니다.');
        return;
      }

      let addedCount = 0;
      for (const mok of toAdd) {
        await authAxios.post('/api/entries/', {
          subject: Number(mok.id),
          organization: organizationId,
          entrusted_project: entrustedProjectId,
          year: Number(year),
          supplemental_round: roundNo,
          budget_category: 'ORIGINAL',
          carryover_type: 'NONE',
        });
        addedCount += 1;
      }

      await Promise.all([onRefresh(), onRefreshSubjects?.()]);
      onClose();
      if (addedCount === 1) {
        _alert(`예산 항목이 추가되었습니다. (${toAdd[0].name})`);
      } else {
        _alert(`예산 항목 ${addedCount}개가 추가되었습니다.`);
      }
    } catch (error) {
      _alert(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!orgId) return false;
    if (!isVersionEditable) return false;
    if (!jId) return false;
    if (isPurposeBusiness && !trimmedProjectName) return false;
    if (isPurposeBusiness && hasDuplicateProjectName) return false;
    return true;
  }, [
    loading,
    orgId,
    isVersionEditable,
    jId,
    isPurposeBusiness,
    trimmedProjectName,
    hasDuplicateProjectName,
  ]);

  const submitHint = useMemo(() => {
    if (!orgId) return '좌측에서 부서 범위를 먼저 선택해 주세요.';
    if (!isVersionEditable) return versionLockMessage;
    if (!jId) return '장을 선택해 주세요.';
    if (isPurposeBusiness && !trimmedProjectName) return '목적사업비는 과제명을 입력해야 합니다.';
    if (isPurposeBusiness && hasDuplicateProjectName) return '중복 과제명은 사용할 수 없습니다.';
    if (jId && !isPurposeBusiness && !allMokCandidates.length) return '선택한 장에 등록 가능한 목 항목이 없습니다.';
    if (jId && selectedMokId === 'all') {
      const unreg = unregisteredMoks.length;
      if (!isPurposeBusiness && unreg === 0) return '선택한 장의 목 항목이 이미 모두 등록되어 있습니다.';
      if (!isPurposeBusiness) return `미등록 목 ${unreg}개가 일괄 추가됩니다.`;
      return '과제만 등록됩니다. 목 항목은 예산대장에서 수기로 추가하세요.';
    }
    return '선택한 목 항목이 추가됩니다.';
  }, [orgId, isVersionEditable, versionLockMessage, jId, isPurposeBusiness, trimmedProjectName, hasDuplicateProjectName, allMokCandidates.length, unregisteredMoks.length, selectedMokId]);

  const stepPanelStyle = { border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: 14 };
  const stepLabelStyle = { fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 8 };
  const helperTextStyle = { fontSize: 11, color: '#64748b', lineHeight: 1.5 };

  const showMokStep = jId && !isPurposeBusiness && allMokCandidates.length > 0;

  return (
    <div style={{ ...mOv, ...(overlayZIndex != null ? { zIndex: overlayZIndex } : null) }} onClick={onClose}>
      <div
        style={{ ...mCd, width: 'min(580px, calc(100vw - 24px))', padding: 0, overflow: 'hidden' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>예산 항목 추가</h3>
          <X size={20} onClick={onClose} style={{ cursor: 'pointer', color: '#64748b' }} />
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Step 1: 장 선택 */}
          <div style={stepPanelStyle}>
            <div style={stepLabelStyle}>1단계. 장 선택</div>
            <div style={fld}>
              <Label>장</Label>
              <select style={selF} value={jId} onChange={(event) => setJId(event.target.value)}>
                <option value="">장을 선택해 주세요</option>
                {jL.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              {!jL.length && (
                <div style={{ ...helperTextStyle, color: '#b91c1c' }}>
                  현재 선택한 예산유형에 등록된 장 항목이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* Step 2: 목적사업비 과제명 */}
          {isPurposeBusiness && (
            <div style={stepPanelStyle}>
              <div style={stepLabelStyle}>2단계. 목적사업비 과제명 입력</div>
              <div style={fld}>
                <Label>과제명</Label>
                <input
                  placeholder="과제명을 입력해 주세요"
                  style={{ ...selF, width: '100%', boxSizing: 'border-box' }}
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                />
                {hasDuplicateProjectName && (
                  <div style={{ fontSize: 11, color: '#dc2626' }}>
                    동일한 과제명이 이미 등록되어 있습니다.
                  </div>
                )}
                <div style={helperTextStyle}>
                  과제명 등록 후 예산대장에서 목 항목을 수기로 추가해 주세요.
                </div>
              </div>
            </div>
          )}

          {/* Step 2/3: 목 선택 (non-purpose-business) */}
          {showMokStep && (
            <div style={stepPanelStyle}>
              <div style={stepLabelStyle}>2단계. 목 선택</div>
              <div style={fld}>
                <Label>추가할 목</Label>
                <select
                  style={selF}
                  value={selectedMokId}
                  onChange={(event) => setSelectedMokId(event.target.value)}
                >
                  <option value="all">
                    미등록 전체 추가 ({unregisteredMoks.length}개)
                  </option>
                  {allMokCandidates.map((mok) => {
                    const alreadyExists = !unregisteredMoks.some((m) => Number(m.id) === Number(mok.id));
                    const ancestorPath = getAncestorPath(mok, subjectById);
                    return (
                      <option key={mok.id} value={mok.id} disabled={alreadyExists}>
                        {ancestorPath ? `${ancestorPath} > ` : ''}{mok.name}{alreadyExists ? ' (등록됨)' : ''}
                      </option>
                    );
                  })}
                </select>
                {unregisteredMoks.length === 0 && (
                  <div style={{ ...helperTextStyle, color: '#b91c1c' }}>
                    이 장의 목 항목이 모두 등록되어 있습니다.
                  </div>
                )}
                {unregisteredMoks.length > 0 && (
                  <div style={helperTextStyle}>
                    등록되지 않은 목 {unregisteredMoks.length}개 / 전체 {allMokCandidates.length}개
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info when no mok available */}
          {jId && !isPurposeBusiness && allMokCandidates.length === 0 && (
            <div style={{ ...stepPanelStyle, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: 11, color: '#c2410c' }}>
                선택한 장에 등록 가능한 목 항목이 없습니다.<br />
                과목 관리에서 하위 목을 먼저 등록해 주세요.
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ fontSize: 11, color: canSubmit ? '#64748b' : '#b91c1c', marginBottom: 10 }}>
            {submitHint}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ ...btnG, flex: 1 }} onClick={onClose}>취소</button>
            <button
              style={{
                ...btnP,
                flex: 2,
                padding: 12,
                opacity: canSubmit ? 1 : 0.6,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
              disabled={!canSubmit}
              onClick={createEntry}
            >
              {loading ? '처리 중...' : '예산 항목 추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
