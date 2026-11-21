import type { SeamAxis } from '../../../components/wall/seamPlan';
import { BRAVAIS_TILT_DEG } from './bravaisConstants';
import type { BravaisSeamContentVariant } from './bravaisSeamTarget';

// src/library/suites/bravais/bravaisTilt.ts
// 整层（两半墙与缝）此刻该倾斜多少度（纯规则）。倾斜本身不分页面：帧里只有一个角度（useBravaisFrame 的 tiltDeg），
// 由 useBravaisTilt 补间过去、bravaisFrame 画出来；这里只决定「缝里画着哪一种内容时转多少」，首页、集合页与歌手 / 专辑
// 海报走同一条路，各自的角度在 bravaisConstants 的 BRAVAIS_TILT_DEG。

/** 倾斜角按它分组的页面种类（BRAVAIS_TILT_DEG 的键）。 */
export type BravaisTiltPage = keyof typeof BRAVAIS_TILT_DEG;

/** 一套缝的内容算哪一种页面；面板、表单、搜索框（列表与输入框保持端正）和折叠（没有缝）不倾斜，给 null。 */
export const resolveBravaisTiltPage = (variant: BravaisSeamContentVariant): BravaisTiltPage | null => {
    if (variant === 'poster') return 'poster';
    if (variant === 'home' || variant === 'home-spine') return 'home';
    if (variant === 'full' || variant === 'spine') return 'collection';
    return null;
};

export type BravaisTiltInput = {
    /** 缝此刻要画的那一套内容（开口目标的 variant）。 */
    variant: BravaisSeamContentVariant;
    /** 开口目标的宽度（屏幕 px）：合上（翻牌交接、折叠）时回正。 */
    openWidth: number;
    /** 开口目标的方向。 */
    targetAxis: SeamAxis | null;
    /** 缝里此刻画着的内容的方向：横条还没合上时不转（横条在场时帧里没有倾斜，提前开始补间会在换方向那一刻跳一下）。 */
    renderedAxis: SeamAxis | null;
    /**
     * 这一层此刻是有限拼贴（过滤、批量、只看隐藏）：不倾斜。有限态的相机范围按没倾斜的视口算（wall/finiteWall），倾斜着
     * 离缝远的磁贴会被抬出或压出屏幕、拖不回来；海报同样只画在无限拼贴上。
     */
    finite: boolean;
    /** 降低动态效果（lattice）时不倾斜。 */
    reducedMotion: boolean;
    /** 集合页倾不倾斜（useLibraryWallLookStore 的 collectionTilt）：关掉时集合页的角度取 0，首页与海报照表。 */
    collectionTilt: boolean;
};

/**
 * 整层的目标倾斜角（度）：竖的缝绕右缘转，横的缝绕下缘做 rotateX（computeBravaisFrame），没有缝时不倾斜。
 * table 缺省是出厂的那张表（测试里换一张，各种页面的角度互不相同才分得清走的是哪一格）。
 */
export const resolveBravaisTiltDeg = (
    { variant, openWidth, targetAxis, renderedAxis, finite, reducedMotion, collectionTilt }: BravaisTiltInput,
    table: Record<BravaisTiltPage, number> = BRAVAIS_TILT_DEG,
): number => {
    if (reducedMotion || finite || openWidth <= 0 || targetAxis === null) return 0;
    // 缝正在换方向（横条还没合上）：此刻不转，等新方向的内容画上来再转，免得方向切换时跳一下。
    if (renderedAxis !== null && renderedAxis !== targetAxis) return 0;
    const page = resolveBravaisTiltPage(variant);
    if (!page || (page === 'collection' && !collectionTilt)) return 0;
    // shortcut: 横缝（axis y）的倾斜没有 2D 的出血/让位修正（insets、tiltEdgeRoom 都只按竖缝算），
    // 靠 overscan 兜底；角度开到很大且内容贴边时可能被裁一点，需要时再补一套按 rotateX 的余量。
    return table[page];
};

/**
 * 同一条规则下的前后倾斜角（度）：竖缝、横缝都绕各自的支点做 rotateX，所以两种缝方向共用。
 * 支点、折叠条件与 resolveBravaisTiltDeg 完全一致，只是查另一张表。
 */
export const resolveBravaisTiltFrontDeg = (
    input: BravaisTiltInput,
    table: Record<BravaisTiltPage, number> = BRAVAIS_TILT_DEG,
): number => resolveBravaisTiltDeg(input, table);
