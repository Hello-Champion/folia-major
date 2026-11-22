import { useEffect, useState } from 'react';

// src/hooks/useSampledBackgroundTone.ts
// 播放页「自动」明暗用的背景亮度：桌面版由主进程截当前窗口的一小块、缩图后给平均相对亮度（0 黑 … 1 白）。
// 可视化画布本身读不到像素，这是唯一能看到画面真实颜色的路。
// 只在两种时候取一次：进入播放页（从首页打开详情）时，以及换歌词样式 / 换背景时；不轮询。
// 浏览器版没有这个方法：返回 null，调用方保持当前模式不动。

/** `resampleKey` 一变就再取一次（换歌词样式、换背景）。 */
export const useSampledBackgroundTone = (active: boolean, resampleKey = ''): number | null => {
    const [tone, setTone] = useState<number | null>(null);

    useEffect(() => {
        if (!active) {
            setTone(null);
            return undefined;
        }
        let cancelled = false;
        const sample = () => {
            const api = window.electron?.sampleWindowTone;
            if (!api) return;
            void api()
                .then(value => {
                    if (cancelled || typeof value !== 'number' || !Number.isFinite(value)) return;
                    setTone(value);
                })
                .catch(() => { /* 截图失败时保持上一次的值 */ });
        };
        // 换样式/背景有过渡动画，等它落定再截这一张。
        const timer = window.setTimeout(sample, 700);
        // 模组的背景可能在第一次截图时还没画上来（扫描、海报、视频缓冲）：再取一次，后到的为准。
        const later = window.setTimeout(sample, 2600);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            window.clearTimeout(later);
        };
    }, [active, resampleKey]);

    return tone;
};
