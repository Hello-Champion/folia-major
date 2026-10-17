// src/components/modal/settings/GlassAdjustSection.tsx
// 玻璃调节块（底部控制台 / 全局两处共用）：磨砂、透明度、高亮、色彩饱和、描边强度五个参数
// 用 Tab 切换，一次只显示一个滑块，避免占空间。数值与 store 的玻璃参数直接绑定。
// 用设置页自己的 kit 控件（Tabs / Slider / Button），与 settings/pages 的其余行保持一致。

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { Button, Slider, Tabs } from './kit';

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
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<GlassAdjustTab>('opacity');

    const tabs: { id: GlassAdjustTab; label: string }[] = [
        { id: 'blur', label: t('options.glassAdjustBlur') },
        { id: 'opacity', label: t('options.glassAdjustOpacity') },
        { id: 'brightness', label: t('options.glassAdjustBrightness') },
        { id: 'saturate', label: t('options.glassAdjustSaturate') },
        { id: 'glow', label: t('options.glassAdjustGlow') },
    ];

    const renderSlider = () => {
        if (activeTab === 'blur') {
            return (
                <Slider value={blur} min={BLUR_MIN} max={BLUR_MAX} step={1} onChange={onBlurChange} format={v => `${v}px`} stacked />
            );
        }
        if (activeTab === 'opacity') {
            return (
                <Slider value={opacity} min={OPACITY_MIN} max={OPACITY_MAX} step={1} onChange={onOpacityChange} format={v => `${v}%`} stacked />
            );
        }
        if (activeTab === 'brightness') {
            return (
                <Slider value={brightness} min={BRIGHTNESS_MIN} max={BRIGHTNESS_MAX} step={0.02} onChange={onBrightnessChange} format={v => `${v.toFixed(2)}×`} stacked />
            );
        }
        if (activeTab === 'saturate') {
            return (
                <Slider value={saturate} min={SATURATE_MIN} max={SATURATE_MAX} step={0.02} onChange={onSaturateChange} format={v => `${v.toFixed(2)}×`} stacked />
            );
        }
        return (
            <Slider value={glow} min={GLOW_MIN} max={GLOW_MAX} step={0.01} onChange={onGlowChange} format={v => v.toFixed(2)} stacked />
        );
    };

    return (
        <div className="px-4 pb-3 pt-2">
            <Tabs
                tabs={tabs}
                activeId={activeTab}
                onSelect={id => setActiveTab(id as GlassAdjustTab)}
                label={t('options.glassAdjust')}
                action={(
                    <Button icon={RotateCcw} tip={t('options.glassAdjustReset')} onClick={onReset} />
                )}
            />
            <div className="mt-3">{renderSlider()}</div>
        </div>
    );
};

export default GlassAdjustSection;
