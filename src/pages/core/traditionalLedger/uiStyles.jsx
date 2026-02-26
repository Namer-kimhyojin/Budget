/* eslint-disable react-refresh/only-export-components */

export const Label = ({ children }) => <span style={{ fontSize: '12pt', fontWeight: 800, color: '#64748b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{children}</span>;

export const over = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' };
export const drw = { width: 440, background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 25px -5px rgb(0 0 0 / 0.1)' };
export const drH = { padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
export const drB = { padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 };

export const fld = { display: 'flex', flexDirection: 'column', gap: 8 };
export const selF = { padding: '12px 16px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.9rem' };
export const btnP = { background: '#0059b3', color: '#fff', border: 'none', padding: '16px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '1rem' };
export const btnG = { padding: '12px 24px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 12, fontWeight: 700, cursor: 'pointer', color: '#64748b' };

export const mOv = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
export const mCd = { background: '#fff', padding: '40px', borderRadius: 24, width: 440, boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' };

export const cp = { cursor: 'pointer' };
