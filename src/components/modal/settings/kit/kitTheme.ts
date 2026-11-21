import { createContext, useContext, type CSSProperties } from 'react';
import type { Theme } from '../../../../types';
import { usePlayerChromeSettingsStore } from '../../../../stores/usePlayerChromeSettingsStore';
import { getContrastRatio } from '../../../../utils/themeColorMath';
import './kit.css';

// src/components/modal/settings/kit/kitTheme.ts
// The colours of the settings window. The window sets them once as CSS variables and every kit part
// reads them from there, so no part takes an isDaylight prop. Text and fills follow the app's
// --text-primary, the way the rest of the settings code colours itself; only the surfaces are fixed
// per light and dark.

const ON_ACCENT_DARK = '#17171a';
const ON_ACCENT_LIGHT = '#ffffff';

/** The colour of text and marks drawn on the accent: whichever of dark and white reads better on it. */
export const onAccentColor = (accent: string): string => (
    getContrastRatio(ON_ACCENT_DARK, accent) >= getContrastRatio(ON_ACCENT_LIGHT, accent) ? ON_ACCENT_DARK : ON_ACCENT_LIGHT
);

/** Stand-in album covers, for a picture or a preview a page draws. */
export const SAMPLE_COVERS = ['#6d5a8c', '#3f6f7a', '#a8664b', '#56745a', '#8a4f5d', '#4d5f8f', '#8c7a45', '#5d5d66'] as const;

/**
 * 全局玻璃开着时，把 kit 的实色表面按设置里的不透明度混成半透明。内联自定义属性优先于样式表，
 * 所以这一步只能在写令牌的时候算，CSS 覆盖不了。
 */
const glassSurface = (color: string): string => {
    const store = usePlayerChromeSettingsStore.getState();
    if (!store.globalGlassEnabled) return color;
    const percent = Math.max(0, Math.min(100, store.globalGlassOpacity));
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
};

/** The variables, for the `style` of the settings window. */
export const settingsTokens = (isDaylight: boolean, theme?: Theme): CSSProperties => {
    const accent = theme?.accentColor || (isDaylight ? '#18181b' : '#f4f4f5');
    const winColor = isDaylight ? '#f3f3f4' : '#1a1a1d';
    const sideColor = isDaylight ? '#e9e9eb' : '#141416';
    const cardColor = isDaylight ? '#ffffff' : '#232327';
    const menuColor = isDaylight ? '#ffffff' : '#2b2b30';
    const raiseColor = isDaylight ? '#ffffff' : '#45454c';
    const previewColor = isDaylight ? '#ececef' : '#151517';
    return {
        '--st-win-base': winColor,
        '--st-win': glassSurface(winColor),
        '--st-side-base': sideColor,
        '--st-side': glassSurface(sideColor),
        '--st-card-base': cardColor,
        '--st-card': glassSurface(cardColor),
        '--st-menu-base': menuColor,
        '--st-menu': glassSurface(menuColor),
        '--st-raise-base': raiseColor,
        '--st-raise': glassSurface(raiseColor),
        '--st-knob': isDaylight ? '#ffffff' : '#ececee',
        '--st-pv-base': previewColor,
        '--st-pv': glassSurface(previewColor),
        '--st-ok': isDaylight ? '#1e9a5c' : '#56c98d',
        '--st-warn': isDaylight ? '#b97a10' : '#e3a949',
        '--st-err': isDaylight ? '#d04444' : '#ef6f6f',
        '--st-t1': 'var(--text-primary)',
        '--st-t2': 'color-mix(in srgb, var(--text-primary) 62%, transparent)',
        '--st-t3': 'color-mix(in srgb, var(--text-primary) 42%, transparent)',
        '--st-line': 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
        '--st-line2': 'color-mix(in srgb, var(--text-primary) 16%, transparent)',
        '--st-fill': 'color-mix(in srgb, var(--text-primary) 7%, transparent)',
        '--st-fill2': 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
        '--st-track': 'color-mix(in srgb, var(--text-primary) 17%, transparent)',
        '--st-accent': accent,
        '--st-on-accent': onAccentColor(accent),
    } as CSSProperties;
};

/** What a part needs when it draws outside the window, where the variables do not reach. */
export type SettingsKitTheme = {
    isDaylight: boolean;
    theme?: Theme;
};

export const SettingsKitThemeContext = createContext<SettingsKitTheme>({ isDaylight: false });

export const useSettingsKitTheme = (): SettingsKitTheme => useContext(SettingsKitThemeContext);
