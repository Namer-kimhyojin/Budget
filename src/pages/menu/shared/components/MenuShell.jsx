
import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { MENU_LAYOUT_BLUEPRINTS, ROLE_LABELS, APP_MENU_META } from '../../config';
import { menuStyles } from '../styles';

export function MenuShell({ menuId, user, stats = [], actions = [], children, breadcrumbs = [], contextBadge, hideHero = false }) {
    const blueprint = MENU_LAYOUT_BLUEPRINTS[menuId] || {};
    const currentMenu = APP_MENU_META.find(m => m.id === menuId) || {};

    const path = breadcrumbs.length > 0 ? breadcrumbs : [currentMenu.label || blueprint.title || menuId];

    return (
        <div style={menuStyles.menuBaseWrap}>
            <div style={menuStyles.breadcrumbWrap}>
                <div style={menuStyles.breadcrumbLeft}>
                    <Home
                        size={14}
                        style={{ color: '#94a3b8', cursor: 'pointer' }}
                        onClick={() => window.location.pathname = '/dashboard'}
                    />
                    {path.map((p, idx) => {
                        const isLast = idx === path.length - 1;
                        const label = typeof p === 'string' ? p : p.label;
                        const onClick = typeof p === 'object' ? p.onClick : null;

                        return (
                            <React.Fragment key={idx}>
                                <ChevronRight size={12} style={{ color: '#cbd5e1' }} />
                                <span
                                    onClick={onClick}
                                    style={{
                                        color: isLast ? '#1e293b' : '#64748b',
                                        fontWeight: isLast ? 700 : 500,
                                        cursor: onClick ? 'pointer' : 'default',
                                        textDecoration: onClick && !isLast ? 'underline' : 'none'
                                    }}
                                >
                                    {label}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
                {contextBadge && (
                    <div style={menuStyles.breadcrumbBadge}>
                        {contextBadge}
                    </div>
                )}
            </div>

            {!hideHero && (
                <section style={menuStyles.menuHeroCard}>
                    <div style={menuStyles.menuHeroTop}>
                        <div style={menuStyles.menuHeroTitleBlock}>
                            <h2 style={menuStyles.menuHeroTitle}>{blueprint.title || menuId}</h2>
                            <p style={menuStyles.menuHeroDesc}>{blueprint.description || ''}</p>
                        </div>
                        <div style={menuStyles.menuHeroTag}>{ROLE_LABELS[user?.role] || user?.role || '권한미정'}</div>
                    </div>
                    {actions.length > 0 && (
                        <div style={menuStyles.menuHeroActionRow}>
                            {actions.map(action => (
                                <button
                                    key={action.label}
                                    style={{ ...menuStyles.menuGhostBtn, opacity: action.disabled ? 0.45 : 1, cursor: action.disabled ? 'not-allowed' : 'pointer' }}
                                    type="button"
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {stats.length > 0 && !hideHero && (
                <section style={menuStyles.menuStatGrid}>
                    {stats.map(stat => (
                        <article key={stat.label} style={menuStyles.menuStatCard}>
                            <div style={menuStyles.menuStatLabel}>{stat.label}</div>
                            <div style={menuStyles.menuStatValue}>{stat.value}</div>
                        </article>
                    ))}
                </section>
            )}

            {children}
        </div>
    );
}
