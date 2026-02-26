
import React, { useRef, useEffect } from 'react';
import { menuStyles } from '../styles';

export function SelectableTable({ columns = [], rows = [], selectedRows = [], onSelectChange, actions = [] }) {
    const headerCheckboxRef = useRef(null);
    const selectCount = selectedRows.length;
    const selectAll = rows.length > 0 && selectCount === rows.length;
    const selectIndeterminate = selectCount > 0 && selectCount < rows.length;

    useEffect(() => {
        if (!headerCheckboxRef.current) return;
        headerCheckboxRef.current.indeterminate = selectIndeterminate;
    }, [selectIndeterminate]);

    const toggleSelectAll = (e) => {
        const next = e.target.checked ? rows.map(row => row.id) : [];
        onSelectChange?.(next);
    };

    const toggleSelect = (id) => {
        const next = selectedRows.includes(id) ? selectedRows.filter(selectedId => selectedId !== id) : [...selectedRows, id];
        onSelectChange?.(next);
    };

    return (
        <div style={menuStyles.selectTableWrapper}>
            {selectCount > 0 && (
                <div style={menuStyles.selectActionBar}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectCount}개 선택 중</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {actions.map((action, idx) => (
                            <button key={idx} style={{ ...menuStyles.selectActionBtn, background: action.variant === 'danger' ? '#ef4444' : '#3b82f6', opacity: action.disabled ? 0.5 : 1, cursor: action.disabled ? 'not-allowed' : 'pointer' }} onClick={action.onClick} disabled={action.disabled}>
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <table style={menuStyles.simpleTable}>
                <thead>
                    <tr>
                        <th style={{ ...menuStyles.simpleTh, width: 40 }}>
                            <input ref={headerCheckboxRef} type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                        </th>
                        {columns.map(column => <th key={column.key || column.label} style={menuStyles.simpleTh}>{column.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.id}>
                            <td style={menuStyles.simpleTd}><input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                            {columns.map(column => {
                                const value = column.render ? column.render(row) : row[column.key];
                                return <td key={`${row.id}-${column.key || column.label}`} style={menuStyles.simpleTd}>{value}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
