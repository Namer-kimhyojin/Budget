import React, { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, FileSpreadsheet, X } from 'lucide-react';

/**
 * BulkInputTable – 팝업 모달 형태의 Excel 스타일 테이블 일괄 입력 컴포넌트
 *
 * @param {Object} props
 * @param {Array<{key:string, label:string, type?:string, width?:number|string, options?:{value,label}[], placeholder?:string, required?:boolean, defaultValue?:string}>} props.columns
 * @param {Function} props.onSubmit - (rows) => Promise<void>
 * @param {string} [props.title]
 * @param {string} [props.submitLabel]
 * @param {number} [props.initialRows]
 */
export default function BulkInputTable({
    columns,
    onSubmit,
    title = '일괄 등록',
    submitLabel = '일괄 등록',
    initialRows = 5,
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const emptyRow = useCallback(() => {
        const row = {};
        columns.forEach(c => { row[c.key] = c.defaultValue ?? ''; });
        return row;
    }, [columns]);

    const [rows, setRows] = useState(() => Array.from({ length: initialRows }, emptyRow));
    const tableRef = useRef(null);

    const resetRows = useCallback(() => {
        setRows(Array.from({ length: initialRows }, emptyRow));
    }, [initialRows, emptyRow]);

    const updateCell = useCallback((rowIdx, colKey, value) => {
        setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [colKey]: value } : r));
    }, []);

    const addRow = useCallback(() => {
        setRows(prev => [...prev, emptyRow()]);
        setTimeout(() => {
            if (tableRef.current) tableRef.current.scrollTop = tableRef.current.scrollHeight;
        }, 50);
    }, [emptyRow]);

    const addMultipleRows = useCallback((count) => {
        setRows(prev => [...prev, ...Array.from({ length: count }, emptyRow)]);
    }, [emptyRow]);

    const removeRow = useCallback((idx) => {
        setRows(prev => {
            if (prev.length <= 1) return [emptyRow()];
            return prev.filter((_, i) => i !== idx);
        });
    }, [emptyRow]);

    const getValidRows = useCallback(() => {
        return rows.filter(row => {
            const requiredCols = columns.filter(c => c.required !== false);
            return requiredCols.every(c => {
                const val = row[c.key];
                return val !== '' && val !== null && val !== undefined;
            });
        });
    }, [rows, columns]);

    const handleSubmit = useCallback(async () => {
        const validRows = getValidRows();
        if (validRows.length === 0) {
            alert('등록할 데이터가 없습니다. 필수 항목을 입력해주세요.');
            return;
        }
        if (!window.confirm(`${validRows.length}개 항목을 일괄 등록하시겠습니까?`)) return;
        setBusy(true);
        try {
            await onSubmit(validRows);
            resetRows();
            setOpen(false);
        } catch {
            // error handling in parent onSubmit
        } finally {
            setBusy(false);
        }
    }, [getValidRows, onSubmit, resetRows]);

    // Handle paste from clipboard (Excel 복사 지원)
    const handlePaste = useCallback((e, startRow, startColIdx) => {
        const text = e.clipboardData?.getData('text/plain');
        if (!text || !text.includes('\t')) return;
        e.preventDefault();
        const pastedLines = text.split(/\r?\n/).filter(l => l.trim());
        setRows(prev => {
            const next = [...prev];
            pastedLines.forEach((line, lineIdx) => {
                const cells = line.split('\t');
                const targetRow = startRow + lineIdx;
                while (targetRow >= next.length) next.push(columns.reduce((acc, c) => ({ ...acc, [c.key]: c.defaultValue ?? '' }), {}));
                cells.forEach((cell, cellIdx) => {
                    const colIdx = startColIdx + cellIdx;
                    if (colIdx < columns.length) {
                        next[targetRow] = { ...next[targetRow], [columns[colIdx].key]: cell.trim() };
                    }
                });
            });
            return next;
        });
    }, [columns]);

    const validCount = getValidRows().length;

    const handleOpen = () => { resetRows(); setOpen(true); };
    const handleClose = () => { if (!busy) setOpen(false); };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: 7, padding: '6px 14px',
                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    color: '#1d4ed8', transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#dbeafe'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#eff6ff'; }}
            >
                <FileSpreadsheet size={13} /> {title}
            </button>

            {/* Modal Overlay */}
            {open && (
                <div
                    onClick={handleClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(15,23,42,0.45)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.15s ease-out',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#fff', borderRadius: 16,
                            width: 'min(780px, calc(100vw - 40px))',
                            maxHeight: 'calc(100vh - 60px)',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 20px 60px rgba(15,23,42,0.25), 0 4px 16px rgba(15,23,42,0.1)',
                            animation: 'slideUp 0.2s ease-out',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                            flexShrink: 0,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FileSpreadsheet size={16} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{title}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: 1 }}>
                                        엑셀에서 복사한 데이터를 붙여넣기(Ctrl+V) 할 수 있습니다
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                style={{
                                    background: '#f1f5f9', border: 'none', borderRadius: 8,
                                    width: 32, height: 32, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#64748b', transition: 'all 0.15s',
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Table Area */}
                        <div ref={tableRef} style={{
                            flex: 1, overflowY: 'auto', overflowX: 'auto',
                            padding: '0',
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{
                                            padding: '8px 6px', fontSize: '10px', fontWeight: 700, color: '#94a3b8',
                                            textAlign: 'center', borderBottom: '2px solid #e2e8f0', width: 36,
                                            background: '#f8fafc',
                                        }}>#</th>
                                        {columns.map(col => (
                                            <th key={col.key} style={{
                                                padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#475569',
                                                textAlign: 'left', borderBottom: '2px solid #e2e8f0',
                                                width: col.width || 'auto', background: '#f8fafc',
                                            }}>
                                                {col.label}
                                                {col.required !== false && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
                                            </th>
                                        ))}
                                        <th style={{
                                            padding: '8px 6px', width: 36, borderBottom: '2px solid #e2e8f0',
                                            background: '#f8fafc',
                                        }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rowIdx) => {
                                        const isValid = columns.filter(c => c.required !== false).every(c => {
                                            const v = row[c.key];
                                            return v !== '' && v !== null && v !== undefined;
                                        });
                                        return (
                                            <tr key={rowIdx} style={{
                                                background: isValid ? '#f0fdf4' : (rowIdx % 2 === 0 ? '#fff' : '#fafbfe'),
                                                borderBottom: '1px solid #f1f5f9',
                                                transition: 'background 0.1s',
                                            }}>
                                                <td style={{
                                                    padding: '5px', textAlign: 'center',
                                                    fontSize: '10px', color: '#94a3b8', fontWeight: 600,
                                                }}>
                                                    {rowIdx + 1}
                                                </td>
                                                {columns.map((col, colIdx) => (
                                                    <td key={col.key} style={{ padding: '3px 5px' }}>
                                                        {col.type === 'select' ? (
                                                            <select
                                                                value={row[col.key] || ''}
                                                                onChange={e => updateCell(rowIdx, col.key, e.target.value)}
                                                                style={{
                                                                    width: '100%', border: '1px solid #e2e8f0', borderRadius: 6,
                                                                    padding: '6px 8px', fontSize: '12px', outline: 'none',
                                                                    background: '#fff', color: '#1e293b',
                                                                }}
                                                            >
                                                                <option value="">{col.placeholder || '선택'}</option>
                                                                {(col.options || []).map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type={col.type || 'text'}
                                                                value={row[col.key] || ''}
                                                                onChange={e => updateCell(rowIdx, col.key, e.target.value)}
                                                                onPaste={e => handlePaste(e, rowIdx, colIdx)}
                                                                placeholder={col.placeholder || ''}
                                                                style={{
                                                                    width: '100%', border: '1px solid #e2e8f0', borderRadius: 6,
                                                                    padding: '6px 8px', fontSize: '12px', outline: 'none',
                                                                    background: '#fff', color: '#1e293b', boxSizing: 'border-box',
                                                                }}
                                                                onFocus={e => { e.target.style.border = '1.5px solid #60a5fa'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'; }}
                                                                onBlur={e => { e.target.style.border = '1px solid #e2e8f0'; e.target.style.boxShadow = 'none'; }}
                                                            />
                                                        )}
                                                    </td>
                                                ))}
                                                <td style={{ padding: '3px 5px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => removeRow(rowIdx)}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#cbd5e1', display: 'flex', alignItems: 'center', padding: 3,
                                                            borderRadius: 4, transition: 'all 0.1s',
                                                        }}
                                                        onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                                        onMouseOut={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none'; }}
                                                        title="행 삭제"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 20px', borderTop: '1px solid #e2e8f0',
                            background: '#f8fafc', flexShrink: 0,
                        }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button onClick={addRow} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7,
                                    padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                                    cursor: 'pointer', color: '#475569', transition: 'all 0.12s',
                                }}
                                    onMouseOver={e => { e.currentTarget.style.border = '1px solid #93c5fd'; }}
                                    onMouseOut={e => { e.currentTarget.style.border = '1px solid #e2e8f0'; }}
                                >
                                    <Plus size={12} /> 1행
                                </button>
                                <button onClick={() => addMultipleRows(5)} style={{
                                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7,
                                    padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                                    cursor: 'pointer', color: '#475569', transition: 'all 0.12s',
                                }}
                                    onMouseOver={e => { e.currentTarget.style.border = '1px solid #93c5fd'; }}
                                    onMouseOut={e => { e.currentTarget.style.border = '1px solid #e2e8f0'; }}
                                >
                                    +5행
                                </button>
                                <button onClick={resetRows} style={{
                                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7,
                                    padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                                    cursor: 'pointer', color: '#94a3b8', transition: 'all 0.12s',
                                }}>
                                    초기화
                                </button>
                                {validCount > 0 && (
                                    <span style={{
                                        fontSize: '11px', fontWeight: 700, color: '#059669',
                                        background: '#ecfdf5', borderRadius: 8, padding: '3px 10px',
                                        border: '1px solid #a7f3d0',
                                    }}>
                                        ✓ {validCount}건 입력 완료
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={handleClose}
                                    disabled={busy}
                                    style={{
                                        background: '#fff', color: '#64748b', border: '1px solid #e2e8f0',
                                        borderRadius: 8, padding: '8px 20px', fontSize: '13px', fontWeight: 700,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={busy || validCount === 0}
                                    style={{
                                        background: validCount > 0 ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#cbd5e1',
                                        color: '#fff', border: 'none', borderRadius: 8,
                                        padding: '8px 24px', fontSize: '13px', fontWeight: 800,
                                        cursor: validCount > 0 && !busy ? 'pointer' : 'not-allowed',
                                        opacity: busy ? 0.7 : 1,
                                        transition: 'all 0.15s',
                                        boxShadow: validCount > 0 ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                                    }}
                                >
                                    {busy ? '등록 중...' : `${submitLabel} (${validCount}건)`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyframe animations */}
            {open && (
                <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        `}</style>
            )}
        </>
    );
}
