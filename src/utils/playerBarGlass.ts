// src/utils/playerBarGlass.ts
// 底部控制台同族悬浮控件的玻璃配方（复刻 Mineradio 底部状态栏）：
// blur(12px) saturate(1.8) brightness(1.16) + 白色内发光描边 + 多层柔和投影。
// 开关值统一存在 usePlayerChromeSettingsStore 的 playerBottomBarGlass；本文件只提供样式常量与动态构建。

import type { CSSProperties } from 'react';
import { usePlayerChromeSettingsStore } from '../stores/usePlayerChromeSettingsStore';

/** 玻璃开启时的 backdrop-filter 与 box-shadow；用内联样式覆盖 Tailwind 的 backdrop-blur / shadow-* 类。 */
export const PLAYER_BAR_GLASS_STYLE: CSSProperties = {
    backdropFilter: 'blur(12px) saturate(1.8) brightness(1.16)',
    WebkitBackdropFilter: 'blur(12px) saturate(1.8) brightness(1.16)',
    boxShadow: 'inset 0 0 2px 1px rgba(255,255,255,0.16), inset 0 0 10px 4px rgba(255,255,255,0.15), 0 4px 16px rgba(17,17,26,0.05), 0 8px 24px rgba(17,17,26,0.05), 0 16px 56px rgba(17,17,26,0.05), inset 0 4px 16px rgba(17,17,26,0.05), inset 0 8px 24px rgba(17,17,26,0.05), inset 0 16px 56px rgba(17,17,26,0.05)',
};

/** 玻璃参数：磨砂（blur px）、底色不透明度（0-100）、高亮（brightness 倍率）、色彩饱和（saturate 倍率）、白色内发光描边强度（0-0.5）。 */
export interface GlassStyleParams {
    blurPx: number;
    opacityPercent: number;
    brightness: number;
    saturate: number;
    glow: number;
}

/**
 * 按参数动态构建玻璃样式：磨砂/高亮/饱和进 backdrop-filter，透明度进底色（深色黑、日间白），
 * 白色内发光描边按 glow 强度生成（第二层按原配方比例 0.15/0.16 收敛），深色投影沿用固定配方。
 * 透明度为 0 时不写 backgroundColor，避免透明底色覆盖调用方的兜底类。
 */
export const buildGlassStyle = (params: GlassStyleParams, isDaylight: boolean): CSSProperties => {
    const backdropFilter = `blur(${params.blurPx}px) saturate(${params.saturate}) brightness(${params.brightness})`;
    const style: CSSProperties = {
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
        boxShadow: `inset 0 0 2px 1px rgba(255,255,255,${params.glow}), inset 0 0 10px 4px rgba(255,255,255,${params.glow * 0.94}), 0 4px 16px rgba(17,17,26,0.05), 0 8px 24px rgba(17,17,26,0.05), 0 16px 56px rgba(17,17,26,0.05), inset 0 4px 16px rgba(17,17,26,0.05), inset 0 8px 24px rgba(17,17,26,0.05), inset 0 16px 56px rgba(17,17,26,0.05)`,
    };
    if (params.opacityPercent > 0) {
        style.backgroundColor = isDaylight
            ? `rgba(255, 255, 255, ${params.opacityPercent / 100})`
            : `rgba(0, 0, 0, ${params.opacityPercent / 100})`;
    }
    return style;
};

/** 底部控制条玻璃样式：读取设置中的底部玻璃参数，未开启时返回 undefined。 */
export const useBottomBarGlassStyle = (isDaylight: boolean): CSSProperties | undefined => {
    const enabled = usePlayerChromeSettingsStore(state => state.playerBottomBarGlass);
    const blurPx = usePlayerChromeSettingsStore(state => state.playerBottomBarGlassBlur);
    const opacityPercent = usePlayerChromeSettingsStore(state => state.playerBottomBarGlassOpacity);
    const brightness = usePlayerChromeSettingsStore(state => state.playerBottomBarGlassBrightness);
    const saturate = usePlayerChromeSettingsStore(state => state.playerBottomBarGlassSaturate);
    const glow = usePlayerChromeSettingsStore(state => state.playerBottomBarGlassGlow);
    return enabled ? buildGlassStyle({ blurPx, opacityPercent, brightness, saturate, glow }, isDaylight) : undefined;
};

/** 全局玻璃样式：读取设置中的全局玻璃参数（与底部控制条调节独立），未开启时返回 undefined。 */
export const useGlobalGlassStyle = (isDaylight: boolean): CSSProperties | undefined => {
    const enabled = usePlayerChromeSettingsStore(state => state.globalGlassEnabled);
    const blurPx = usePlayerChromeSettingsStore(state => state.globalGlassBlur);
    const opacityPercent = usePlayerChromeSettingsStore(state => state.globalGlassOpacity);
    const brightness = usePlayerChromeSettingsStore(state => state.globalGlassBrightness);
    const saturate = usePlayerChromeSettingsStore(state => state.globalGlassSaturate);
    const glow = usePlayerChromeSettingsStore(state => state.globalGlassGlow);
    return enabled ? buildGlassStyle({ blurPx, opacityPercent, brightness, saturate, glow }, isDaylight) : undefined;
};
