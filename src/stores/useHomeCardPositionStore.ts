import { create } from 'zustand';
import { sharedModuleState } from '../mods/runtime/sharedModuleState';

// src/stores/useHomeCardPositionStore.ts
// Session-only home card bookmarks survive view unmounts without persisting library data.

export type HomeCardPosition = { id: string; index: number };

type HomeCardPositionState = {
    positions: Record<string, HomeCardPosition>;
    remember: (scope: string, position: HomeCardPosition) => void;
    clear: () => void;
};

export const useHomeCardPositionStore = sharedModuleState('folia.store.src/stores/useHomeCardPositionStore.ts#useHomeCardPositionStore', () => create<HomeCardPositionState>(set => ({
    positions: {},
    remember: (scope, position) => set(state => {
        const previous = state.positions[scope];
        if (previous?.id === position.id && previous.index === position.index) return state;
        return { positions: { ...state.positions, [scope]: position } };
    }),
    clear: () => set({ positions: {} }),
})));
