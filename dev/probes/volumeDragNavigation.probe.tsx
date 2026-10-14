import React, { useState } from 'react';
import { motionValue } from 'framer-motion';
import FloatingPlayerControls from '../../src/components/FloatingPlayerControls';
import { PlayerBottomBarLayoutContext } from '../../src/components/floating-player/PlayerBottomBarLayoutContext';
import { PlayerState } from '../../src/types';
import type { ProbeDefinition } from './definition';
// dev/probes/volumeDragNavigation.probe.tsx

const currentTime = motionValue(42);

/**
 * 验证 row 模式音量滑块：拖完松手不该触发胶囊导航（回到拼贴墙），点胶囊其他区域仍应导航。
 * 探针把 onNavigateToPlayer 的次数镜像到 data 属性，好让用例断言。
 */
const VolumeDragNavigationProbe: React.FC = () => {
    const [playerNavigations, setPlayerNavigations] = useState(0);

    return (
        <div
            className="relative h-screen bg-zinc-900"
            data-probe-navigations={playerNavigations}
        >
            <PlayerBottomBarLayoutContext.Provider value={true}>
                <FloatingPlayerControls
                    currentSong={{ name: 'Probe Song' }}
                    playerState={PlayerState.PAUSED}
                    currentTime={currentTime}
                    duration={200}
                    loopMode="all"
                    currentView="player"
                    audioSrc="probe://audio"
                    canTogglePlay
                    lyrics={null}
                    onSeek={() => { }}
                    onTogglePlay={() => { }}
                    onToggleLoop={() => { }}
                    onNavigateToPlayer={() => setPlayerNavigations(count => count + 1)}
                    isDaylight={false}
                    showVolumeSlider
                    previewVolume={() => { }}
                    slotPrimary="loop"
                    slotSecondary="lyrics-timeline"
                    slotContext={{
                        onShuffle: () => { },
                        canShuffle: true,
                        onLike: () => { },
                        isLiked: false,
                        likeDisabled: false,
                        invokeCommandById: () => { },
                        canInvokeCommandById: () => true,
                    }}
                    onCommitBottomBarOffset={() => { }}
                />
            </PlayerBottomBarLayoutContext.Provider>
        </div>
    );
};

const definition: ProbeDefinition = {
    id: 'volumeDragNavigation',
    title: '浮动播放条 · 音量滑块拖拽不触发胶囊导航',
    description: 'row 模式音量滑块拖完松手不导航；点击胶囊其他区域仍导航。',
    Component: VolumeDragNavigationProbe,
};

export default definition;
