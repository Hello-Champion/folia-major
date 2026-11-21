const fs = require('fs');
const patch = (p, pairs) => {
    let s = fs.readFileSync(p, 'utf8');
    for (const [from, to] of pairs) {
        if (!s.includes(from)) throw new Error(`anchor missing in ${p}: ${from.slice(0, 60)}`);
        s = s.replace(from, to);
    }
    fs.writeFileSync(p, s);
};

patch('src/components/modal/settings/kit/kitTheme.ts', [
[
    "import type { Theme } from '../../../../types';",
    "import type { Theme } from '../../../../types';\nimport { usePlayerChromeSettingsStore } from '../../../../stores/usePlayerChromeSettingsStore';",
],
[
    "/** The variables, for the `style` of the settings window. */\nexport const settingsTokens = (isDaylight: boolean, theme?: Theme): CSSProperties => {\n    const accent = theme?.accentColor || (isDaylight ? '#18181b' : '#f4f4f5');",
    `/** 全局玻璃开着时，把 kit 的实色表面按设置里的不透明度混成半透明（内联自定义属性优先于样式表，只能在这里算）。 */
const glassSurface = (color: string): string => {
    const store = usePlayerChromeSettingsStore.getState();
    if (!store.globalGlassEnabled) return color;
    const percent = Math.max(0, Math.min(100, store.globalGlassOpacity));
    return \`color-mix(in srgb, \${color} \${percent}%, transparent)\`;
};

/** The variables, for the \`style\` of the settings window. */
export const settingsTokens = (isDaylight: boolean, theme?: Theme): CSSProperties => {
    const accent = theme?.accentColor || (isDaylight ? '#18181b' : '#f4f4f5');
    const win = isDaylight ? '#f3f3f4' : '#1a1a1d';
    const side = isDaylight ? '#e9e9eb' : '#141416';
    const card = isDaylight ? '#ffffff' : '#232327';
    const menu = isDaylight ? '#ffffff' : '#2b2b30';
    const raise = isDaylight ? '#ffffff' : '#45454c';
    const preview = isDaylight ? '#ececef' : '#151517';`,
],
[
    `        // 基础色另存一份：全局玻璃开启时 CSS 拿它混出半透明版本（--st-win 等会被覆盖，不能自引用）。
        '--st-win-base': isDaylight ? '#f3f3f4' : '#1a1a1d',
        '--st-win': isDaylight ? '#f3f3f4' : '#1a1a1d',
        '--st-side-base': isDaylight ? '#e9e9eb' : '#141416',
        '--st-side': isDaylight ? '#e9e9eb' : '#141416',
        '--st-card-base': isDaylight ? '#ffffff' : '#232327',
        '--st-card': isDaylight ? '#ffffff' : '#232327',
        '--st-menu-base': isDaylight ? '#ffffff' : '#2b2b30',
        '--st-menu': isDaylight ? '#ffffff' : '#2b2b30',
        '--st-raise-base': isDaylight ? '#ffffff' : '#45454c',
        '--st-raise': isDaylight ? '#ffffff' : '#45454c',
        '--st-pv-base': isDaylight ? '#ececef' : '#151517',
        '--st-pv': isDaylight ? '#ececef' : '#151517',`,
    `        '--st-win-base': win,
        '--st-win': glassSurface(win),
        '--st-side-base': side,
        '--st-side': glassSurface(side),
        '--st-card-base': card,
        '--st-card': glassSurface(card),
        '--st-menu-base': menu,
        '--st-menu': glassSurface(menu),
        '--st-raise-base': raise,
        '--st-raise': glassSurface(raise),
        '--st-pv-base': preview,
        '--st-pv': glassSurface(preview),`,
],
]);
console.log('kit tokens glassified');
