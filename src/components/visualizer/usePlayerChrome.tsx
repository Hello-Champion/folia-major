import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useWindowButtonsAtTopLeft } from '../../hooks/useWindowButtonsAtTopLeft';
import { usePlayerOverlayReservation } from '../../hooks/usePlayerOverlayLayout';
import type { FoliumLayoutRect } from '../../mods/folium/contract';
import { isMainAppSurface } from '../../utils/appSurface';
import { useIsPlayerBottomBarHost } from '../floating-player/PlayerBottomBarLayoutContext';
import { useGlobalGlassStyle } from '../../utils/playerBarGlass';
import type { VisualizerSharedProps } from './definition';

// src/components/visualizer/usePlayerChrome.tsx
// The player page's own chrome over the lyrics: the hover-only back button in the page's top-left
// corner, and the slide-to-palette guide on the panel button in its bottom-right one. What covers the
// whole page draws it: a lyric style's shell (VisualizerShell), or, while a scene shows, the scene's
// host (SceneHost), since a style the scene borrows lies on a surface (a cinema screen) whose corner is
// not the page's.

export type PlayerChromeProps = Pick<
    VisualizerSharedProps,
    'onBack' | 'isPanelOpen' | 'alwaysShowBackButton' | 'onPlayerPanelGuideHotspotChange' | 'isPreviewMode' | 'isDaylight'
>;

/** The props a style drawn on a scene's surface goes without: the scene's host draws the chrome. */
export const withoutPlayerChrome = <T extends PlayerChromeProps>(props: T): T => ({
    ...props,
    onBack: undefined,
    alwaysShowBackButton: undefined,
    onPlayerPanelGuideHotspotChange: undefined,
});

const PLAYER_CHROME_HOTSPOT_SIZE = 120;
// The panel button's corner is wider and taller than the back button's: the pointer finds the
// button (and the slide-to-palette guide on it) from further away, so the panel is easier to discover.
const PLAYER_PANEL_HOTSPOT_WIDTH = 240;
const PLAYER_PANEL_HOTSPOT_HEIGHT = 200;
const TOUCH_GUIDE_DISPLAY_MS = 1400;
const backRevealArea = (bounds: FoliumLayoutRect): FoliumLayoutRect => ({
    left: bounds.left, top: bounds.top,
    width: PLAYER_CHROME_HOTSPOT_SIZE, height: PLAYER_CHROME_HOTSPOT_SIZE,
});
const panelRevealArea = (bounds: FoliumLayoutRect): FoliumLayoutRect => ({
    left: bounds.left + bounds.width - PLAYER_PANEL_HOTSPOT_WIDTH,
    top: bounds.top + bounds.height - PLAYER_PANEL_HOTSPOT_HEIGHT,
    width: PLAYER_PANEL_HOTSPOT_WIDTH, height: PLAYER_PANEL_HOTSPOT_HEIGHT,
});

const isNearPlayerPanelHotspot = (clientX: number, clientY: number) => (
    typeof window !== 'undefined'
    && clientX >= window.innerWidth - PLAYER_PANEL_HOTSPOT_WIDTH
    && clientY >= window.innerHeight - PLAYER_PANEL_HOTSPOT_HEIGHT
);

export interface PlayerChromePointer {
    move: (event: { clientX: number; clientY: number }) => void;
    leave: () => void;
    down: (event: { pointerType: string; clientX: number; clientY: number }) => void;
    cancel: () => void;
}

/**
 * The chrome for a box that covers the player page: the handlers its box's pointer goes to, and the
 * back button to put in it (null without a back action). `enabled` false draws and reserves nothing.
 */
export const usePlayerChrome = (props: PlayerChromeProps | undefined, enabled = true) => {
    const { t } = useTranslation();
    const lowerBackButton = useWindowButtonsAtTopLeft();
    const [showBackButton, setShowBackButton] = useState(false);
    const backVisibilityRef = useRef(false);
    const isPlayerPage = useIsPlayerBottomBarHost();
    // 左上角返回按钮与底部控制台同族：全局玻璃开关打开时换用同一套 Mineradio 玻璃配方。
    const globalGlassStyle = useGlobalGlassStyle(props?.isDaylight ?? false);
    const playerPanelGuideHotspotRef = useRef(false);
    const touchGuideHideTimeoutRef = useRef<number | null>(null);
    const onBack = enabled ? props?.onBack : undefined;
    const isPanelOpen = props?.isPanelOpen ?? false;
    const onPlayerPanelGuideHotspotChange = enabled ? props?.onPlayerPanelGuideHotspotChange : undefined;
    const isBackButtonVisible = props?.alwaysShowBackButton || showBackButton;
    // Static visuals still have live native controls and an app.overlay layer.
    const publishLayout = enabled && isPlayerPage && !props?.isPreviewMode && isMainAppSurface;
    // Overlay content is outside this box; reserve the complete native reveal hot area.
    usePlayerOverlayReservation('back-reveal', 'navigation', backRevealArea, publishLayout && Boolean(onBack));
    usePlayerOverlayReservation('panel-reveal', 'panel', panelRevealArea, publishLayout && !isPanelOpen);

    const updateBackVisibility = useCallback((visible: boolean) => {
        if (backVisibilityRef.current === visible) return;
        backVisibilityRef.current = visible;
        setShowBackButton(visible);
    }, []);
    // 左上角热区：不只靠绘制这一层收到的 mousemove——场景、覆盖层在上面时事件到不了壳，按钮就一直不亮。
    // 在窗口上直接听鼠标位置，热区判断与 pointer.move 相同。
    useEffect(() => {
        if (!onBack) return undefined;
        const onWindowMove = (event: MouseEvent) => {
            updateBackVisibility(event.clientX <= PLAYER_CHROME_HOTSPOT_SIZE && event.clientY <= PLAYER_CHROME_HOTSPOT_SIZE);
        };
        window.addEventListener('mousemove', onWindowMove, { passive: true });
        return () => window.removeEventListener('mousemove', onWindowMove);
    }, [onBack, updateBackVisibility]);

    const updatePlayerPanelGuideHotspot = (isActive: boolean) => {
        if (playerPanelGuideHotspotRef.current === isActive) {
            return;
        }

        playerPanelGuideHotspotRef.current = isActive;
        onPlayerPanelGuideHotspotChange?.(isActive);
    };

    const clearTouchGuideHideTimeout = () => {
        if (touchGuideHideTimeoutRef.current === null) {
            return;
        }

        window.clearTimeout(touchGuideHideTimeoutRef.current);
        touchGuideHideTimeoutRef.current = null;
    };

    const showTouchPanelGuide = () => {
        clearTouchGuideHideTimeout();
        updatePlayerPanelGuideHotspot(true);
        touchGuideHideTimeoutRef.current = window.setTimeout(() => {
            touchGuideHideTimeoutRef.current = null;
            updatePlayerPanelGuideHotspot(false);
        }, TOUCH_GUIDE_DISPLAY_MS);
    };

    useEffect(() => () => {
        clearTouchGuideHideTimeout();
        if (playerPanelGuideHotspotRef.current) {
            playerPanelGuideHotspotRef.current = false;
            onPlayerPanelGuideHotspotChange?.(false);
        }
    }, [onPlayerPanelGuideHotspotChange]);

    const pointer: PlayerChromePointer = {
        move: (event) => {
            // Back button is intentionally hidden most of the time.
            // Only reveal it near the top-left hot area so it does not pollute the visual field.
            updateBackVisibility(event.clientX <= PLAYER_CHROME_HOTSPOT_SIZE && event.clientY <= PLAYER_CHROME_HOTSPOT_SIZE);

            updatePlayerPanelGuideHotspot(!isPanelOpen && isNearPlayerPanelHotspot(event.clientX, event.clientY));
        },
        leave: () => {
            updateBackVisibility(false);
            updatePlayerPanelGuideHotspot(false);
        },
        down: (event) => {
            if (isPanelOpen || event.pointerType !== 'touch' || !isNearPlayerPanelHotspot(event.clientX, event.clientY)) {
                return;
            }

            showTouchPanelGuide();
        },
        cancel: () => {
            clearTouchGuideHideTimeout();
            updatePlayerPanelGuideHotspot(false);
        },
    };

    const backButton = onBack ? (
        <motion.button
            type="button"
            aria-label={t('ui.backToHome')}
            initial={false}
            animate={{
                opacity: isBackButtonVisible ? 1 : 0,
                scale: isBackButtonVisible ? 1 : 0.92,
                x: isBackButtonVisible ? 0 : -6,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => {
                event.stopPropagation();
                onBack();
            }}
            className={`absolute ${lowerBackButton ? 'top-14' : 'top-[42px]'} left-6 z-30 h-11 w-11 rounded-full flex items-center justify-center transition-colors backdrop-blur-md text-white/60 pointer-events-auto ${
                globalGlassStyle ? '' : 'bg-black/20 hover:bg-white/10'
            }`}
            style={{ pointerEvents: isBackButtonVisible ? 'auto' : 'none', boxShadow: '0 10px 30px rgb(0 0 0 / 24%)', ...globalGlassStyle }}
        >
            <ChevronLeft size={22} />
        </motion.button>
    ) : null;

    return { pointer, backButton };
};
