import { test, expect } from './fixtures';

// test/component/volumeDragNavigation.spec.ts
// row 模式音量滑块：拖完松手不触发胶囊 onClick（否则会导航回拼贴墙/播放页）；点胶囊其他区域仍导航。
// 复现用户实测：点开小喇叭 → 拖动滑块 → 松开，结果回到了拼贴墙（capsule onClick 冒泡）。

test('volume slider drag does not trigger capsule navigation, other capsule clicks still do', async ({ mount, page }) => {
    await mount('volumeDragNavigation');

    const readNavigations = () => page.getAttribute('[data-probe-navigations]', 'data-probe-navigations').then(v => Number(v ?? '0'));

    // 1. 点开音量小喇叭（row 模式内联滑块展开）；探针环境语言可能是 en 或 zh-CN，两种 label 都认
    const volumeButton = page.locator('button[aria-label="Volume"], button[aria-label="音量"]');
    await volumeButton.click();
    const slider = page.locator('[role="slider"][aria-label="Volume"]');
    await expect(slider).toBeVisible();

    // 2. 拖动滑块：pointer down → move → up（真实拖动路径，会以 slider 为捕获目标派发 click）
    // 胶囊贴页面底部，先滚进视口再量坐标，否则滑块下半截在视口外、命中点会落在胶囊其他元素上。
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    const startX = box!.x + box!.width * 0.6;
    const startY = box!.y + box!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - box!.width * 0.25, startY, { steps: 5 });
    await page.mouse.up();

    // 3. 松手后不应有任何胶囊导航
    expect(await readNavigations()).toBe(0);

    // 4. 点胶囊其他区域（歌名那一行，非按钮）仍应导航
    await page.click('text=Probe Song');
    expect(await readNavigations()).toBe(1);
});

test('row-mode volume slider collapses when clicking elsewhere (blur)', async ({ mount, page }) => {
    await mount('volumeDragNavigation');

    // 打开音量小喇叭 → 内联滑块出现
    const volumeButton = page.locator('button[aria-label="Volume"], button[aria-label="音量"]');
    await volumeButton.click();
    const slider = page.locator('[role="slider"][aria-label="Volume"]');
    await expect(slider).toBeVisible();

    // 点击页面空白处（探针背景，不在胶囊内）→ 滑块自动收起
    await page.mouse.click(24, 24);
    await expect(slider).not.toBeVisible();

    // 收起过程不触发胶囊导航
    const navigations = Number(await page.getAttribute('[data-probe-navigations]', 'data-probe-navigations') ?? '0');
    expect(navigations).toBe(0);
});
