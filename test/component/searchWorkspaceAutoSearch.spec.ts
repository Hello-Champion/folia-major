import { test, expect } from './fixtures';

// test/component/searchWorkspaceAutoSearch.spec.ts
// 搜索页自动搜索：打开搜索页时若已有查询且没有结果，应直接用当前来源跑一次搜索，
// 不需要用户先手动点一下来源选项；已缓存结果 / 空查询 / 搜索中不重复触发。
// 用户实测：搜索页必须点一下 QQ 音乐/本地/Navidrome 才会出结果。

test('search page auto-runs a search when opened with a query and no results', async ({ mount, page }) => {
    await mount('searchWorkspaceAutoSearch');

    const readRuns = () => page.getAttribute('[data-probe-searches]', 'data-probe-searches').then(v => Number(v ?? '0'));

    // 初始未打开搜索页，不应有任何自动搜索
    expect(await readRuns()).toBe(0);

    // 打开搜索页（有查询、无结果）→ 自动搜一次
    await page.click('[data-probe-scenario="fresh"]');
    await expect.poll(readRuns).toBe(1);

    // 已有缓存结果 → 不重复触发
    await page.click('[data-probe-scenario="cached"]');
    await expect.poll(readRuns).toBe(1);

    // 空查询 → 不触发
    await page.click('[data-probe-scenario="empty"]');
    await expect.poll(readRuns).toBe(1);

    // 再次打开（重新清空结果）→ 再自动搜一次
    await page.click('[data-probe-scenario="fresh"]');
    await expect.poll(readRuns).toBe(2);
});
