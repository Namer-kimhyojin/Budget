
import React, { useState } from 'react';
import { menuStyles } from '../styles';

export function PresetCard({ presets = [], onSave, onLoad, onDelete }) {
    const [presetName, setPresetName] = useState('');
    const [showInput, setShowInput] = useState(false);
    const handleSave = () => {
        if (!presetName.trim()) return;
        onSave?.(presetName.trim());
        setPresetName('');
        setShowInput(false);
    };

    return (
        <div style={menuStyles.presetCardContainer}>
            <div style={menuStyles.presetCardHead}>저장된 프리셋</div>
            <div style={menuStyles.presetCardBody}>
                {presets.length === 0 ? (
                    <div style={menuStyles.presetEmpty}>저장된 프리셋이 없습니다.</div>
                ) : (
                    <div style={menuStyles.presetList}>
                        {presets.map((preset, idx) => (
                            <div key={idx} style={menuStyles.presetItem}>
                                <div style={menuStyles.presetItemName}>{preset.name}</div>
                                <div style={menuStyles.presetItemActions}>
                                    <button style={menuStyles.presetActionBtn} onClick={() => onLoad?.(preset)}>로드</button>
                                    <button style={{ ...menuStyles.presetActionBtn, color: '#dc2626' }} onClick={() => onDelete?.(preset.id)}>삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div style={menuStyles.presetInputRow}>
                    {showInput ? (
                        <>
                            <input style={menuStyles.presetInput} placeholder="새 프리셋 이름" value={presetName} onChange={e => setPresetName(e.target.value)} />
                            <button style={menuStyles.presetSaveBtn} onClick={handleSave}>저장</button>
                            <button style={menuStyles.presetCancelBtn} onClick={() => setShowInput(false)}>취소</button>
                        </>
                    ) : (
                        <button style={menuStyles.presetNewBtn} onClick={() => setShowInput(true)}>+ 현재 설정 저장</button>
                    )}
                </div>
            </div>
        </div>
    );
}
