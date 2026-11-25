import { sharedModuleState } from '../../mods/runtime/sharedModuleState';

// src/components/wall/wallPanning.ts
// 墙正在被拖动 / 滚轮推动的全局标记（useWallPointerPan 写，停手 160ms 后清除）。海报封面据此在墙动的时候只画
// 已经解码过的那一档：拖动中新进场的卡片不再于半路解码新封面，卡顿的来源（Decode LazyPixelRef 卡住栅格）就没了。

// 打包器会把本模块复制进多个 chunk：拖动写在 BravaisStage 那份里、封面钩子读的是 wall 那份，
// 标记永远是 false，拖动中就又开始解码新封面。状态放 globalThis，所有副本共用。
const runtime = sharedModuleState('folia.wallPanningState', () => ({
    panning: false,
    listeners: new Set<() => void>(),
}));

export const isWallPanning = (): boolean => runtime.panning;

export const setWallPanning = (next: boolean): void => {
    if (runtime.panning === next) return;
    runtime.panning = next;
    if (next) return;
    for (const listener of [...runtime.listeners]) listener();
};

/** 墙停下来时调一次（升级封面在这个时机做，不在拖动途中做）。 */
export const subscribeWallPanning = (listener: () => void): (() => void) => {
    runtime.listeners.add(listener);
    return () => { runtime.listeners.delete(listener); };
};
