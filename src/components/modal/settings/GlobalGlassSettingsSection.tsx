// src/components/modal/settings/GlobalGlassSettingsSection.tsx
// 全局玻璃调节区：独立于底部控制台的开关 + 磨砂/透明度/高亮滑杆（Tab 切换）。
// 作用于除底部控制条外的玻璃控件：搜索页、弹窗、toast、设置窗口、壁纸墙按钮、bravais 菜单等。

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerChromeSettingsStore } from '../../../stores/usePlayerChromeSettingsStore';
import GlassAdjustSection from './GlassAdjustSection';

type GlobalGlassSettingsSectionProps = {
    settingsCardClass: string;
    rangeInputClass: string;
    isDaylight: boolean;
    theme?: { secondaryColor?: string };
};

const GlobalGlassSettingsSection: React.FC<GlobalGlassSettingsSectionProps> = ({
    settingsCardClass,
    rangeInputClass,
    isDaylight,
    theme,
}) => {
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
    const toggleOffBackgroundClass = isDaylight ? 'bg-zinc-200' : 'bg-[#2A2D35]';

    return (
        <div className={`p-4 rounded-xl border space-y-3 ${settingsCardClass}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {t('options.globalGlass')}
                    </div>
                    <div className="text-xs opacity-50 max-w-[420px]" style={{ color: 'var(--text-secondary)' }}>
                        {t('options.globalGlassDesc')}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => handleToggleGlobalGlass(!globalGlassEnabled)}
                    aria-pressed={globalGlassEnabled}
                    aria-label={t('options.globalGlass')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!globalGlassEnabled ? toggleOffBackgroundClass : ''}`}
                    style={{ backgroundColor: globalGlassEnabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${globalGlassEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

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
                    rangeInputClass={rangeInputClass}
                    isDaylight={isDaylight}
                />
            )}
        </div>
    );
};

export default GlobalGlassSettingsSection;
