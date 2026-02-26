
import React from 'react';

export function SkeletonLoader({ lines = 3, height = '12px' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: lines }).map((_, idx) => (
                <div
                    key={idx}
                    style={{
                        height,
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite',
                        borderRadius: '4px',
                    }}
                />
            ))}
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
    );
}
