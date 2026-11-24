// src/mods/runtime/sharedModuleState.ts
// 打包器会把一个模块复制进多个 chunk（多入口、懒加载各一份），每份各有自己的模块级状态：
// 注册进一份、界面读另一份，功能就静默失效。需要一个「全包唯一」的模块级状态时用它——
// 状态按 Symbol.for(key) 放在 globalThis 上，所有副本共用同一个。key 要写进
// dev/checkChunkDuplication.mjs 的 shared 字段，打包检查才知道这份副本是安全的。

// 单测用 vi.resetModules() 重载模块来拿干净状态；共享缓存会跨用例残留，测试模式不共享。
const IS_TEST = (import.meta as { env?: { MODE?: string } }).env?.MODE === 'test';

export const sharedModuleState = <T>(key: string, create: () => T): T => {
    if (IS_TEST) return create();
    const symbol = Symbol.for(key);
    const holder = globalThis as unknown as { [k: symbol]: T | undefined };
    return holder[symbol] ?? (holder[symbol] = create());
};
