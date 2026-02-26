import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Lock, ShieldCheck, User } from 'lucide-react';
import {
  btnG,
  btnP,
  lFull,
  lSp,
  mBs,
  mCd,
  mOv,
} from '../appChromeStyles';

function ensureLoginScreenStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ibms-login-screen-style')) return;

  const styleTag = document.createElement('style');
  styleTag.id = 'ibms-login-screen-style';
  styleTag.innerHTML = `
    @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap");

    @keyframes ibmsLoginFloatA {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(30px, -24px, 0) scale(1.06); }
    }
    @keyframes ibmsLoginFloatB {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(-24px, 20px, 0) scale(1.04); }
    }
    @keyframes ibmsLoginPanelIn {
      from { opacity: 0; transform: translateY(16px) scale(0.986); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .ibms-login-root {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background:
        radial-gradient(800px 520px at 8% 12%, rgba(186,230,253,0.40) 0%, transparent 60%),
        radial-gradient(700px 480px at 92% 88%, rgba(187,247,208,0.35) 0%, transparent 60%),
        radial-gradient(600px 420px at 85% 5%,  rgba(254,215,170,0.25) 0%, transparent 55%),
        linear-gradient(160deg, #f0f7ff 0%, #fafffe 45%, #f5fdf8 100%);
      font-family: "Sora", "Pretendard Variable", Pretendard, "Noto Sans KR", sans-serif;
      color: #0f172a;
      padding: 24px 20px;
      gap: 16px;
    }

    /* ── aurora blobs ── */
    .ibms-login-aurora {
      position: fixed;
      border-radius: 999px;
      filter: blur(72px);
      pointer-events: none;
      opacity: 0.50;
    }
    .ibms-login-aurora-a {
      width: 440px; height: 440px;
      left: -140px; top: -160px;
      background: radial-gradient(circle, #7dd3fc 0%, #38bdf8 55%, transparent 75%);
      animation: ibmsLoginFloatA 16s ease-in-out infinite;
    }
    .ibms-login-aurora-b {
      width: 480px; height: 480px;
      right: -160px; bottom: -180px;
      background: radial-gradient(circle, #6ee7b7 0%, #10b981 55%, transparent 75%);
      animation: ibmsLoginFloatB 19s ease-in-out infinite;
    }
    .ibms-login-aurora-c {
      width: 320px; height: 320px;
      right: 5%; top: -60px;
      background: radial-gradient(circle, #fde68a 0%, #fb923c 60%, transparent 78%);
      opacity: 0.22;
      animation: ibmsLoginFloatB 13s ease-in-out infinite reverse;
    }

    /* ── 메인 카드 ── */
    .ibms-login-card {
      position: relative;
      z-index: 2;
      width: min(1020px, 100%);
      border-radius: 28px;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.72);
      box-shadow:
        0 2px 0 0 rgba(255,255,255,0.88) inset,
        0 24px 56px -24px rgba(15,23,42,0.24),
        0 8px 20px -12px rgba(15,23,42,0.14);
      backdrop-filter: blur(20px);
      background: rgba(255,255,255,0.72);
      animation: ibmsLoginPanelIn 0.48s cubic-bezier(0.22,1,0.36,1);
    }

    /* ── 왼쪽 브랜드 패널 ── */
    .ibms-login-brand {
      padding: 56px 48px 48px;
      background: linear-gradient(150deg,
        rgba(255,255,255,0.82) 0%,
        rgba(240,249,255,0.88) 55%,
        rgba(236,253,245,0.84) 100%);
      border-right: 1px solid rgba(148,163,184,0.14);
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    .ibms-login-brand-top {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    /* 워드마크: P.BOS 위, 풀네임 바로 아래 세로 배치 */
    .ibms-login-wordmark {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ibms-login-wordmark-abbr {
      font-size: clamp(40px, 6vw, 56px) !important;
      font-weight: 800 !important;
      letter-spacing: -0.04em;
      line-height: 1;
      background: linear-gradient(130deg, #0369a1 0%, #0891b2 40%, #0d9488 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .ibms-login-wordmark-full {
      font-size: 14px !important;
      font-weight: 600 !important;
      color: #64748b;
      letter-spacing: 0.03em;
      line-height: 1.3;
    }
    .ibms-login-tagline {
      font-size: clamp(18px, 2.4vw, 22px) !important;
      font-weight: 700 !important;
      color: #1e293b;
      line-height: 1.5;
      letter-spacing: -0.02em;
      text-wrap: balance;
    }
    /* 개조식 설명 */
    .ibms-login-desc-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .ibms-login-desc-list li {
      font-size: 15px !important;
      color: #64748b;
      line-height: 1.5;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .ibms-login-desc-list li::before {
      content: '';
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #0891b2;
      flex-shrink: 0;
    }

    /* feature grid */
    .ibms-login-features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 7px;
    }
    .ibms-login-feat {
      background: rgba(255,255,255,0.68);
      border: 1px solid rgba(148,163,184,0.16);
      border-radius: 10px;
      padding: 9px 11px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ibms-login-feat-icon {
      width: 24px; height: 24px;
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-size: 13px;
    }
    .ibms-login-feat-text {
      display: flex; flex-direction: column; gap: 1px;
    }
    .ibms-login-feat-label {
      font-size: 9px !important;
      font-weight: 700 !important;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .ibms-login-feat-value {
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #1e293b;
    }

    /* ── 오른쪽 로그인 패널 ── */
    .ibms-login-panel {
      padding: 56px 48px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0;
      background: linear-gradient(170deg,
        rgba(255,255,255,0.90) 0%,
        rgba(248,250,252,0.96) 100%);
    }
    .ibms-login-panel-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
      padding: 4px 10px 4px 7px;
      border-radius: 999px;
      background: rgba(240,253,244,0.9);
      border: 1px solid rgba(16,185,129,0.22);
      color: #065f46;
      font-size: 10px !important;
      font-weight: 700 !important;
      letter-spacing: 0.03em;
      margin-bottom: 18px;
    }
    .ibms-login-panel-badge-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16,185,129,0.22);
    }
    .ibms-login-panel-title {
      margin: 0 0 8px;
      font-size: 28px !important;
      color: #0f172a;
      font-weight: 800 !important;
      letter-spacing: -0.025em;
    }
    .ibms-login-panel-desc {
      margin: 0 0 28px;
      font-size: 15px !important;
      color: #64748b;
      line-height: 1.65;
    }
    .ibms-login-form {
      display: flex;
      flex-direction: column;
      gap: 11px;
    }
    .ibms-login-field-wrap {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .ibms-login-label {
      font-size: 10px !important;
      color: #475569;
      font-weight: 700 !important;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .ibms-login-field {
      height: 56px;
      padding: 0 16px;
      border-radius: 12px;
      border: 1.5px solid #e2e8f0;
      background: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      gap: 12px;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }
    .ibms-login-field:focus-within {
      border-color: #0891b2;
      box-shadow: 0 0 0 3px rgba(8,145,178,0.11);
      transform: translateY(-1px);
    }
    .ibms-login-input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      color: #0f172a;
      font-size: 16px !important;
      font-weight: 600 !important;
      font-family: inherit;
    }
    .ibms-login-input::placeholder {
      color: #94a3b8;
      font-weight: 400 !important;
    }
    .ibms-login-submit {
      margin-top: 8px;
      height: 58px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      background: linear-gradient(118deg, #0369a1 0%, #0891b2 45%, #0d9488 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 16px !important;
      font-weight: 800 !important;
      letter-spacing: 0.01em;
      font-family: inherit;
      box-shadow:
        0 1px 0 0 rgba(255,255,255,0.18) inset,
        0 12px 28px -12px rgba(3,105,161,0.65);
      transition: transform 0.14s, box-shadow 0.16s, filter 0.16s;
    }
    .ibms-login-submit:hover {
      transform: translateY(-1px);
      filter: brightness(1.06);
      box-shadow: 0 1px 0 0 rgba(255,255,255,0.18) inset, 0 16px 34px -12px rgba(3,105,161,0.70);
    }
    .ibms-login-submit:active { transform: translateY(0); }
    .ibms-login-submit:disabled { cursor: wait; opacity: 0.72; transform: none; box-shadow: none; }

    .ibms-login-footer-note {
      margin-top: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px !important;
      color: #94a3b8;
      font-weight: 500 !important;
    }

    /* ── 카드 아래 카피라이트 ── */
    .ibms-login-copyright {
      position: relative;
      z-index: 3;
      font-size: 11px !important;
      color: #94a3b8;
      font-weight: 500 !important;
      letter-spacing: 0.01em;
      text-align: center;
      line-height: 1.7;
    }
    .ibms-login-copyright a {
      color: #94a3b8;
      text-decoration: none;
    }

    @media (max-width: 780px) {
      .ibms-login-root { padding: 18px 14px; gap: 14px; }
      .ibms-login-card {
        grid-template-columns: 1fr;
        width: min(440px, 100%);
      }
      .ibms-login-brand {
        padding: 26px 24px 20px;
        border-right: none;
        border-bottom: 1px solid rgba(148,163,184,0.14);
      }
      .ibms-login-features { grid-template-columns: repeat(2, 1fr); }
      .ibms-login-ver { display: none; }
      .ibms-login-panel { padding: 24px 24px 24px; }
      .ibms-login-panel-badge { margin-bottom: 14px; }
    }
    @media (max-width: 440px) {
      .ibms-login-brand { padding: 22px 18px 18px; }
      .ibms-login-panel { padding: 20px 18px 20px; }
    }
  `;
  document.head.appendChild(styleTag);
}

export function LoginScreen({ onLogin, brandShort, brandFullEn, orgKo, orgEn, orgShort, version }) {
  ensureLoginScreenStyles();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onLogin(u.trim(), p));
    } finally {
      setIsSubmitting(false);
    }
  };

  const _orgShort = orgShort || 'PTP';
  const _orgKo = orgKo || '포항테크노파크';
  const _orgEn = orgEn || 'Pohang Technopark';
  const _brand = brandShort || 'P.BOS';
  const _brandFull = brandFullEn || 'PTP Budget Operation System';
  const _version = version || '1.0.0';

  return (
    <div className="ibms-login-root">
      <div className="ibms-login-aurora ibms-login-aurora-a" />
      <div className="ibms-login-aurora ibms-login-aurora-b" />
      <div className="ibms-login-aurora ibms-login-aurora-c" />

      {/* 메인 카드 */}
      <div className="ibms-login-card">

        {/* 왼쪽 브랜드 */}
        <section className="ibms-login-brand">
          <div className="ibms-login-brand-top">
            {/* 워드마크: 약칭 위, 풀네임 아래 */}
            <div className="ibms-login-wordmark">
              <span className="ibms-login-wordmark-abbr">{_brand}</span>
              <span className="ibms-login-wordmark-full">{_brandFull}</span>
            </div>
            <h1 className="ibms-login-tagline">
              부서 예산의 기획부터<br />검토·확정까지 한 곳에서.
            </h1>
            {/* 개조식 설명 */}
            <ul className="ibms-login-desc-list">
              <li>부서별 예산 편성 및 항목 관리</li>
              <li>결재 라우팅 및 단계별 검토</li>
              <li>예산 현황 보고서 출력</li>
              <li>변경 이력 조회 및 투명한 운영</li>
            </ul>
          </div>

          <div className="ibms-login-features">
            <div className="ibms-login-feat">
              <div className="ibms-login-feat-icon" style={{ background: 'rgba(219,234,254,0.8)' }}>📋</div>
              <div className="ibms-login-feat-text">
                <span className="ibms-login-feat-label">Planning</span>
                <span className="ibms-login-feat-value">예산 편성</span>
              </div>
            </div>
            <div className="ibms-login-feat">
              <div className="ibms-login-feat-icon" style={{ background: 'rgba(220,252,231,0.8)' }}>✅</div>
              <div className="ibms-login-feat-text">
                <span className="ibms-login-feat-label">Review</span>
                <span className="ibms-login-feat-value">검토·확정</span>
              </div>
            </div>
            <div className="ibms-login-feat">
              <div className="ibms-login-feat-icon" style={{ background: 'rgba(254,249,195,0.8)' }}>📊</div>
              <div className="ibms-login-feat-text">
                <span className="ibms-login-feat-label">Report</span>
                <span className="ibms-login-feat-value">보고서 출력</span>
              </div>
            </div>
            <div className="ibms-login-feat">
              <div className="ibms-login-feat-icon" style={{ background: 'rgba(243,232,255,0.8)' }}>🔍</div>
              <div className="ibms-login-feat-text">
                <span className="ibms-login-feat-label">History</span>
                <span className="ibms-login-feat-value">변경 이력</span>
              </div>
            </div>
          </div>

        </section>

        {/* 오른쪽 로그인 폼 */}
        <section className="ibms-login-panel">
          <div className="ibms-login-panel-badge">
            <div className="ibms-login-panel-badge-dot" />
            보안 연결 활성화
          </div>

          <h2 className="ibms-login-panel-title">로그인</h2>
          <p className="ibms-login-panel-desc">
            계정 정보를 입력하고<br />시스템에 접속하세요.
          </p>

          <form className="ibms-login-form" onSubmit={handleSubmit}>
            <div className="ibms-login-field-wrap">
              <label className="ibms-login-label" htmlFor="login-username">아이디</label>
              <div className="ibms-login-field">
                <User size={15} color="#94a3b8" strokeWidth={2} />
                <input
                  id="login-username"
                  name="username"
                  autoComplete="username"
                  className="ibms-login-input"
                  value={u}
                  onChange={(e) => setU(e.target.value)}
                  placeholder="아이디를 입력하세요"
                />
              </div>
            </div>

            <div className="ibms-login-field-wrap">
              <label className="ibms-login-label" htmlFor="login-password">비밀번호</label>
              <div className="ibms-login-field">
                <Lock size={15} color="#94a3b8" strokeWidth={2} />
                <input
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  className="ibms-login-input"
                  type="password"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>

            <button type="submit" className="ibms-login-submit" disabled={isSubmitting}>
              {isSubmitting ? '접속 중...' : '시스템 접속'}
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </form>

          <div className="ibms-login-footer-note">
            <ShieldCheck size={12} color="#10b981" strokeWidth={2} />
            {_orgKo} 내부 시스템 — 인가된 사용자만 접근할 수 있습니다.
          </div>
        </section>
      </div>

      {/* 하단 카피라이트 */}
      <p className="ibms-login-copyright">
        © {new Date().getFullYear()} {_orgKo} ({_orgEn}) · {_brand} v{_version}
      </p>
    </div>
  );
}

export function LoadingScreen() {
  return <div style={lFull}><div style={lSp} /></div>;
}

export function SystemModal({ modal }) {
  if (!modal) return null;

  const lines = typeof modal.message === 'string'
    ? modal.message.split('\n').filter((line) => line !== undefined)
    : null;

  const isNumberedItem = (line) => /^\d+\./.test(line.trim()) || /^\.\.\./.test(line.trim());
  const hasNumberedList = lines && lines.some(isNumberedItem);

  const renderMessage = () => {
    if (!lines) return <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{modal.message}</p>;

    if (!hasNumberedList) {
      const nonEmpty = lines.filter(l => l.trim() !== '');
      const [primary, ...rest] = nonEmpty;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {primary && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.5 }}>
              {primary}
            </p>
          )}
          {rest.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rest.map((line, i) => (
                line.trim() === ''
                  ? <div key={i} style={{ height: 4 }} />
                  : <p key={i} style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{line}</p>
              ))}
            </div>
          )}
        </div>
      );
    }

    const headerLines = [];
    const listItems = [];
    let inList = false;
    for (const line of lines) {
      if (line.trim() === '') continue;
      if (isNumberedItem(line)) {
        inList = true;
        listItems.push(line.trim());
      } else if (!inList) {
        headerLines.push(line.trim());
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {headerLines.length > 0 && (
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            {headerLines.join(' ')}
          </div>
        )}
        <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {listItems.map((item, i) => {
            const isMeta = /^\.\.\./.test(item);
            const rest = item.replace(/^\d+\.\s*/, '');
            const parts = rest.split(' | ');
            if (isMeta) {
              return (
                <div key={i} style={{ fontSize: 12, color: '#94a3b8', paddingLeft: 8, paddingTop: 4 }}>{item}</div>
              );
            }
            return (
              <div key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, minWidth: 18 }}>{i + 1}</span>
                  {parts[0] && <span style={{ fontSize: 12, color: '#64748b' }}>{parts[0]}</span>}
                  {parts[1] && <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{parts[1]}</span>}
                  {parts[2] && (
                    <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '1px 7px', borderRadius: 999 }}>
                      {parts[2]}
                    </span>
                  )}
                </div>
                {parts[3] && (
                  <div style={{ fontSize: 12, color: '#ef4444', paddingLeft: 26 }}>{parts[3]}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return createPortal(
    <div style={mOv}>
      <div style={mCd}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{modal.title}</h4>
        {renderMessage()}
        <div style={mBs}>
          {modal.type === 'confirm' && <button style={btnG} onClick={modal.onCancel}>취소</button>}
          <button style={btnP} onClick={modal.type === 'alert' ? modal.onClose : modal.onConfirm}>확인</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
