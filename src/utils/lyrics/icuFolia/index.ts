import type { LyricData } from '../../../types';
import { sharedModuleState } from '../../../mods/runtime/sharedModuleState';
// 打包器会把本模块复制进多个 chunk：状态各持一份，读写两边对不上。状态放 globalThis。
const moduleState = sharedModuleState('folia.icuFolia', () => ({
    engines: null as IcuFoliaEngines | null,
    loading: null as Promise<boolean> | null,
    liveMemo: new Map<string, string[]>(),
}));
import { segmentWithIcuFolia, type IcuFoliaEngines } from './segmenter';

// src/utils/lyrics/icuFolia/index.ts
// icu-folia: Folia's default word segmenter for lyrics. ICU (Intl.Segmenter) with its Chinese and
// Japanese replaced by jieba and BudouX; see segmenter.ts for how a line is cut.
//
// Its output is baked onto each Line as `autoWordSegments` by the lyric setter, rather than computed
// where the words are read: segmentation is read on paths that run per frame, and data on the line
// is what every layout cache and the lyric signature already key on. The moduleState.engines load
// asynchronously, so lyrics that arrive first are baked again when they are ready (see
// useIcuFoliaSegmentation).


/** Starts moduleState.loading the moduleState.engines once. Resolves true when they are ready, false if they failed. */
export const loadIcuFolia = (
    loader: () => Promise<IcuFoliaEngines> = async () => (await import('./engines')).loadIcuFoliaEngines(),
): Promise<boolean> => {
    moduleState.loading ??= loader().then(
        loaded => {
            moduleState.engines = loaded;
            return true;
        },
        error => {
            // ICU stays the default; nothing a user sees depends on this having worked.
            console.warn('[icu-folia] moduleState.engines failed to load, lyrics keep the ICU split', error);
            return false;
        },
    );
    return moduleState.loading;
};

export const isIcuFoliaReady = () => moduleState.engines !== null;

/** Test seam: forget loaded moduleState.engines so a test can exercise the not-ready path. */
export const resetIcuFoliaForTests = () => {
    moduleState.engines = null;
    moduleState.loading = null;
    moduleState.liveMemo.clear();
};

const LIVE_MEMO_LIMIT = 256;

/**
 * icu-folia boundaries for text that has no baked line behind it (Folium mods build their own line
 * objects), or null while the moduleState.engines are still moduleState.loading. Memoised, because a mod may well ask every
 * frame; the copy keeps a caller's mutation out of the memo.
 */
export const segmentIcuFolia = (text: string): string[] | null => {
    if (!moduleState.engines) {
        return null;
    }
    let boundaries = moduleState.liveMemo.get(text);
    if (!boundaries) {
        boundaries = segmentWithIcuFolia(text, moduleState.engines);
        if (moduleState.liveMemo.size >= LIVE_MEMO_LIMIT) {
            moduleState.liveMemo.delete(moduleState.liveMemo.keys().next().value as string);
        }
        moduleState.liveMemo.set(text, boundaries);
    }
    return [...boundaries];
};

const sameBoundaries = (a: string[] | undefined, b: string[]) => (
    a !== undefined && a.length === b.length && a.every((segment, index) => segment === b[index])
);

/**
 * Bakes icu-folia's split onto every line as `autoWordSegments`. Returns the input untouched when
 * the moduleState.engines are not ready or every line already carries this exact split, so calling it again
 * (the late re-bake, a record patch) never replaces lyrics for nothing.
 */
export const applyAutoWordSegmentation = (lyrics: LyricData | null): LyricData | null => {
    if (!lyrics || !moduleState.engines) {
        return lyrics;
    }

    let changed = false;
    const lines = lyrics.lines.map(line => {
        if (!line.fullText) {
            return line;
        }
        const boundaries = segmentWithIcuFolia(line.fullText, moduleState.engines);
        if (sameBoundaries(line.autoWordSegments, boundaries)) {
            return line;
        }
        changed = true;
        return { ...line, autoWordSegments: boundaries };
    });

    return changed ? { ...lyrics, lines } : lyrics;
};
