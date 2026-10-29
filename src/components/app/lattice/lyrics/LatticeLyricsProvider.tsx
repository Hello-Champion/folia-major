import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { LatticeLyricSource } from './types';

// src/components/app/lattice/lyrics/LatticeLyricsProvider.tsx
export type LatticeLyricContext = LatticeLyricSource & { songKey: string; keywordColoringEnabled: boolean; isDaylight: boolean };
const Context = createContext<LatticeLyricContext | null>(null);
export const useLatticeLyrics = () => useContext(Context);

export default function LatticeLyricsProvider({ source, songKey, keywordColoringEnabled, isDaylight, children }: {
    source: LatticeLyricSource; songKey: string; keywordColoringEnabled: boolean; isDaylight: boolean; children: ReactNode;
}) {
    // Select explicitly: the source may structurally contain global font scales and player-only showText.
    const { currentTime, currentLineIndex, lines, theme, subtitleTheme, showSubtitleTranslation,
        hideTranslationSubtitle, subtitleContentMode, showHarmonySubtitle, harmonySubtitleBackground, paused, staticMode } = source;
    const value = useMemo(() => ({ currentTime, currentLineIndex, lines, theme, subtitleTheme,
        showSubtitleTranslation, hideTranslationSubtitle, subtitleContentMode, showHarmonySubtitle, harmonySubtitleBackground,
        paused, staticMode, songKey, keywordColoringEnabled, isDaylight }),
    [currentTime, currentLineIndex, lines, theme, subtitleTheme, showSubtitleTranslation,
        hideTranslationSubtitle, subtitleContentMode, showHarmonySubtitle, harmonySubtitleBackground,
        paused, staticMode, songKey, keywordColoringEnabled, isDaylight]);
    return <Context.Provider value={value}>{children}</Context.Provider>;
}
