import React, { useEffect, useRef, useState } from 'react';
import { handleSetVolume, useAudioSettingsStore } from '../../stores/useAudioSettingsStore';

// src/components/floating-player/PlayerBarVolumeSlider.tsx
// 音量条，视觉沿用进度条：细轨道（和进度条一样 6px 粗）+ 圆角填充。
// 竖向：从底部向上填充；横向：从左向右填充。外圈是更宽的命中区，方便抓取；
// 拖动时只走 preview（改增益、不写 store），松手才落盘 commit。

interface PlayerBarVolumeSliderProps {
    /** 拖动过程中的实时预览：只碰增益节点，不持久化。 */
    previewVolume: (volume: number) => void;
    primaryColor: string;
    trackColor?: string;
    disabled?: boolean;
    /** 竖向（默认，底部向上填充）/ 横向（从左向右填充）。 */
    orientation?: 'vertical' | 'horizontal';
    /** 拖动过程中的实时数值回调（用于外部显示百分比等）。 */
    onPreview?: (volume: number) => void;
}

const PlayerBarVolumeSlider: React.FC<PlayerBarVolumeSliderProps> = ({
    previewVolume,
    primaryColor,
    trackColor = 'rgba(255,255,255,0.1)',
    disabled = false,
    orientation = 'vertical',
    onPreview,
}) => {
    const volume = useAudioSettingsStore(state => state.volume);
    const trackRef = useRef<HTMLDivElement>(null);
    const [sliderVolume, setSliderVolume] = useState(volume);
    const isDraggingRef = useRef(false);
    const isHorizontal = orientation === 'horizontal';

    // 外部改动（命令面板、侧边面板、键盘）时同步；拖动中不覆盖本地值。
    useEffect(() => {
        if (!isDraggingRef.current) {
            setSliderVolume(volume);
        }
    }, [volume]);

    // 指针换算成 0-1：竖向越靠上音量越大，横向越靠右音量越大。
    const volumeFromPointer = (clientX: number, clientY: number) => {
        const track = trackRef.current;
        if (!track) {
            return 0;
        }
        const rect = track.getBoundingClientRect();
        const ratio = isHorizontal
            ? (clientX - rect.left) / rect.width
            : (rect.bottom - clientY) / rect.height;
        return Math.min(1, Math.max(0, ratio));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) {
            return;
        }
        isDraggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        const next = volumeFromPointer(e.clientX, e.clientY);
        setSliderVolume(next);
        previewVolume(next);
        onPreview?.(next);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) {
            return;
        }
        const next = volumeFromPointer(e.clientX, e.clientY);
        setSliderVolume(next);
        previewVolume(next);
        onPreview?.(next);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) {
            return;
        }
        isDraggingRef.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        handleSetVolume(volumeFromPointer(e.clientX, e.clientY));
    };

    // 键盘出口：方向键微调，Home/End 直接到 0 / 100，逐次落盘（键盘不涉及拖动中的高频 preview）。
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) {
            return;
        }
        const nudge = (delta: number) => {
            const next = Math.min(1, Math.max(0, sliderVolume + delta));
            setSliderVolume(next);
            handleSetVolume(next);
        };
        if (isHorizontal && e.key === 'ArrowRight') {
            e.preventDefault();
            nudge(0.05);
        } else if (isHorizontal && e.key === 'ArrowLeft') {
            e.preventDefault();
            nudge(-0.05);
        } else if (!isHorizontal && e.key === 'ArrowUp') {
            e.preventDefault();
            nudge(0.05);
        } else if (!isHorizontal && e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(-0.05);
        } else if (e.key === 'Home') {
            e.preventDefault();
            nudge(-1);
        } else if (e.key === 'End') {
            e.preventDefault();
            nudge(1);
        }
    };

    const fillPercent = Math.round(sliderVolume * 100);
    const hiddenPercent = (100 - fillPercent).toFixed(4);
    const sliderClass = isHorizontal
        ? 'relative h-6 w-24 shrink-0 cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40'
        : 'relative h-16 w-6 shrink-0 cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40';

    return (
        <div
            ref={trackRef}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={fillPercent}
            className={`${sliderClass} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
        >
            {/* 轨道：和进度条一样 6px 粗，居中于更宽的命中区。 */}
            <div
                className={isHorizontal
                    ? 'absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full'
                    : 'absolute left-1/2 top-0 bottom-0 w-1.5 -translate-x-1/2 rounded-full'}
                style={{ backgroundColor: trackColor }}
            />
            {/* 填充：竖向从底部向上、横向从左向右，用 clip-path 裁掉未填充段，剩一段带圆角头的填充。 */}
            <div
                className={`absolute rounded-full pointer-events-none ${isHorizontal
                    ? 'top-1/2 left-0 h-1.5 -translate-y-1/2'
                    : 'left-1/2 top-0 w-1.5 -translate-x-1/2'}`}
                style={{
                    backgroundColor: primaryColor,
                    width: isHorizontal ? '100%' : undefined,
                    height: isHorizontal ? undefined : '100%',
                    clipPath: isHorizontal
                        ? `inset(0 ${hiddenPercent}% 0 0 round 999px)`
                        : `inset(${hiddenPercent}% 0 0 0 round 999px)`,
                }}
            />
        </div>
    );
};

export default PlayerBarVolumeSlider;
