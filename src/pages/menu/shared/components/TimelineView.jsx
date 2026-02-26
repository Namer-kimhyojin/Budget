
import React from 'react';
import { menuStyles } from '../styles';

export function TimelineView({ items = [], emptyMessage = '이력이 없습니다.' }) {
    if (items.length === 0) return <div style={menuStyles.emptyTimeline}>{emptyMessage}</div>;
    return (
        <div style={menuStyles.timelineContainer}>
            {items.map((item, idx) => (
                <div key={idx} style={menuStyles.timelineItem}>
                    <div style={menuStyles.timelineMarker}>{item.icon || '*'}</div>
                    <div style={menuStyles.timelineContent}>
                        <div style={menuStyles.timelineTime}>{item.timestamp}</div>
                        <div style={menuStyles.timelineTitle}>{item.title}</div>
                        {item.description && <div style={menuStyles.timelineDesc}>{item.description}</div>}
                        {item.actor && <div style={menuStyles.timelineActor}>처리자: {item.actor}</div>}
                        {item.reason && <div style={menuStyles.timelineReason}>사유: {item.reason}</div>}
                    </div>
                </div>
            ))}
        </div>
    );
}
