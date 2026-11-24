import { create } from 'zustand';
import { sharedModuleState } from '../../../../mods/runtime/sharedModuleState';
import { selectDisplaySong, usePlaybackStore } from '../../../../stores/usePlaybackStore';

// Only adjustment-session state lives here; saved positions belong to useStageSettingsStore.
export const hasNowPlayingCardSong = (state: ReturnType<typeof usePlaybackStore.getState>) => Boolean(selectDisplaySong(state));
export const canPositionNowPlayingCard = () => hasNowPlayingCardSong(usePlaybackStore.getState());

export const useNowPlayingCardLayoutStore = sharedModuleState('folia.store.src/components/app/overlays/now-playing-toast/nowPlayingCardLayoutStore.ts#useNowPlayingCardLayoutStore', () => create<{
    isPositioning: boolean;
    requestSeq: number;
    requestPositioning: () => void;
    startPositioning: () => void;
    finishPositioning: () => void;
}>((set) => ({
    isPositioning: false,
    requestSeq: 0,
    requestPositioning: () => {
        if (canPositionNowPlayingCard()) set(state => ({ requestSeq: state.requestSeq + 1 }));
    },
    startPositioning: () => set({ isPositioning: true }),
    finishPositioning: () => set({ isPositioning: false }),
})));
