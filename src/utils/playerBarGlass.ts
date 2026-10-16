// src/utils/playerBarGlass.ts
// 底部控制台同族悬浮控件的玻璃配方（复刻 Mineradio 底部状态栏）：
// blur(12px) saturate(1.8) brightness(1.16) + 白色内发光描边 + 多层柔和投影。
// 开关值统一存在 usePlayerChromeSettingsStore 的 playerBottomBarGlass；本文件只提供样式常量。

import type { CSSProperties } from 'react';

/** 玻璃开启时的 backdrop-filter 与 box-shadow；用内联样式覆盖 Tailwind 的 backdrop-blur / shadow-* 类。 */
export const PLAYER_BAR_GLASS_STYLE: CSSProperties = {
    backdropFilter: 'blur(12px) saturate(1.8) brightness(1.16)',
    WebkitBackdropFilter: 'blur(12px) saturate(1.8) brightness(1.16)',
    boxShadow: 'inset 0 0 2px 1px rgba(255,255,255,0.35), inset 0 0 10px 4px rgba(255,255,255,0.15), 0 4px 16px rgba(17,17,26,0.05), 0 8px 24px rgba(17,17,26,0.05), 0 16px 56px rgba(17,17,26,0.05), inset 0 4px 16px rgba(17,17,26,0.05), inset 0 8px 24px rgba(17,17,26,0.05), inset 0 16px 56px rgba(17,17,26,0.05)',
};
