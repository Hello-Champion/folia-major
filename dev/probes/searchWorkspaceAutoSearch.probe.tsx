import React, { useCallback, useState } from 'react';
import SearchWorkspace from '../../src/components/app/search/SearchWorkspace';
import { useSearchNavigationStore } from '../../src/stores/useSearchNavigationStore';
import type { Theme, UnifiedSong } from '../../src/types';
import type { ProbeDefinition } from './definition';
// dev/probes/searchWorkspaceAutoSearch.probe.tsx

const PROBE_THEME: Theme = {
    name: 'Probe',
    backgroundColor: '#111111',
    primaryColor: '#f5f5f5',
    accentColor: '#6aa9ff',
    secondaryColor: '#888888',
    fontStyle: 'sans',
    animationIntensity: 'calm',
};

const seed = (patch: Partial<ReturnType<typeof useSearchNavigationStore.getState>>) => {
    useSearchNavigationStore.setState(patch);
};

/**
 * 验证搜索页自动搜索：打开搜索页（首页缝提交、命令面板等入口）时若还没有结果，
 * 应直接用当前来源跑一次搜索，不需要用户先手动点一下来源选项。
 * 探针把 onSubmitSearch 的调用次数镜像到 data-probe-searches，并提供三个场景按钮，
 * 用例逐个点击并断言调用次数是否符合预期（含缓存结果 / 空查询不重复触发的守卫）。
 */
const SearchWorkspaceAutoSearchProbe: React.FC = () => {
    const [searchRuns, setSearchRuns] = useState(0);

    // 模拟真实 onSubmitSearch（AppShell 里走 submitSearch）：同步把 isSearching 置 true。
    const handleSubmitSearch = useCallback(() => {
        useSearchNavigationStore.setState({ isSearching: true });
        setSearchRuns(runs => runs + 1);
    }, []);

    return (
        <div className="relative h-screen bg-zinc-900" data-probe-searches={searchRuns}>
            <SearchWorkspace
                theme={PROBE_THEME}
                isDaylight={false}
                onClose={() => { }}
                onSubmitSearch={handleSubmitSearch}
                onLoadMore={() => { }}
                onPlayTrack={() => { }}
                onAddTrackToQueue={() => { }}
                onOpenArtist={() => { }}
                onOpenAlbum={() => { }}
            />
            {/* 搜索面板是 fixed inset-0 全屏遮罩，场景按钮要挂在更高层才能点 */}
            <div className="fixed left-2 top-2 z-[60] flex flex-col gap-2">
                <button
                    type="button"
                    data-probe-scenario="fresh"
                    className="rounded border border-white/30 bg-black/60 px-2 py-1 text-xs text-white"
                    onClick={() => seed({
                        isSearchOpen: true,
                        isSearching: false,
                        searchQuery: 'probe',
                        searchResults: null,
                        searchSourceTab: 'qq',
                    })}
                >
                    fresh
                </button>
                <button
                    type="button"
                    data-probe-scenario="cached"
                    className="rounded border border-white/30 bg-black/60 px-2 py-1 text-xs text-white"
                    onClick={() => seed({
                        isSearchOpen: true,
                        isSearching: false,
                        searchQuery: 'probe',
                        searchResults: [{ id: 'cached-1', name: 'Cached' }] as UnifiedSong[],
                    })}
                >
                    cached
                </button>
                <button
                    type="button"
                    data-probe-scenario="empty"
                    className="rounded border border-white/30 bg-black/60 px-2 py-1 text-xs text-white"
                    onClick={() => seed({
                        isSearchOpen: true,
                        isSearching: false,
                        searchQuery: '',
                        searchResults: null,
                    })}
                >
                    empty query
                </button>
            </div>
        </div>
    );
};

const definition: ProbeDefinition = {
    id: 'searchWorkspaceAutoSearch',
    title: '搜索面板 · 打开即自动搜索',
    description: '打开搜索页有查询且无结果时自动搜一次；缓存结果 / 空查询 / 搜索中不重复触发。',
    Component: SearchWorkspaceAutoSearchProbe,
};

export default definition;
