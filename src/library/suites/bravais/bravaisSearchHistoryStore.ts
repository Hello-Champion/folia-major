import { create } from 'zustand';
import { getStoredString, setStoredString } from '../../../stores/storagePrimitives';

// src/library/suites/bravais/bravaisSearchHistoryStore.ts
// 首页缝里全局搜索框（BravaisSeamSearch）的搜索历史：提交过的词按最近在前去重保存，最多十条。
// 点历史条目直接再搜一次；垃圾桶清空。存在 localStorage，跨启动保留。

export const BRAVAIS_SEARCH_HISTORY_KEY = 'bravais_search_history';
export const BRAVAIS_SEARCH_HISTORY_MAX = 10;

/** 把一次提交并进历史：去空白、忽略空词，已有的词提到最前，超出上限的丢掉。 */
export const mergeBravaisSearchHistory = (current: readonly string[], query: string): string[] => {
    const entry = query.trim();
    if (!entry) return [...current];
    return [entry, ...current.filter(item => item !== entry)].slice(0, BRAVAIS_SEARCH_HISTORY_MAX);
};

const readHistory = (): string[] => {
    const raw = getStoredString(BRAVAIS_SEARCH_HISTORY_KEY, '');
    if (!raw) return [];
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
            .slice(0, BRAVAIS_SEARCH_HISTORY_MAX);
    } catch {
        return [];
    }
};

const writeHistory = (history: string[]) => {
    setStoredString(BRAVAIS_SEARCH_HISTORY_KEY, JSON.stringify(history));
};

type BravaisSearchHistoryState = {
    history: string[];
};

export const useBravaisSearchHistoryStore = create<BravaisSearchHistoryState>(() => ({ history: readHistory() }));

export const addBravaisSearchHistory = (query: string) => {
    const history = mergeBravaisSearchHistory(useBravaisSearchHistoryStore.getState().history, query);
    writeHistory(history);
    useBravaisSearchHistoryStore.setState({ history });
};

export const clearBravaisSearchHistory = () => {
    writeHistory([]);
    useBravaisSearchHistoryStore.setState({ history: [] });
};
