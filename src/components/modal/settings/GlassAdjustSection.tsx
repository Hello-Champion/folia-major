// src/components/modal/settings/GlassAdjustSection.tsx
// 玻璃调节块（底部控制台 / 全局两处共用）：磨砂、透明度、高亮、色彩饱和四个参数用 Tab 切换，
// 一次只显示一个滑块，避免占空间。数值与 store 的玻璃参数直接绑定。

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';

export type GlassAdjustTab = 'blur' | 'opacity' | 'brightness' | 'saturate' | 'glow';

type GlassAdjustSectionProps = {
    blur: number;
    opacity: number;
    brightness: number;
    saturate: number;
    glow: number;
    onBlurChange: (blurPx: number) => void;
    onOpacityChange: (opacityPercent: number) => void;
    onBrightnessChange: (brightness: number) => void;
    onSaturateChange: (saturate: number) => void;
    onGlowChange: (glow: number) => void;
    /** 一键恢复默认配方（12px / 10% / 1.16 / 1.8 / 0.16）。 */
    onReset: () => void;
    rangeInputClass: string;
    isDaylight: boolean;
};

const BLUR_MIN = 0;
const BLUR_MAX = 48;
const OPACITY_MIN = 0;
const OPACITY_MAX = 100;
const BRIGHTNESS_MIN = 0.3;
const BRIGHTNESS_MAX = 2.5;
const SATURATE_MIN = 0.5;
const SATURATE_MAX = 3;
const GLOW_MIN = 0;
const GLOW_MAX = 0.5;

const GlassAdjustSection: React.FC<GlassAdjustSectionProps> = ({
    blur,
    opacity,
    brightness,
    saturate,
    glow,
    onBlurChange,
    onOpacityChange,
    onBrightnessChange,
    onSaturateChange,
    onGlowChange,
    onReset,
    rangeInputClass,
    isDaylight,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<GlassAdjustTab>('opacity');

    const tabs: { value: GlassAdjustTab; label: string }[] = [
        { value: 'blur', label: t('options.glassAdjustBlur') },
        { value: 'opacity', label: t('options.glassAdjustOpacity') },
        { value: 'brightness', label: t('options.glassAdjustBrightness') },
        { value: 'saturate', label: t('options.glassAdjustSaturate') },
        { value: 'glow', label: t('options.glassAdjustGlow') },
    ];

    const valueLabel = activeTab === 'blur'
        ? `${blur}px`
        : activeTab === 'opacity'
            ? `${opacity}%`
            : activeTab === 'brightness'
                ? `${brightness.toFixed(2)}×`
                : activeTab === 'saturate'
                    ? `${saturate.toFixed(2)}×`
                    : `${glow.toFixed(2)}`;

    const renderSlider = () => {
        if (activeTab === 'blur') {
            return (
                <input
                    type="range"
                    min={BLUR_MIN}
                    max={BLUR_MAX}
                    step={1}
                    value={blur}
                    onChange={e => onBlurChange(Number(e.target.value))}
                    className={rangeInputClass}
                />
            );
        }
        if (activeTab === 'opacity') {
            return (
                <input
                    type="range"
                    min={OPACITY_MIN}
                    max={OPACITY_MAX}
                    step={1}
                    value={opacity}
                    onChange={e => onOpacityChange(Number(e.target.value))}
                    className={rangeInputClass}
                />
            );
        }
        if (activeTab === 'brightness') {
            return (
                <input
                    type="range"
                    min={BRIGHTNESS_MIN}
                    max={BRIGHTNESS_MAX}
                    step={0.02}
                    value={brightness}
                    onChange={e => onBrightnessChange(Number(e.target.value))}
                    className={rangeInputClass}
                />
            );
        }
        if (activeTab === 'saturate') {
            return (
                <input
                    type="range"
                    min={SATURATE_MIN}
                    max={SATURATE_MAX}
                    step={0.02}
                    value={saturate}
                    onChange={e => onSaturateChange(Number(e.target.value))}
                    className={rangeInputClass}
                />
            );
        }
        return (
            <input
                type="range"
                min={GLOW_MIN}
                max={GLOW_MAX}
                step={0.01}
                value={glow}
                onChange={e => onGlowChange(Number(e.target.value))}
                className={rangeInputClass}
            />
        );
    };

    return (
        <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--text-secondary, rgba(0,0,0,0.1))' }}>
            <div
                className="flex shrink-0 rounded-full p-0.5 gap-0.5"
                style={{ backgroundColor: isDaylight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
            >
                {tabs.map(tab => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => setActiveTab(tab.value)}
                        aria-pressed={activeTab === tab.value}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${
                            activeTab === tab.value
                                ? (isDaylight ? 'bg-zinc-800 text-white' : 'bg-white text-black')
                                : 'opacity-60 hover:opacity-100'
                        }`}
                        style={activeTab === tab.value ? undefined : { color: 'var(--text-primary)' }}
                    >
                        {tab.label}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={onReset}
                    className="ml-1 shrink-0 rounded-full px-2 py-1 text-xs opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
                    style={{ color: 'var(--text-secondary)' }}
                    title={t('options.glassAdjustReset')}
                    aria-label={t('options.glassAdjustReset')}
                >
                    <RotateCcw size={12} />
                    <span className="hidden md:inline">{t('options.glassAdjustReset')}</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                {renderSlider()}
                <span className="w-14 text-right font-mono text-xs opacity-60 shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {valueLabel}
                </span>
            </div>
        </div>
    );
};

export default GlassAdjustSection;
