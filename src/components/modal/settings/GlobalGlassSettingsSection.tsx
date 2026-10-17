// src/components/modal/settings/GlobalGlassSettingsSection.tsx
// 全局玻璃调节区：独立于底部控制台的开关 + 磨砂/透明度/高亮/饱和/描边滑杆（Tab 切换）。
// 作用于除底部控制条外的玻璃控件：搜索页、弹窗、toast、设置窗口、壁纸墙按钮、bravais 菜单等。
// 挂在设置「通用」页的语言设置下面，用设置页自己的 kit 控件（Row / Toggle）。

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerChromeSettingsStore } from '../../../stores/usePlayerChromeSettingsStore';
import GlassAdjustSection from './GlassAdjustSection';
import { Row, Toggle } from './kit';

const GlobalGlassSettingsSection: React.FC = () => {
    const { t } = useTranslation();
    const {
        globalGlassEnabled,
        handleToggleGlobalGlass,
        globalGlassBlur,
        globalGlassOpacity,
        globalGlassBrightness,
        globalGlassSaturate,
        globalGlassGlow,
        handleSetGlobalGlassBlur,
        handleSetGlobalGlassOpacity,
        handleSetGlobalGlassBrightness,
        handleSetGlobalGlassSaturate,
        handleSetGlobalGlassGlow,
        handleResetGlobalGlass,
    } = usePlayerChromeSettingsStore(useShallow(state => ({
        globalGlassEnabled: state.globalGlassEnabled,
        handleToggleGlobalGlass: state.handleToggleGlobalGlass,
        globalGlassBlur: state.globalGlassBlur,
        globalGlassOpacity: state.globalGlassOpacity,
        globalGlassBrightness: state.globalGlassBrightness,
        globalGlassSaturate: state.globalGlassSaturate,
        globalGlassGlow: state.globalGlassGlow,
        handleSetGlobalGlassBlur: state.handleSetGlobalGlassBlur,
        handleSetGlobalGlassOpacity: state.handleSetGlobalGlassOpacity,
        handleSetGlobalGlassBrightness: state.handleSetGlobalGlassBrightness,
        handleSetGlobalGlassSaturate: state.handleSetGlobalGlassSaturate,
        handleSetGlobalGlassGlow: state.handleSetGlobalGlassGlow,
        handleResetGlobalGlass: state.handleResetGlobalGlass,
    })));

    return (
        <>
            <Row label={t('options.globalGlass')} hint={t('options.globalGlassDesc')}>
                <Toggle checked={globalGlassEnabled} onChange={handleToggleGlobalGlass} />
            </Row>
            {globalGlassEnabled && (
                <GlassAdjustSection
                    blur={globalGlassBlur}
                    opacity={globalGlassOpacity}
                    brightness={globalGlassBrightness}
                    saturate={globalGlassSaturate}
                    glow={globalGlassGlow}
                    onBlurChange={handleSetGlobalGlassBlur}
                    onOpacityChange={handleSetGlobalGlassOpacity}
                    onBrightnessChange={handleSetGlobalGlassBrightness}
                    onSaturateChange={handleSetGlobalGlassSaturate}
                    onGlowChange={handleSetGlobalGlassGlow}
                    onReset={handleResetGlobalGlass}
                />
            )}
        </>
    );
};

export default GlobalGlassSettingsSection;
