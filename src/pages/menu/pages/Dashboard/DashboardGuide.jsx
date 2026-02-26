
import React from 'react';
import { BarChart3 } from 'lucide-react';
import { menuStyles, QuickActionCard } from '../../shared/menuUi';

const { menuPanelCard, menuPanelHead, menuPanelBody } = menuStyles;

export default function DashboardGuide({ statusCounts, user, onNavigate }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
            <section style={menuPanelCard}>
                <div style={menuPanelHead}><BarChart3 size={18} /> 예산서 가이드</div>
                <div style={menuPanelBody}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                            현재 진행 중인 예산서를 확인하고, 부서별 진행 상황을 실시간으로 관리할 수 있습니다.<br />
                            오른쪽의 <b>예산 목록</b>에서 해당 예산서를 선택해 관리하세요.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>작성 중</div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{statusCounts.DRAFT}</div>
                            </div>
                            <div style={{ flex: 1, padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
                                <div style={{ fontSize: 11, color: '#3b82f6', marginBottom: 4 }}>제출/검토</div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{statusCounts.PENDING + statusCounts.REVIEWING}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <QuickActionCard
                title="부서별 주요 업무"
                items={[
                    (user?.role === 'STAFF' || user?.role === 'REQUESTOR' || user?.role === 'ADMIN') && { label: `본인 부서 예산 작성완료`, count: `${statusCounts.DRAFT}`, action: 'planning' },
                    (user?.role === 'MANAGER' || user?.role === 'REVIEWER' || user?.role === 'ADMIN') && { label: `전체 부서 예산 검토`, count: `${statusCounts.PENDING}`, action: 'hqReview' },
                    (user?.role === 'ADMIN') && { label: `예산 확정 처리`, count: `${statusCounts.REVIEWING}`, action: 'hqReview' },
                ].filter(Boolean)}
                onItemClick={(action) => onNavigate?.(action)}
            />
        </div>
    );
}
