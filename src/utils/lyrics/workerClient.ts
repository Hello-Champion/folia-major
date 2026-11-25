import { LyricData } from '../../types';
import { sharedModuleState } from '../../mods/runtime/sharedModuleState';
import type { LyricParseFormat } from './parserCore';
import type { LyricProcessingOptions } from './types';

// 打包器把本模块复制进两个 chunk 时，两边各建一个 Worker：同一份歌词要解析两遍，多占一个线程。
// Worker 与回调表放 globalThis，全包共用一个。
const workerRuntime = sharedModuleState('folia.lyricsWorkerClient', () => ({
    worker: null as Worker | null,
    requestId: 0,
    callbacks: new Map<string, (data: LyricData | null) => void>(),
}));
const workerCallbacks = workerRuntime.callbacks;

type WorkerLyricProcessingOptions = Pick<LyricProcessingOptions, 'includeInterludes'>;

// Keeps orchestration-only values such as provider callbacks outside the structured-clone boundary.
export const toWorkerLyricProcessingOptions = (
    options?: LyricProcessingOptions,
): WorkerLyricProcessingOptions | undefined => {
    if (!options) return undefined;
    return {
        ...(options.includeInterludes !== undefined ? { includeInterludes: options.includeInterludes } : {}),
    };
};

export const initLyricsWorker = (): Worker => {
    if (!workerRuntime.worker) {
        // Need to use correct relative path or alias
        workerRuntime.worker = new Worker(
            new URL('../../workers/lyricsParser.worker.ts', import.meta.url),
            { type: 'module' }
        );
        workerRuntime.worker.onmessage = (e) => {
            const { type, data, requestId, message } = e.data;
            const callback = workerCallbacks.get(requestId);
            if (callback) {
                workerCallbacks.delete(requestId);
                if (type === 'result') {
                    callback(data);
                } else {
                    console.warn('[LyricsWorker] parsing error:', message);
                    callback(null);
                }
            }
        };
    }
    return workerRuntime.worker;
};

export const parseLyricsAsync = (
    format: LyricParseFormat,
    content: string,
    translation?: string,
    options?: LyricProcessingOptions,
    romanization?: string
): Promise<LyricData | null> => {
    return new Promise((resolve) => {
        const worker = initLyricsWorker();
        const requestId = `req_${++workerRuntime.requestId}`;
        workerCallbacks.set(requestId, resolve);
        worker.postMessage({
            type: 'parse',
            format,
            content,
            translation,
            romanization,
            options: toWorkerLyricProcessingOptions(options),
            requestId,
        });
    });
};
