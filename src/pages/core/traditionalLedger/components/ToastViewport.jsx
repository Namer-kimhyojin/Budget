import React from 'react';
import { toastItem, toastItemError, toastItemSuccess, toastViewport } from '../styles';

export default function ToastViewport({ items, zIndex }) {
  return (
    <div style={{ ...toastViewport, ...(zIndex ? { zIndex } : {}) }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{ ...toastItem, ...(item.type === 'error' ? toastItemError : toastItemSuccess) }}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}

