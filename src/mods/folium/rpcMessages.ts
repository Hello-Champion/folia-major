import type { ModRpcMessage } from '../types';
import { sharedModuleState } from '../runtime/sharedModuleState';
// 打包器会把本模块复制进多个 chunk：状态各持一份，读写两边对不上。状态放 globalThis。
const moduleState = sharedModuleState('folia.rpcMessages', () => ({
    listenersByMod: new Map<string, Map<string, Set<RpcListener>>>(),
    listenerCount: 0,
    unsubscribe: null as (() => void) | null,
}));
import { subscribeModRpcMessages } from '../ipc';

// src/mods/folium/rpcMessages.ts
// The window's end of a main entry's `api.rpc.send` (Folium 1.7): the listeners `folium.rpc.on` added,
// by mod id and message name, and one subscription to the bridge, held only while some client listens.
// A message reaches only the listeners of the mod whose main entry sent it, each with its own parsed
// copy of the payload, so one listener changing it cannot change what the next one sees.

/** What the main process accepts as a message name, for `api.rpc.handle` and `api.rpc.send` alike. */
export const FOLIUM_RPC_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

type RpcListener = (payload: unknown) => void;


/*
 * Hands one message to its mod's listeners for its name. They are the gate's wrappers (api.ts), so
 * one that throws is reported against the mod and the rest still run. A listener removed by an
 * earlier one during the same message is skipped; one added during it hears the next message.
 */
const deliver = (message: ModRpcMessage) => {
    if (!message || typeof message.modId !== 'string' || typeof message.name !== 'string' || typeof message.json !== 'string') {
        return;
    }
    const listeners = moduleState.listenersByMod.get(message.modId)?.get(message.name);
    if (!listeners || listeners.size === 0) return;
    for (const listener of Array.from(listeners)) {
        if (!listeners.has(listener)) continue;
        let payload: unknown;
        try {
            payload = JSON.parse(message.json);
        } catch (error) {
            // The main process sends only text it made with JSON.stringify; this is not the mod's fault.
            console.warn(`[Folium:${message.modId}] rpc message ${message.name} could not be read`, error);
            return;
        }
        listener(payload);
    }
};

/**
 * Adds a listener for one mod's messages of one name. The first listener of the window subscribes
 * to the bridge and the last one to go unsubscribes, so a session without one holds nothing.
 * Returns the removal; calling it again does nothing.
 */
export const addFoliumRpcListener = (modId: string, name: string, listener: RpcListener): (() => void) => {
    let byName = moduleState.listenersByMod.get(modId);
    if (!byName) {
        byName = new Map();
        moduleState.listenersByMod.set(modId, byName);
    }
    let listeners = byName.get(name);
    if (!listeners) {
        listeners = new Set();
        byName.set(name, listeners);
    }
    // A wrapper is made per call (api.ts), so the same listener twice is two entries, as with events.on.
    const entry: RpcListener = (payload) => listener(payload);
    listeners.add(entry);
    moduleState.listenerCount += 1;
    if (moduleState.listenerCount === 1) {
        moduleState.unsubscribe = subscribeModRpcMessages(deliver);
    }
    let removed = false;
    return () => {
        if (removed) return;
        removed = true;
        const current = moduleState.listenersByMod.get(modId)?.get(name);
        if (current?.delete(entry)) {
            if (current.size === 0) moduleState.listenersByMod.get(modId)?.delete(name);
            if (moduleState.listenersByMod.get(modId)?.size === 0) moduleState.listenersByMod.delete(modId);
        }
        moduleState.listenerCount -= 1;
        if (moduleState.listenerCount === 0) {
            moduleState.unsubscribe?.();
            moduleState.unsubscribe = null;
        }
    };
};

/** Whether any listener of the mod waits for messages of `name`, or of any name when it is left out. */
export const hasFoliumRpcListeners = (modId: string, name?: string): boolean => {
    const byName = moduleState.listenersByMod.get(modId);
    if (!byName) return false;
    return name === undefined ? byName.size > 0 : (byName.get(name)?.size ?? 0) > 0;
};
