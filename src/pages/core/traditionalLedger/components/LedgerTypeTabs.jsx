import React from 'react';
import { COLORS, numInThousand } from '../shared';

export default function LedgerTypeTabs({
  showCombinedTypeView,
  setViewType,
  viewType,
  incTotal,
  expTotal,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', paddingLeft: 2, marginBottom: -1, zIndex: 1, gap: 2, flexWrap: 'wrap' }}>
      {!showCombinedTypeView ? (
        <>
          <button
            onClick={() => setViewType('income')}
            style={{
              padding: '10px 28px 9px',
              borderRadius: '10px 10px 0 0',
              border: '1px solid #e2e8f0',
              borderBottom: viewType === 'income' ? '2px solid #fff' : '1px solid #e2e8f0',
              background: viewType === 'income' ? '#fff' : '#f1f5f9',
              color: viewType === 'income' ? COLORS.income : '#94a3b8',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              zIndex: viewType === 'income' ? 2 : 1,
              position: 'relative',
              transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: viewType === 'income' ? COLORS.income : '#cbd5e1' }} />
            수입예산
            <span style={{ fontSize: '11px', fontWeight: 600, color: viewType === 'income' ? COLORS.income : '#94a3b8', marginLeft: 2 }}>{numInThousand(incTotal)}</span>
          </button>
          <button
            onClick={() => setViewType('expense')}
            style={{
              padding: '10px 28px 9px',
              borderRadius: '10px 10px 0 0',
              border: '1px solid #e2e8f0',
              borderBottom: viewType === 'expense' ? '2px solid #fff' : '1px solid #e2e8f0',
              background: viewType === 'expense' ? '#fff' : '#f1f5f9',
              color: viewType === 'expense' ? COLORS.expense : '#94a3b8',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              zIndex: viewType === 'expense' ? 2 : 1,
              position: 'relative',
              transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: viewType === 'expense' ? COLORS.expense : '#cbd5e1' }} />
            지출예산
            <span style={{ fontSize: '11px', fontWeight: 600, color: viewType === 'expense' ? COLORS.expense : '#94a3b8', marginLeft: 2 }}>{numInThousand(expTotal)}</span>
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              padding: '10px 18px 9px',
              borderRadius: '10px 10px 0 0',
              border: '1px solid #bfdbfe',
              borderBottom: `2px solid ${COLORS.income}`,
              background: '#eff6ff',
              color: COLORS.income,
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'default',
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS.income }} />
            수입예산
            <span style={{ fontSize: '11px', fontWeight: 600, marginLeft: 2 }}>{numInThousand(incTotal)}</span>
          </div>
          <div
            style={{
              padding: '10px 18px 9px',
              borderRadius: '10px 10px 0 0',
              border: '1px solid #fecaca',
              borderBottom: `2px solid ${COLORS.expense}`,
              background: '#fef2f2',
              color: COLORS.expense,
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'default',
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS.expense }} />
            지출예산
            <span style={{ fontSize: '11px', fontWeight: 600, marginLeft: 2 }}>{numInThousand(expTotal)}</span>
          </div>
        </>
      )}
    </div>
  );
}
