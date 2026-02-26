
import React, { useState } from 'react';
import { menuStyles } from '../styles';

export function FormWizard({ steps = [], onComplete, currentStep: initialStep = 0, title = '' }) {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [formData, setFormData] = useState({});
    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    return (
        <div style={menuStyles.wizardContainer}>
            {title && <h3 style={menuStyles.wizardTitle}>{title}</h3>}
            <div style={menuStyles.wizardProgress}>
                {steps.map((s, idx) => (
                    <div key={idx} style={{ ...menuStyles.wizardStep, background: idx <= currentStep ? '#3b82f6' : '#e2e8f0', color: idx <= currentStep ? '#fff' : '#64748b' }}>
                        {idx + 1}
                    </div>
                ))}
            </div>
            <div style={menuStyles.wizardContent}>
                <div style={menuStyles.wizardStepLabel}>{step?.label}</div>
                {step?.content && typeof step.content === 'function' ? step.content(formData, setFormData) : step?.content}
            </div>
            <div style={menuStyles.wizardFooter}>
                <button style={menuStyles.wizardBtn} onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={isFirst}>이전</button>
                {isLast ? (
                    <button style={{ ...menuStyles.wizardBtn, background: '#10b981', color: '#fff' }} onClick={() => onComplete?.(formData)}>{steps[currentStep]?.completeLabel || '완료'}</button>
                ) : (
                    <button style={{ ...menuStyles.wizardBtn, background: '#3b82f6', color: '#fff' }} onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))}>다음</button>
                )}
            </div>
        </div>
    );
}
