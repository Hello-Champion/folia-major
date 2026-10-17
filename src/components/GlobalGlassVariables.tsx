// src/components/GlobalGlassVariables.tsx
// 全局玻璃调节的 CSS 变量注入：把设置里的全局玻璃参数（磨砂/透明度/高亮）写到 <html> 根，
// 供 has-glass CSS 类（壁纸墙返回按钮、工具面板、bravais 搜索框/菜单等）消费。
// 内联样式组件（搜索页、弹窗、toast 等）走 useGlobalGlassStyle，不走这里。

import { useEffect } from 'react';
import { usePlayerChromeSettingsStore } from '../stores/usePlayerChromeSettingsStore';

const GlobalGlassVariables: React.FC = () => {
    const enabled = usePlayerChromeSettingsStore(state => state.globalGlassEnabled);
    const blurPx = usePlayerChromeSettingsStore(state => state.globalGlassBlur);
    const opacityPercent = usePlayerChromeSettingsStore(state => state.globalGlassOpacity);
    const brightness = usePlayerChromeSettingsStore(state => state.globalGlassBrightness);
    const saturate = usePlayerChromeSettingsStore(state => state.globalGlassSaturate);
    const glow = usePlayerChromeSettingsStore(state => state.globalGlassGlow);

    useEffect(() => {
        const root = document.documentElement;
        if (enabled) {
            root.style.setProperty('--glass-alpha', String(opacityPercent / 100));
            root.style.setProperty('--glass-backdrop', `blur(${blurPx}px) saturate(${saturate}) brightness(${brightness})`);
            root.style.setProperty('--glass-glow', String(glow));
        } else {
            root.style.removeProperty('--glass-alpha');
            root.style.removeProperty('--glass-backdrop');
            root.style.removeProperty('--glass-glow');
        }
    }, [enabled, blurPx, opacityPercent, brightness, saturate, glow]);

    return null;
};

export default GlobalGlassVariables;
