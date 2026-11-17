import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '../modal/settings/kit';

// src/components/wall/WallToolsRows.tsx
// 墙面工具面板（WallToolsButton）里的各种行：条目（动作 / 开关 / 滑条 / 分组小标题）与顶部那排纯图标快捷格。
// 从 WallToolsButton.tsx 拆出来；面板的外壳、开合与 dock 认领仍在 WallToolsButton。

/** 面板里的一行：动作（点了默认收起面板）或开关（menuitemcheckbox，点了不收起）。 */
export type WallToolsEntry =
    | {
        kind: 'action';
        id: string;
        icon: LucideIcon;
        label: string;
        /** 右侧的按键提示（`: + C` 这类）。 */
        kbd?: string;
        /** 按键提示不进可访问名。 */
        kbdHidden?: boolean;
        /** 右侧的当前值（不是按键，不画框）。 */
        value?: string;
        disabled?: boolean;
        /** 悬停时的提示（与播放页面板里的提示同一个样式）；置灰时用它写原因。 */
        hint?: string;
        /** 点了不收起面板（循环切换一类的条目，让人看到新值）。 */
        keepOpen?: boolean;
        onSelect: () => void;
    }
    | {
        kind: 'toggle';
        id: string;
        icon: LucideIcon;
        label: string;
        checked: boolean;
        onToggle: (next: boolean) => void;
    }
    | {
        /** 一条 0–1 的滑条（音量一类）：拖动时 onPreview，松手 / 失焦时 onCommit；方向键、PageUp/Down、Home/End 直接 onCommit。 */
        kind: 'slider';
        id: string;
        /** 滑条的可访问名（也是这一组的名字）。 */
        label: string;
        value: number;
        /** 左侧图标。 */
        icon: LucideIcon;
        /** 按此刻显示的值换图标（音量：静音 / 小 / 大）；不给就一直是 icon。 */
        iconFor?: (value: number) => LucideIcon;
        /** 点左侧图标做的事（音量的静音切换）；不给时图标只是装饰。 */
        iconAction?: { label: string; pressed: boolean; onPress: () => void };
        /** 方向键一步（缺省 0.05）；PageUp / PageDown 是它的两倍。 */
        keyStep?: number;
        /** 右侧数值与 aria-valuetext。 */
        formatValue: (value: number) => string;
        onPreview?: (value: number) => void;
        onCommit: (value: number) => void;
    }
    | {
        /** 分组的小标题（之后的几行属于它）；只是视觉分组，读屏读作带名字的分隔线。 */
        kind: 'heading';
        id: string;
        label: string;
    };

/**
 * 面板顶部一排的纯图标快捷格：格子里只有图标，名字是可访问名，名字 · 状态 · 按键提示进 tooltip（title），
 * 状态另进 aria-description；点了默认收起面板。
 */
export type WallToolsQuickAction = {
    id: string;
    icon: LucideIcon;
    /** 全名：可访问名与 tooltip。 */
    label: string;
    /** tooltip 里的按键提示（`: + C`、`Ctrl + B`），不进可访问名。 */
    kbd?: string;
    disabled?: boolean;
    /** 此刻的状态（「正在生成主题…」、不可用的原因）：进 tooltip 与 aria-description。`busy` 时图标轻轻呼吸，按钮挂 aria-busy。 */
    status?: string;
    busy?: boolean;
    /** 点了不收起面板（让人看到状态变化：洗牌、生成主题、队列）。 */
    keepOpen?: boolean;
    /** 这一格开合着别的东西（队列浮岛）时给：aria-expanded 与 aria-controls。 */
    expanded?: boolean;
    controls?: string;
    onSelect: () => void;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** 取到百分之一，免得 0.1 + 0.05 一类的浮点尾巴进了存储。 */
const roundPercent = (value: number) => Math.round(value * 100) / 100;

/** 滑条一行（kind: 'slider'）。拖动中的值留在本地（只预览），松手 / 失焦才提交，免得每一帧都写偏好、重渲染应用。 */
function WallToolsSliderRow({ entry }: { entry: Extract<WallToolsEntry, { kind: 'slider' }> }) {
    const [draft, setDraft] = useState<number | null>(null);
    const draftRef = useRef<number | null>(null);
    const shown = draft ?? entry.value;
    const Icon = entry.iconFor ? entry.iconFor(shown) : entry.icon;
    const step = entry.keyStep ?? 0.05;

    const commitDraft = () => {
        const pending = draftRef.current;
        if (pending === null) return;
        draftRef.current = null;
        setDraft(null);
        entry.onCommit(pending);
    };

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const deltas: Record<string, number> = {
            ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: step * 2, PageDown: -step * 2,
        };
        let next: number | null = null;
        if (event.key in deltas) next = clamp01(roundPercent(shown + deltas[event.key]));
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = 1;
        if (next === null) return;
        // 自己按步长走（原生 range 一步是 step=0.01，太细）；这一下不再交给浏览器，墙的按键监听也认 defaultPrevented。
        event.preventDefault();
        draftRef.current = null;
        setDraft(null);
        entry.onCommit(next);
    };

    return (
        <div role="group" aria-label={entry.label} className="lattice-tools-slider" data-wall-tools-slider={entry.id}>
            {entry.iconAction ? (
                <button
                    type="button"
                    className="lattice-tools-slider-icon"
                    aria-label={entry.iconAction.label}
                    title={entry.iconAction.label}
                    aria-pressed={entry.iconAction.pressed}
                    onClick={entry.iconAction.onPress}
                >
                    <Icon aria-hidden="true" />
                </button>
            ) : (
                <span className="lattice-tools-slider-icon" aria-hidden="true"><Icon /></span>
            )}
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={shown}
                aria-label={entry.label}
                aria-valuetext={entry.formatValue(shown)}
                style={{ '--wall-tools-slider-fill': `${Math.round(shown * 100)}%` } as CSSProperties}
                onChange={event => {
                    const next = clamp01(Number(event.currentTarget.value));
                    draftRef.current = next;
                    setDraft(next);
                    entry.onPreview?.(next);
                }}
                onKeyDown={handleKeyDown}
                onPointerUp={commitDraft}
                onPointerCancel={commitDraft}
                onKeyUp={commitDraft}
                onBlur={commitDraft}
            />
            <span className="lattice-tools-slider-value" aria-hidden="true">{entry.formatValue(shown)}</span>
        </div>
    );
}

/** 顶部一排纯图标快捷格（menu 里的一个 group，按钮仍是 menuitem）。lead：排在快捷格前面的东西（墙的定位按钮）。
 *  `order` / `onReorder`：拖动换位（定位按钮记作 `locate`），松手后把新顺序交出去存起来；没传就只按默认顺序排、不能拖。 */
export function WallToolsQuickRow({ actions, onDone, lead, order, onReorder }: {
    actions: readonly WallToolsQuickAction[];
    onDone: () => void;
    lead?: ReactNode;
    order?: readonly string[];
    onReorder?: (ids: readonly string[]) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [preview, setPreview] = useState<readonly string[] | null>(null);
    const previewRef = useRef<readonly string[] | null>(null);
    previewRef.current = preview;
    const dragRef = useRef<{
        pointerId: number;
        id: string;
        x: number;
        y: number;
        active: boolean;
    } | null>(null);
    // 拖完那一下浏览器还会补一个 click，落在松手位置的格子上：吞掉它，免得顺手触发一个动作又收起面板。
    const swallowClickRef = useRef(false);

    const cells: { id: string; node: ReactNode; }[] = [];
    if (lead) cells.push({ id: 'locate', node: lead });
    for (const action of actions) {
        const Icon = action.icon;
        const tooltip = [action.label, action.status, action.kbd].filter(Boolean).join(' · ');
        cells.push({
            id: action.id,
            node: (
                <button
                    key={action.id}
                    type="button"
                    role="menuitem"
                    className={action.busy ? 'lattice-tools-quick-action is-busy' : 'lattice-tools-quick-action'}
                    data-wall-tools-quick={action.id}
                    aria-label={action.label}
                    aria-description={action.status}
                    aria-busy={action.busy || undefined}
                    aria-expanded={action.expanded}
                    aria-controls={action.controls}
                    title={tooltip}
                    disabled={action.disabled}
                    onClick={() => {
                        if (swallowClickRef.current) {
                            swallowClickRef.current = false;
                            return;
                        }
                        action.onSelect();
                        if (!action.keepOpen) onDone();
                    }}
                >
                    <Icon aria-hidden="true" />
                </button>
            ),
        });
    }

    // 存下来的顺序只决定已列出的 id 的先后；没列到的（新加的格子）按默认顺序接在后面。
    const applied = preview ?? order ?? [];
    const rank = new Map(applied.map((id, index) => [id, index]));
    const arranged = cells
        .map((cell, index) => ({ cell, index }))
        .sort((one, other) => {
            const oneRank = rank.get(one.cell.id);
            const otherRank = rank.get(other.cell.id);
            if (oneRank !== undefined && otherRank !== undefined) return oneRank - otherRank;
            if (oneRank !== undefined) return -1;
            if (otherRank !== undefined) return 1;
            return one.index - other.index;
        })
        .map(entry => entry.cell);

    const cellIdAt = (target: EventTarget | null): string | null => {
        if (!(target instanceof Element)) return null;
        const quick = target.closest('[data-wall-tools-quick]');
        if (quick) return quick.getAttribute('data-wall-tools-quick');
        return target.closest('[data-grid-locate]') ? 'locate' : null;
    };

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!onReorder || event.button !== 0) return;
        const id = cellIdAt(event.target);
        if (!id) return;
        dragRef.current = { pointerId: event.pointerId, id, x: event.clientX, y: event.clientY, active: false };
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        if (!drag.active) {
            if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
            drag.active = true;
            swallowClickRef.current = true;
            containerRef.current?.setPointerCapture(event.pointerId);
        }
        const overId = cellIdAt(document.elementFromPoint(event.clientX, event.clientY));
        if (!overId || overId === drag.id) return;
        const current = previewRef.current ?? arranged.map(cell => cell.id);
        const from = current.indexOf(drag.id);
        const to = current.indexOf(overId);
        if (from < 0 || to < 0) return;
        const next = [...current];
        next.splice(from, 1);
        next.splice(to, 0, drag.id);
        setPreview(next);
    };

    const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (containerRef.current?.hasPointerCapture(event.pointerId)) {
            containerRef.current.releasePointerCapture(event.pointerId);
        }
        const next = previewRef.current;
        setPreview(null);
        if (drag.active && next && onReorder) onReorder(next);
        // 浏览器在 pointerup 之后还会补一个 click；它被上面的 onClick 吃掉一次就清掉，没补的话 300ms 后也放手。
        window.setTimeout(() => { swallowClickRef.current = false; }, 300);
    };

    return (
        <div
            ref={containerRef}
            role="group"
            className={preview ? 'lattice-tools-quick is-reordering' : 'lattice-tools-quick'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
        >
            {arranged.map(cell => <span key={cell.id} className="contents">{cell.node}</span>)}
        </div>
    );
}

/** 一行条目。 */
export function WallToolsRow({ entry, onDone }: { entry: WallToolsEntry; onDone: () => void }) {
    if (entry.kind === 'slider') return <WallToolsSliderRow entry={entry} />;
    if (entry.kind === 'heading') {
        return (
            <div role="separator" aria-label={entry.label} className="lattice-tools-heading" data-wall-tools-heading={entry.id}>
                <span aria-hidden="true">{entry.label}</span>
            </div>
        );
    }
    const Icon = entry.icon;
    if (entry.kind === 'toggle') {
        return (
            <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={entry.checked}
                className="lattice-tools-action"
                onClick={() => entry.onToggle(!entry.checked)}
            >
                <Icon aria-hidden="true" />
                <span>{entry.label}</span>
                <span className={`lattice-tools-toggle ${entry.checked ? 'is-on' : ''}`} aria-hidden="true">
                    <span />
                </span>
            </button>
        );
    }
    const button = (
        <button
            type="button"
            role="menuitem"
            className="lattice-tools-action"
            onClick={() => {
                entry.onSelect();
                if (!entry.keepOpen) onDone();
            }}
            disabled={entry.disabled}
            aria-description={entry.hint}
        >
            <Icon aria-hidden="true" />
            <span>{entry.label}</span>
            {entry.value !== undefined && <span className="lattice-tools-value">{entry.value}</span>}
            {entry.kbd !== undefined && (entry.kbdHidden ? <kbd aria-hidden="true">{entry.kbd}</kbd> : <kbd>{entry.kbd}</kbd>)}
        </button>
    );
    // 有提示的条目包一层提示（悬停在外面这一层上；置灰的按钮不接指针，见 WallToolsButton.css）。
    return entry.hint ? <Tooltip text={entry.hint} className="lattice-tools-hint">{button}</Tooltip> : button;
}
