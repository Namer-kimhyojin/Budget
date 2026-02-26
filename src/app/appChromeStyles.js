export const rootWrapper = {
  display: 'flex',
  flexDirection: 'row',
  width: '100vw',
  height: '100vh',
  background: '#f8fafc',
  fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  color: '#1e293b',
  WebkitFontSmoothing: 'antialiased',
  letterSpacing: '-0.01em',
  overflow: 'hidden',
};

export const sideNav = {
  background: '#1a2332',
  display: 'flex',
  flexDirection: 'column',
  width: 230,
  minWidth: 230,
  flexShrink: 0,
  borderRight: '1px solid rgba(255,255,255,0.05)',
  height: '100vh',
};
export const sidebarLogoArea = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '20px 18px 16px',
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};
export const logoIconBox = {
  width: 32,
  height: 32,
  background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(8,145,178,0.35)',
};
export const logoTypo = { display: 'flex', flexDirection: 'column', lineHeight: 1.2, color: '#fff', minWidth: 0 };
export const logoTop = { fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' };
export const logoBottom = { fontSize: '10px', opacity: 0.4, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
export const navScrollArea = { flex: 1, padding: '12px 10px', overflowY: 'auto' };
export const navDivider = { height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 8px' };
export const navSectionWrap = { marginBottom: 2 };
export const navSectionTitle = { color: 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 14px 5px' };
export const navItem = {
  height: 36,
  padding: '0 12px',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  marginBottom: 1,
  transition: 'all 0.15s',
  gap: 9,
};
export const navIconSlot = { width: 20, display: 'flex', justifyContent: 'center', opacity: 0.6, flexShrink: 0 };
export const navLabelSlot = { fontSize: '13px', fontWeight: 500 };
export const sidebarUserArea = {
  borderTop: '1px solid rgba(255,255,255,0.05)',
  padding: '10px 14px',
  flexShrink: 0,
};
export const sidebarUserTile = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  cursor: 'pointer',
  padding: '8px 10px',
  borderRadius: 10,
  transition: 'background 0.15s',
  color: '#fff',
};
export const avatarCircle = {
  width: 28,
  height: 28,
  background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  color: '#fff',
  fontSize: '10px',
  flexShrink: 0,
};
export const uNameLabel = { fontSize: '12px', fontWeight: 600, color: '#cbd5e1' };
export const uRoleTag = { fontSize: '10px', opacity: 0.45, fontWeight: 500, color: '#94a3b8' };
export const workspaceArea = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' };
export const viewPortPadding = { flex: 1, padding: '24px 32px', overflowY: 'auto', scrollbarGutter: 'stable' };
export const btnP = { background: '#0059b3', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '13px' };
export const lOv = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b' };
export const lCd = { width: 400, background: '#fff', padding: '48px', borderRadius: 24, textAlign: 'center', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' };
export const lF = { display: 'flex', alignItems: 'center', gap: 12, background: '#f1f5f9', padding: '16px 20px', borderRadius: 14, marginTop: 16 };
export const lI = { flex: 1, border: 'none', background: 'transparent', outline: 'none' };
export const lB = { width: '100%', marginTop: 32, background: '#0059b3', color: '#fff', border: 'none', padding: '18px', borderRadius: 14, fontWeight: 800 };
export const mOv = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
export const mCd = { background: '#fff', padding: '28px 28px 24px', borderRadius: 16, width: 420, maxWidth: '92vw', boxShadow: '0 20px 48px -12px rgba(15,23,42,0.22), 0 4px 12px -4px rgba(15,23,42,0.10)' };
export const mBs = { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' };
export const btnG = { padding: '10px 20px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b', fontSize: '13px' };
export const lFull = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcfd' };
export const lSp = { width: 48, height: 48, border: '4px solid #f1f5f9', borderTop: '4px solid #0059b3', borderRadius: '50%', animation: 'spin 1s linear infinite' };

const spinAnime = '@keyframes spin {0 % { transform: rotate(0deg); } 100% {transform: rotate(360deg); } }';

export function ensureAppGlobalStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ibms-app-global-style')) return;

  const styleTag = document.createElement('style');
  styleTag.id = 'ibms-app-global-style';
  styleTag.innerHTML = `
      @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");
      ${spinAnime}
      * { font-size: 14px !important; font-weight: 400 !important; font-family: inherit; box-sizing: border-box; }
      input, select, button, textarea { font-size: 14px !important; font-weight: 400 !important; font-family: inherit; border-radius: inherit; }
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; appearance: textfield; }
      th, td { font-size: 14px !important; font-weight: 400 !important; font-family: '"Pretendard Variable", Pretendard, sans-serif' !important; }
      table input { background: transparent !important; }
      table { width: 100%; border-collapse: collapse; }
      th { vertical-align: middle; }
      td { vertical-align: middle; }
      `;
  document.head.appendChild(styleTag);
}
