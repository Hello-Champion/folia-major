import { useSyncExternalStore } from 'react';
import { sharedModuleState } from '../mods/runtime/sharedModuleState';

// src/hooks/useViewportSettle.ts
// One listener for every measured-text consumer in the app. Viewport-relative type — the poster
// title is `clamp(22px, 2vw, 36px)` — changes size continuously while a window is dragged, which
// invalidates every fit measured against the old size. Refitting per frame would cost far more
// than the fits are worth, so subscribers are told that a resize is under way, and then once that
// stops, that the new size is worth measuring against.

const QUIET_MS = 140;
const settleRuntime = sharedModuleState('folia.viewportSettle', () => {
    const state = {
        epoch: 0,
        resizing: false,
        snapshot: { epoch: 0, resizing: false },
        timer: undefined as ReturnType<typeof setTimeout> | undefined,
        listeners: new Set<() => void>(),
    };
    return state;
});

const publish = () => {
    settleRuntime.snapshot = { epoch: settleRuntime.epoch, resizing: settleRuntime.resizing };
    for (const listener of settleRuntime.listeners) listener();
};

const onResize = () => {
    clearTimeout(settleRuntime.timer);
    if (!settleRuntime.resizing) {
        settleRuntime.resizing = true;
        publish();
    }
    settleRuntime.timer = setTimeout(() => {
        settleRuntime.resizing = false;
        settleRuntime.epoch += 1;
        publish();
    }, QUIET_MS);
};

const subscribe = (listener: () => void) => {
    settleRuntime.listeners.add(listener);
    if (settleRuntime.listeners.size === 1 && typeof window !== 'undefined') window.addEventListener('resize', onResize);
    return () => {
        settleRuntime.listeners.delete(listener);
        if (settleRuntime.listeners.size || typeof window === 'undefined') return;
        window.removeEventListener('resize', onResize);
        clearTimeout(settleRuntime.timer);
        settleRuntime.timer = undefined;
        // The last subscriber leaving mid-drag must not strand the flag for the next one.
        if (settleRuntime.resizing) {
            settleRuntime.resizing = false;
            settleRuntime.snapshot = { epoch: settleRuntime.epoch, resizing: settleRuntime.resizing };
        }
    };
};

const read = () => settleRuntime.snapshot;

/** `settleRuntime.resizing` while the window is being dragged; `settleRuntime.epoch` increments once it comes to rest. */
export const useViewportSettle = () => useSyncExternalStore(subscribe, read, read);

export default useViewportSettle;
