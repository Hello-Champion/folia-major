const fs = require('fs');
const patch = (p, pairs) => {
    let s = fs.readFileSync(p, 'utf8');
    for (const [from, to] of pairs) {
        if (!s.includes(from)) throw new Error(`anchor missing in ${p}: ${from.slice(0, 60)}`);
        s = s.replace(from, to);
    }
    fs.writeFileSync(p, s);
};

// 'hidden' is "no action", not an action that can be placed or swapped.
patch('src/types/playerControlSlots.ts', [
[
`): PlayerControlLayout | null => {
    const from = locatePlayerControl(layout, id);`,
`): PlayerControlLayout | null => {
    // 「隐藏」不是一个可摆放的控件：放进槽位就是把那一侧清空，另一边与浮岛都不动。
    if (id === 'hidden') {
        return placement.kind === 'slot' ? { ...layout, [placement.slot]: 'hidden' } : null;
    }
    const from = locatePlayerControl(layout, id);`,
],
[
`        if (!isPlayerControlSlotActionId(entry) || seen.has(entry)) continue;`,
`        // 浮岛里不该出现「隐藏」：它不是控件。
        if (entry === 'hidden' || !isPlayerControlSlotActionId(entry) || seen.has(entry)) continue;`,
],
]);

patch('src/stores/usePlayerChromeSettingsStore.ts', [
[
`            if (!isPlayerControlSlotActionId(layout.primary) || !isPlayerControlSlotActionId(layout.secondary)
            || layout.primary === layout.secondary) {
            return;
        }`,
`            if (!isPlayerControlSlotActionId(layout.primary) || !isPlayerControlSlotActionId(layout.secondary)
            // 两侧都选「隐藏」是合法的：相等只在两个真实动作时才算冲突。
            || (layout.primary === layout.secondary && layout.primary !== 'hidden')) {
            return;
        }`,
],
]);
console.log('hidden placement fixed');
