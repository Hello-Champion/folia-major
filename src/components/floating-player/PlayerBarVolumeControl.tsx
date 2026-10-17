import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAudioSettingsStore } from '../../stores/useAudioSettingsStore';
import { usePlayerChromeSettingsStore, type PlayerVolumeButtonLayout } from '../../stores/usePlayerChromeSettingsStore';
import { useBottomBarGlassStyle } from '../../utils/playerBarGlass';
import PlayerBarVolumeSlider from './PlayerBarVolumeSlider';

// src/components/floating-player/PlayerBarVolumeControl.tsx
// 底部胶囊的音量小喇叭，点击调出音量滑块。
// corner（右上角槽位）：维持原有行为——在其上方浮出一条竖向滑块，带圆角胶囊外壳，portal 到 body。
// row（与进度条同一排）：点击后在按钮右侧内联展开一条横向滑块，无外层胶囊，宽度带动画展开/收起。
// row 模式位于胶囊右端独立扩展区（见 FloatingPlayerControls 的 ExpandedView），展开时胶囊整体向右
// 变长、进度条保持原宽不被压缩；收起后控制条宽度自动还原。
//
// 两个坑（corner 模式）：
// 1. portal 内容拿不到应用容器里的 CSS 变量（--text-primary 等），所以填充色要在这里解析成字面值。
// 2. 胶囊展开/收缩是 framer-motion 的 transform 动画，resize/scroll 监听不到，所以用 rAF 持续钉住位置。

interface PlayerBarVolumeControlProps {
    /** 拖动过程中的实时预览：只碰增益节点，不持久化。 */
    previewVolume: (volume: number) => void;
    primaryColor: string;
    trackColor?: string;
    isDaylight?: boolean;
    controlsDisabled?: boolean;
    /** 弹出层开合通知给父级，父级据此在播放中也不折叠胶囊，避免弹层一开胶囊就收起来。 */
    onOpenChange?: (open: boolean) => void;
    /** 音量按钮位置：corner = 右上角（原样式+竖向胶囊弹层）；row = 进度条旁（小按钮+内联横向滑块）。 */
    layout: PlayerVolumeButtonLayout;
}

const POPOVER_GAP = 8;
/** row 模式下内联横向滑块的展开宽度（滑块本体）。 */
const INLINE_SLIDER_WIDTH = 96;
/** row 模式下音量百分比数字 + 与滑块间距的宽度（gap-1=4px + w-[27px]），用于宽度动画的目标值。 */
const INLINE_PERCENT_WIDTH = 31;

const PlayerBarVolumeControl: React.FC<PlayerBarVolumeControlProps> = ({
    previewVolume,
    primaryColor,
    trackColor,
    isDaylight = false,
    controlsDisabled = false,
    onOpenChange,
    layout,
}) => {
    const { t } = useTranslation();
    const volume = useAudioSettingsStore(state => state.volume);
    const isMuted = useAudioSettingsStore(state => state.isMuted);
    // 与底部控制台同族：玻璃开关打开时，竖向音量弹层换用同一套 Mineradio 玻璃配方。
    const bottomBarGlassStyle = useBottomBarGlassStyle(isDaylight);
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    // row 模式内联滑块的容器：outside-click 判断用它划定「控件内部」的边界。
    const rowRef = useRef<HTMLDivElement>(null);
    // 滑块填充色：先存传入值，打开时若它是 CSS 变量，从按钮（在应用容器里）解析出字面值。
    const [fillColor, setFillColor] = useState(primaryColor);
    // row 模式内联滑块的实时显示值：拖动中走 onPreview，松手后由 store 同步。
    const [displayVolume, setDisplayVolume] = useState(volume);
    const isCorner = layout === 'corner';

    useEffect(() => {
        onOpenChange?.(open);
    }, [open, onOpenChange]);

    useEffect(() => {
        setDisplayVolume(volume);
    }, [volume]);

    // 仅 corner 模式需要 rAF 钉住 fixed 弹层位置；row 模式是内联布局，跟随文档流自动定位。
    useLayoutEffect(() => {
        if (isCorner && !open) {
            return;
        }
        if (!isCorner) {
            return;
        }
        const button = buttonRef.current;
        const popover = popoverRef.current;
        if (!button || !popover) {
            return;
        }

        if (primaryColor.startsWith('var(')) {
            setFillColor(getComputedStyle(button).color || primaryColor);
        } else {
            setFillColor(primaryColor);
        }

        // rAF 持续把弹出层钉在按钮正上方：胶囊宽度/位置随 layout 动画或窗口变化时跟着走。
        let raf = 0;
        const sync = () => {
            const rect = button.getBoundingClientRect();
            popover.style.left = `${rect.left + rect.width / 2}px`;
            popover.style.bottom = `${window.innerHeight - rect.top + POPOVER_GAP}px`;
            raf = requestAnimationFrame(sync);
        };
        sync();
        return () => cancelAnimationFrame(raf);
    }, [open, primaryColor, isCorner]);

    // 点击音量按钮 / 弹出层 / 内联滑块之外的任何地方时收起（corner 的 fixed 弹层与 row 的内联滑块都算）。
    // row 模式原本只有再点一次小喇叭才能收回（用户实测：点页面其他区域滑块还开着），
    // 失焦（点击别处）后应自动收回，让底部控制条回到最小状态。
    useEffect(() => {
        if (!open) {
            return;
        }
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target) || rowRef.current?.contains(target)) {
                return;
            }
            setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    const disabled = controlsDisabled;
    const Icon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
    // corner：保持原样式（展开/悬停时有圆形背景）；row：改小且无圆形背景，只靠透明度表达状态。
    const cornerStateClass = disabled
        ? 'cursor-not-allowed opacity-20'
        : open
            ? (isDaylight ? 'bg-black/10 text-black' : 'bg-white/20')
            : `opacity-40 hover:opacity-100 ${isDaylight ? 'hover:bg-black/5' : 'hover:bg-white/10'}`;
    const rowStateClass = disabled
        ? 'cursor-not-allowed opacity-20'
        : open
            ? 'opacity-100'
            : 'opacity-40 hover:opacity-100';

    const button = (
        <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                if (disabled) {
                    return;
                }
                setOpen(prev => !prev);
            }}
            disabled={disabled}
            aria-label={t('ui.volume')}
            aria-haspopup={isCorner ? 'dialog' : undefined}
            aria-expanded={open}
            title={t('ui.volume')}
            className={isCorner
                ? `rounded-full p-2 transition-colors ${cornerStateClass}`
                : `rounded-full p-1 transition-colors outline-none ${rowStateClass}`}
            style={{ color: primaryColor }}
        >
            <Icon size={isCorner ? 20 : 16} className={isCorner ? 'sm:h-[18px] sm:w-[18px]' : 'sm:h-[14px] sm:w-[14px]'} />
        </button>
    );

    return isCorner ? (
        <>
            {button}
            {typeof document !== 'undefined' && open && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-[70] rounded-full border px-2 py-3 shadow-2xl backdrop-blur-xl"
                    style={{
                        transform: 'translateX(-50%)',
                        // 背景颜色/透明度对齐底部控制台展开态（bg-black/40 / bg-white/60），别太黑。
                        ...(bottomBarGlassStyle ? {
                            ...bottomBarGlassStyle,
                            borderColor: isDaylight ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                        } : {
                            backgroundColor: isDaylight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
                            borderColor: isDaylight ? 'rgba(28,25,23,0.14)' : 'rgba(244,244,245,0.14)',
                        }),
                    }}
                >
                    <div className="flex flex-col items-center gap-1.5">
                        <PlayerBarVolumeSlider
                            previewVolume={previewVolume}
                            primaryColor={fillColor}
                            trackColor={trackColor}
                            disabled={disabled}
                            onPreview={setDisplayVolume}
                        />
                        <span
                            className="text-[10px] font-mono font-medium tabular-nums opacity-60"
                            style={{ color: fillColor }}
                        >
                            {Math.round(displayVolume * 100)}%
                        </span>
                    </div>
                </div>,
                document.body,
            )}
        </>
    ) : (
        <div
            ref={rowRef}
            className="flex items-center gap-2"
            // 行内滑块的拖拽/点击不能冒泡到胶囊的 onClick（否则松手会触发胶囊导航，回到拼贴墙）；
            // 进度条在 ProgressBar 里做同样的事。
            onClick={(e) => e.stopPropagation()}
        >
            {button}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: INLINE_SLIDER_WIDTH + INLINE_PERCENT_WIDTH, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="flex items-center gap-1 overflow-hidden"
                    >
                        {/* 内联展开：无外层胶囊，向右弹出；滑块与百分比贴近（gap-1），按钮与滑块组间隔较宽（gap-2）。 */}
                        <PlayerBarVolumeSlider
                            previewVolume={previewVolume}
                            primaryColor={primaryColor}
                            trackColor={trackColor}
                            disabled={disabled}
                            orientation="horizontal"
                            onPreview={setDisplayVolume}
                        />
                        <span
                            className="w-[27px] shrink-0 text-right text-[10px] font-mono font-medium tabular-nums opacity-60"
                            style={{ color: primaryColor }}
                        >
                            {Math.round(displayVolume * 100)}%
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlayerBarVolumeControl;
