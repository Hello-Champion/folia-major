// src/components/wall/wallPanning.ts
// 墙正在被拖动 / 滚轮推动的全局标记（useWallPointerPan 写，停手 160ms 后清除）。海报封面据此在墙动的时候只画
// 已经解码过的那一档：拖动中新进场的卡片不再于半路解码新封面，卡顿的来源（Decode LazyPixelRef 卡住栅格）就没了。

let panning = false;
const listeners = new Set<() => void>();

export const isWallPanning = (): boolean => panning;

export const setWallPanning = (next: boolean): void => {
    if (panning === next) return;
    panning = next;
    if (next) return;
    for (const listener of [...listeners]) listener();
};

/** 墙停下来时调一次（升级封面在这个时机做，不在拖动途中做）。 */
export const subscribeWallPanning = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};
