import { describe, expect, it } from 'vitest';
import { BRAVAIS_SEARCH_HISTORY_MAX, mergeBravaisSearchHistory } from '@/library/suites/bravais/bravaisSearchHistoryStore';

// test/unit/library/bravais/bravaisSearchHistory.test.ts
// 缝里全局搜索的历史：最近的在前、同一个词只留一份、最多十条；空词不进历史。

describe('mergeBravaisSearchHistory', () => {
    it('puts the newest query first', () => {
        expect(mergeBravaisSearchHistory(['b'], 'a')).toEqual(['a', 'b']);
    });

    it('moves a repeated query to the front without duplicating it', () => {
        expect(mergeBravaisSearchHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    });

    it('trims the query and ignores an empty one', () => {
        expect(mergeBravaisSearchHistory(['a'], '  b  ')).toEqual(['b', 'a']);
        expect(mergeBravaisSearchHistory(['a'], '   ')).toEqual(['a']);
    });

    it('keeps at most ten entries', () => {
        const full = Array.from({ length: BRAVAIS_SEARCH_HISTORY_MAX }, (_, index) => `q${index}`);
        const next = mergeBravaisSearchHistory(full, 'new');
        expect(next).toHaveLength(BRAVAIS_SEARCH_HISTORY_MAX);
        expect(next[0]).toBe('new');
        expect(next).not.toContain(`q${BRAVAIS_SEARCH_HISTORY_MAX - 1}`);
    });
});
