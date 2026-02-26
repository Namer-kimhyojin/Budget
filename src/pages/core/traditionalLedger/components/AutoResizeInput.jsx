import React from 'react';

export default function AutoResizeInput({ value, onChange, style, isNumber, onBlur, disabled, name, onKeyDown, 'data-field': dataField, 'data-detail-id': dataDetailId, 'data-entry-id': dataEntryId, 'data-last-row': dataLastRow, 'data-editable': dataEditable }) {
  const displayVal = isNumber
    ? (value == null ? '' : Number(value).toLocaleString('ko-KR'))
    : (value || '');

  return (
    <div style={{
      display: 'inline-grid',
      alignItems: 'center',
      verticalAlign: 'middle',
      border: style.border,
      borderRadius: style.borderRadius,
      background: style.background,
      padding: style.padding,
      minWidth: style.minWidth || 20,
      maxWidth: style.maxWidth,
      width: style.minWidth === style.maxWidth ? style.minWidth : 'fit-content'
    }}>
      <span style={{
        gridArea: '1/1',
        visibility: 'hidden',
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        whiteSpace: 'pre',
        padding: 0,
        margin: 0,
        height: 0,
        overflow: 'hidden'
      }}>{displayVal || '000'}</span>
      <input
        name={name}
        type="text"
        disabled={disabled}
        value={displayVal}
        onChange={e => {
          const raw = e.target.value;
          if (isNumber) {
            const parsedNumber = Number(raw.replace(/,/g, ''));
            if (!isNaN(parsedNumber)) onChange(parsedNumber);
          } else {
            onChange(raw);
          }
        }}
        onBlur={e => {
          if (onBlur) {
            if (isNumber) {
              const parsedNumber = Number(e.target.value.replace(/,/g, ''));
              if (!isNaN(parsedNumber)) onBlur(parsedNumber);
            } else {
              onBlur(e.target.value);
            }
          }
        }}
        onKeyDown={onKeyDown}
        data-field={dataField}
        data-detail-id={dataDetailId}
        data-entry-id={dataEntryId}
        data-last-row={dataLastRow}
        data-editable={dataEditable}
        style={{
          ...style,
          border: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          width: '100%',
          minWidth: '100%',
          gridArea: '1/1',
          textAlign: style.textAlign
        }}
      />
    </div>
  );
}
