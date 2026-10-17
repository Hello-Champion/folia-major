// src/stores/usePlayerChromeSettingsStore.ts
// What the player page shows around the lyrics: the progress bar, the back and track-switch
// buttons, the titlebar, the transparent background and the auto-hide behaviour.
//
// Split out of useSettingsUiStore.

import { create } from 'zustand';
import i18n from '../i18n/config';
import {
    DEFAULT_PLAYER_CONTROL_SLOT_PRIMARY,
    DEFAULT_PLAYER_CONTROL_SLOT_SECONDARY,
    isPlayerControlSlotActionId,
    type PlayerControlSlotActionId,
} from '../types/playerControlSlots';
import { PLAYER_BOTTOM_BAR_BASE_OFFSET_PX } from '../utils/playerBottomBarLayout';
import { getStoredBoolean, setStoredBoolean } from './storagePrimitives';
import { setStatusMessage } from './useStatusMessageStore';

const PLAYER_BOTTOM_BAR_OFFSET_STORAGE_KEY = 'player_bottom_bar_offset';
const PLAYER_CONTROL_SLOT_PRIMARY_STORAGE_KEY = 'player_control_slot_primary';
const PLAYER_CONTROL_SLOT_SECONDARY_STORAGE_KEY = 'player_control_slot_secondary';
const PLAYER_VOLUME_BUTTON_LAYOUT_STORAGE_KEY = 'player_volume_button_layout';
const PLAYER_BOTTOM_BAR_GLASS_STORAGE_KEY = 'player_bottom_bar_glass';
const PLAYER_BOTTOM_BAR_GLASS_BLUR_STORAGE_KEY = 'player_bottom_bar_glass_blur';
const PLAYER_BOTTOM_BAR_GLASS_OPACITY_STORAGE_KEY = 'player_bottom_bar_glass_opacity';
const PLAYER_BOTTOM_BAR_GLASS_BRIGHTNESS_STORAGE_KEY = 'player_bottom_bar_glass_brightness';
const PLAYER_BOTTOM_BAR_GLASS_SATURATE_STORAGE_KEY = 'player_bottom_bar_glass_saturate';
const PLAYER_BOTTOM_BAR_GLASS_GLOW_STORAGE_KEY = 'player_bottom_bar_glass_glow';
const GLOBAL_GLASS_ENABLED_STORAGE_KEY = 'global_glass_enabled';
const GLOBAL_GLASS_BLUR_STORAGE_KEY = 'global_glass_blur';
const GLOBAL_GLASS_OPACITY_STORAGE_KEY = 'global_glass_opacity';
const GLOBAL_GLASS_BRIGHTNESS_STORAGE_KEY = 'global_glass_brightness';
const GLOBAL_GLASS_SATURATE_STORAGE_KEY = 'global_glass_saturate';
const GLOBAL_GLASS_GLOW_STORAGE_KEY = 'global_glass_glow';
/** 开屏动画开关：启动时是否显示 index.html 内联的 Folia 标题与波形遮罩。 */
const SHOW_SPLASH_ANIMATION_STORAGE_KEY = 'show_splash_animation';

/** 玻璃参数默认值：与 playerBarGlass.ts 里复刻 Mineradio 的原始配方一致。 */
export const DEFAULT_GLASS_BLUR_PX = 12;
export const DEFAULT_GLASS_OPACITY_PERCENT = 10;
export const DEFAULT_GLASS_BRIGHTNESS = 1.16;
export const DEFAULT_GLASS_SATURATE = 1.8;
export const DEFAULT_GLASS_GLOW = 0.16;

const GLASS_BLUR_MIN_PX = 0;
const GLASS_BLUR_MAX_PX = 48;
const GLASS_OPACITY_MIN_PERCENT = 0;
const GLASS_OPACITY_MAX_PERCENT = 100;
const GLASS_BRIGHTNESS_MIN = 0.3;
const GLASS_BRIGHTNESS_MAX = 2.5;
const GLASS_SATURATE_MIN = 0.5;
const GLASS_SATURATE_MAX = 3;
const GLASS_GLOW_MIN = 0;
const GLASS_GLOW_MAX = 0.5;

/** 音量按钮在底部控制条上的位置。 */
export type PlayerVolumeButtonLayout = 'row' | 'corner';

/** 读取持久化的有限数值；缺省或越界时回退到 fallback，并夹在 [min, max] 内。 */
const readStoredNumber = (key: string, fallback: number, min: number, max: number): number => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    const parsed = parseFloat(localStorage.getItem(key) ?? '');
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
};

const writeStoredNumber = (key: string, value: number): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, String(value));
    }
};

/** 全局玻璃开关：无独立记录时跟随底部玻璃开关，避免迁移后全局玻璃行为突变。 */
const readStoredGlobalGlassEnabled = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    const saved = localStorage.getItem(GLOBAL_GLASS_ENABLED_STORAGE_KEY);
    if (saved !== null) {
        return saved === 'true';
    }
    return localStorage.getItem(PLAYER_BOTTOM_BAR_GLASS_STORAGE_KEY) === 'true';
};

const isPlayerVolumeButtonLayout = (value: string | null): value is PlayerVolumeButtonLayout =>
    value === 'row' || value === 'corner';

/** row = 与进度条同一排（进度条右侧）；corner = 展开态右上角槽位。默认 row，与用户当前看到的布局一致。 */
const readStoredVolumeButtonLayout = (): PlayerVolumeButtonLayout => {
    if (typeof window === 'undefined') {
        return 'row';
    }
    const saved = localStorage.getItem(PLAYER_VOLUME_BUTTON_LAYOUT_STORAGE_KEY);
    return isPlayerVolumeButtonLayout(saved) ? saved : 'row';
};

/** Reads the persisted lower-bounded offset; the viewport-dependent upper bound is applied by consumers. */
const readStoredPlayerBottomBarOffset = (): number => {
    if (typeof window === 'undefined') {
        return PLAYER_BOTTOM_BAR_BASE_OFFSET_PX;
    }

    const parsed = parseFloat(localStorage.getItem(PLAYER_BOTTOM_BAR_OFFSET_STORAGE_KEY) ?? '');
    if (!Number.isFinite(parsed)) {
        return PLAYER_BOTTOM_BAR_BASE_OFFSET_PX;
    }

    return Math.max(PLAYER_BOTTOM_BAR_BASE_OFFSET_PX, Math.round(parsed));
};

const readStoredPlayerControlSlot = (
    key: string,
    fallback: PlayerControlSlotActionId,
): PlayerControlSlotActionId => {
    if (typeof window === 'undefined') {
        return fallback;
    }

    const saved = localStorage.getItem(key);
    return isPlayerControlSlotActionId(saved) ? saved : fallback;
};

export type PlayerChromeSettingsState = {
    hidePlayerProgressBar: boolean;
    playerBottomBarOffset: number;
    playerControlSlotPrimary: PlayerControlSlotActionId;
    playerControlSlotSecondary: PlayerControlSlotActionId;
    hidePlayerRightPanelButton: boolean;
    alwaysShowPlayerBackButton: boolean;
    alwaysShowTrackSwitchButtons: boolean;
    alwaysShowMainWindowTitlebar: boolean;
    hideFullscreenButton: boolean;
    useNativeMacFullscreenButton: boolean;
    transparentPlayerBackground: boolean;
    enablePlayerPageNativeBlur: boolean;
    autoHidePlayerChrome: boolean;
    autoHideCursorWithPlayerChrome: boolean;
    showOpenPanelCloseButton: boolean;
    /** 底部胶囊展开态右侧是否显示常驻的竖向音量滑块。默认关闭，和槽位里的音量按钮并存。 */
    showPlayerVolumeSlider: boolean;
    /** 音量按钮位置：row = 与进度条同一排（右侧）；corner = 展开态右上角槽位。 */
    volumeButtonLayout: PlayerVolumeButtonLayout;
    /** 底部控制条是否启用玻璃效果：更通透的底色 + 磨砂/饱和/增亮 + 白色内发光描边。 */
    playerBottomBarGlass: boolean;
    /** 底部控制条玻璃：磨砂强度（backdrop-filter 的 blur，px）。 */
    playerBottomBarGlassBlur: number;
    /** 底部控制条玻璃：底色不透明度（0-100，深色为黑、日间为白）。 */
    playerBottomBarGlassOpacity: number;
    /** 底部控制条玻璃：高亮倍率（backdrop-filter 的 brightness）。 */
    playerBottomBarGlassBrightness: number;
    /** 底部控制条玻璃：色彩饱和（backdrop-filter 的 saturate）。 */
    playerBottomBarGlassSaturate: number;
    /** 底部控制条玻璃：白色内发光描边强度（box-shadow 最内两层白色 alpha）。 */
    playerBottomBarGlassGlow: number;
    /** 全局玻璃效果（除底部控制条外的玻璃控件：搜索、弹窗、toast 等）是否启用。 */
    globalGlassEnabled: boolean;
    /** 全局玻璃：磨砂强度（px）。 */
    globalGlassBlur: number;
    /** 全局玻璃：底色不透明度（0-100）。 */
    globalGlassOpacity: number;
    /** 全局玻璃：高亮倍率。 */
    globalGlassBrightness: number;
    /** 全局玻璃：色彩饱和。 */
    globalGlassSaturate: number;
    /** 全局玻璃：白色内发光描边强度。 */
    globalGlassGlow: number;
    /** 开屏动画：启动时是否显示 Folia 标题与波形遮罩。默认开启。 */
    showSplashAnimation: boolean;
    setTransparentPlayerBackgroundFromSystem: (enabled: boolean) => void;
    handleTogglePlayerPageNativeBlur: (enable: boolean) => void;
    handleToggleHidePlayerProgressBar: (enable: boolean) => void;
    handleSetPlayerBottomBarOffset: (offsetPx: number) => void;
    handleSetPlayerControlSlot: (slot: 'primary' | 'secondary', actionId: PlayerControlSlotActionId) => void;
    handleToggleHidePlayerRightPanelButton: (enable: boolean) => void;
    handleToggleAlwaysShowPlayerBackButton: (enable: boolean) => void;
    handleToggleAlwaysShowTrackSwitchButtons: (enable: boolean) => void;
    handleToggleAlwaysShowMainWindowTitlebar: (enable: boolean) => void;
    handleToggleHideFullscreenButton: (enable: boolean) => void;
    handleToggleNativeMacFullscreenButton: (enable: boolean) => void;
    handleToggleTransparentPlayerBackground: (enable: boolean) => void;
    handleWallpaperTransparentRefused: () => void;
    handleToggleAutoHidePlayerChrome: (enable: boolean) => void;
    handleToggleAutoHideCursorWithPlayerChrome: (enable: boolean) => void;
    handleToggleOpenPanelCloseButton: (enable: boolean) => void;
    handleTogglePlayerVolumeSlider: (enable: boolean) => void;
    handleSetVolumeButtonLayout: (layout: PlayerVolumeButtonLayout) => void;
    handleTogglePlayerBottomBarGlass: (enable: boolean) => void;
    handleSetPlayerBottomBarGlassBlur: (blurPx: number) => void;
    handleSetPlayerBottomBarGlassOpacity: (opacityPercent: number) => void;
    handleSetPlayerBottomBarGlassBrightness: (brightness: number) => void;
    handleSetPlayerBottomBarGlassSaturate: (saturate: number) => void;
    handleSetPlayerBottomBarGlassGlow: (glow: number) => void;
    handleToggleGlobalGlass: (enable: boolean) => void;
    handleToggleShowSplashAnimation: (enable: boolean) => void;
    handleSetGlobalGlassBlur: (blurPx: number) => void;
    handleSetGlobalGlassOpacity: (opacityPercent: number) => void;
    handleSetGlobalGlassBrightness: (brightness: number) => void;
    handleSetGlobalGlassSaturate: (saturate: number) => void;
    handleSetGlobalGlassGlow: (glow: number) => void;
    /** 把底部控制条玻璃参数全部恢复为默认配方（blur 12px / 透明 10% / 高亮 1.16 / 饱和 1.8 / 描边 0.16）。 */
    handleResetPlayerBottomBarGlass: () => void;
    /** 把全局玻璃参数全部恢复为默认配方。 */
    handleResetGlobalGlass: () => void;
};

export const usePlayerChromeSettingsStore = create<PlayerChromeSettingsState>((set, get) => ({
    hidePlayerProgressBar: getStoredBoolean('hide_player_progress_bar', false),
    playerBottomBarOffset: readStoredPlayerBottomBarOffset(),
    playerControlSlotPrimary: readStoredPlayerControlSlot(
        PLAYER_CONTROL_SLOT_PRIMARY_STORAGE_KEY,
        DEFAULT_PLAYER_CONTROL_SLOT_PRIMARY,
    ),
    playerControlSlotSecondary: readStoredPlayerControlSlot(
        PLAYER_CONTROL_SLOT_SECONDARY_STORAGE_KEY,
        DEFAULT_PLAYER_CONTROL_SLOT_SECONDARY,
    ),
    hidePlayerRightPanelButton: getStoredBoolean('hide_player_right_panel_button', false),
    alwaysShowPlayerBackButton: getStoredBoolean('always_show_player_back_button', false),
    alwaysShowTrackSwitchButtons: getStoredBoolean('always_show_track_switch_buttons', false),
    alwaysShowMainWindowTitlebar: getStoredBoolean('always_show_main_window_titlebar', false),
    hideFullscreenButton: getStoredBoolean('hide_fullscreen_button', false),
    useNativeMacFullscreenButton: getStoredBoolean('use_native_mac_fullscreen_button', false),
    transparentPlayerBackground: getStoredBoolean('transparent_player_background', false),
    enablePlayerPageNativeBlur: getStoredBoolean('enable_player_page_native_blur', false),
    autoHidePlayerChrome: getStoredBoolean('auto_hide_player_chrome', false),
    // Rides the chrome auto-hide clock rather than owning one: the cursor goes away with the
    // controls it would have clicked. Opt-out, so auto-hide can keep the pointer if wanted.
    autoHideCursorWithPlayerChrome: getStoredBoolean('auto_hide_cursor_with_player_chrome', true),
    showOpenPanelCloseButton: getStoredBoolean('show_open_panel_close_button', true),
    showPlayerVolumeSlider: getStoredBoolean('show_player_volume_slider', false),
    volumeButtonLayout: readStoredVolumeButtonLayout(),
    playerBottomBarGlass: getStoredBoolean(PLAYER_BOTTOM_BAR_GLASS_STORAGE_KEY, false),
    playerBottomBarGlassBlur: readStoredNumber(PLAYER_BOTTOM_BAR_GLASS_BLUR_STORAGE_KEY, DEFAULT_GLASS_BLUR_PX, GLASS_BLUR_MIN_PX, GLASS_BLUR_MAX_PX),
    playerBottomBarGlassOpacity: readStoredNumber(PLAYER_BOTTOM_BAR_GLASS_OPACITY_STORAGE_KEY, DEFAULT_GLASS_OPACITY_PERCENT, GLASS_OPACITY_MIN_PERCENT, GLASS_OPACITY_MAX_PERCENT),
    playerBottomBarGlassBrightness: readStoredNumber(PLAYER_BOTTOM_BAR_GLASS_BRIGHTNESS_STORAGE_KEY, DEFAULT_GLASS_BRIGHTNESS, GLASS_BRIGHTNESS_MIN, GLASS_BRIGHTNESS_MAX),
    playerBottomBarGlassSaturate: readStoredNumber(PLAYER_BOTTOM_BAR_GLASS_SATURATE_STORAGE_KEY, DEFAULT_GLASS_SATURATE, GLASS_SATURATE_MIN, GLASS_SATURATE_MAX),
    playerBottomBarGlassGlow: readStoredNumber(PLAYER_BOTTOM_BAR_GLASS_GLOW_STORAGE_KEY, DEFAULT_GLASS_GLOW, GLASS_GLOW_MIN, GLASS_GLOW_MAX),
    globalGlassEnabled: readStoredGlobalGlassEnabled(),
    globalGlassBlur: readStoredNumber(GLOBAL_GLASS_BLUR_STORAGE_KEY, DEFAULT_GLASS_BLUR_PX, GLASS_BLUR_MIN_PX, GLASS_BLUR_MAX_PX),
    globalGlassOpacity: readStoredNumber(GLOBAL_GLASS_OPACITY_STORAGE_KEY, DEFAULT_GLASS_OPACITY_PERCENT, GLASS_OPACITY_MIN_PERCENT, GLASS_OPACITY_MAX_PERCENT),
    globalGlassBrightness: readStoredNumber(GLOBAL_GLASS_BRIGHTNESS_STORAGE_KEY, DEFAULT_GLASS_BRIGHTNESS, GLASS_BRIGHTNESS_MIN, GLASS_BRIGHTNESS_MAX),
    globalGlassSaturate: readStoredNumber(GLOBAL_GLASS_SATURATE_STORAGE_KEY, DEFAULT_GLASS_SATURATE, GLASS_SATURATE_MIN, GLASS_SATURATE_MAX),
    globalGlassGlow: readStoredNumber(GLOBAL_GLASS_GLOW_STORAGE_KEY, DEFAULT_GLASS_GLOW, GLASS_GLOW_MIN, GLASS_GLOW_MAX),
    showSplashAnimation: getStoredBoolean(SHOW_SPLASH_ANIMATION_STORAGE_KEY, true),
    setTransparentPlayerBackgroundFromSystem: (enabled) => {
        setStoredBoolean('transparent_player_background', enabled);
        set({ transparentPlayerBackground: enabled });
    },
    handleTogglePlayerPageNativeBlur: (enable) => {
        setStoredBoolean('enable_player_page_native_blur', enable);
        set({ enablePlayerPageNativeBlur: enable });
        if (window.electron?.saveSettings) {
            void window.electron.saveSettings('enable_player_page_native_blur', enable);
        }
    },
    handleToggleAutoHidePlayerChrome: (enabled: boolean) => {
        localStorage.setItem('auto_hide_player_chrome', enabled ? 'true' : 'false');
        set({ autoHidePlayerChrome: enabled });
    },
    handleToggleAutoHideCursorWithPlayerChrome: (enable) => {
        setStoredBoolean('auto_hide_cursor_with_player_chrome', enable);
        set({ autoHideCursorWithPlayerChrome: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'cursorAutoHideOn' : 'cursorAutoHideOff')),
        });
    },
    handleToggleHidePlayerProgressBar: (enable) => {
        setStoredBoolean('hide_player_progress_bar', enable);
        set({ hidePlayerProgressBar: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'progressBarHidden' : 'progressBarShown')),
        });
    },
    handleSetPlayerBottomBarOffset: (offsetPx) => {
        const next = Number.isFinite(offsetPx)
            ? Math.max(PLAYER_BOTTOM_BAR_BASE_OFFSET_PX, Math.round(offsetPx))
            : PLAYER_BOTTOM_BAR_BASE_OFFSET_PX;
        if (typeof window !== 'undefined') {
            localStorage.setItem(PLAYER_BOTTOM_BAR_OFFSET_STORAGE_KEY, String(next));
        }
        set({ playerBottomBarOffset: next });
    },
    handleSetPlayerControlSlot: (slot, actionId) => {
        if (!isPlayerControlSlotActionId(actionId)) {
            return;
        }
        const key = slot === 'primary'
            ? PLAYER_CONTROL_SLOT_PRIMARY_STORAGE_KEY
            : PLAYER_CONTROL_SLOT_SECONDARY_STORAGE_KEY;
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, actionId);
        }
        set(slot === 'primary'
            ? { playerControlSlotPrimary: actionId }
            : { playerControlSlotSecondary: actionId });
    },
    handleToggleAlwaysShowPlayerBackButton: (enable) => {
        setStoredBoolean('always_show_player_back_button', enable);
        set({ alwaysShowPlayerBackButton: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'playerBackButtonAlwaysShown' : 'playerBackButtonAutoHidden')),
        });
    },
    handleToggleAlwaysShowTrackSwitchButtons: (enable) => {
        setStoredBoolean('always_show_track_switch_buttons', enable);
        set({ alwaysShowTrackSwitchButtons: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'trackSwitchButtonsAlwaysShown' : 'trackSwitchButtonsAutoHidden')),
        });
    },
    handleToggleAlwaysShowMainWindowTitlebar: (enable) => {
        setStoredBoolean('always_show_main_window_titlebar', enable);
        set({ alwaysShowMainWindowTitlebar: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'mainWindowTitlebarAlwaysShown' : 'mainWindowTitlebarAutoHidden')),
        });
    },
    handleToggleHideFullscreenButton: (enable) => {
        setStoredBoolean('hide_fullscreen_button', enable);
        set({ hideFullscreenButton: enable });
    },
    handleToggleNativeMacFullscreenButton: (enable) => {
        setStoredBoolean('use_native_mac_fullscreen_button', enable);
        set({ useNativeMacFullscreenButton: enable });
    },
    handleToggleHidePlayerRightPanelButton: (enable) => {
        setStoredBoolean('hide_player_right_panel_button', enable);
        set({ hidePlayerRightPanelButton: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'rightBtnHidden' : 'rightBtnShown')),
        });
    },
    handleToggleTransparentPlayerBackground: (enable) => {
        setStoredBoolean('transparent_player_background', enable);
        set({ transparentPlayerBackground: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'transparentBgOn' : 'transparentBgOff')),
        });
    },
    // Main-process guard fired the refusal (classic Windows wallpaper mode cannot present a
    // transparent wallpaper window): surface why the toggle did not take effect.
    handleWallpaperTransparentRefused: () => {
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.transparentBgWallpaperUnsupported'),
        });
    },
    handleToggleOpenPanelCloseButton: (enable) => {
        setStoredBoolean('show_open_panel_close_button', enable);
        set({ showOpenPanelCloseButton: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'panelCloseBtnShown' : 'panelCloseBtnHidden')),
        });
    },
    handleTogglePlayerVolumeSlider: (enable) => {
        setStoredBoolean('show_player_volume_slider', enable);
        set({ showPlayerVolumeSlider: enable });
    },
    handleSetVolumeButtonLayout: (layout) => {
        if (!isPlayerVolumeButtonLayout(layout)) {
            return;
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem(PLAYER_VOLUME_BUTTON_LAYOUT_STORAGE_KEY, layout);
        }
        set({ volumeButtonLayout: layout });
    },
    handleTogglePlayerBottomBarGlass: (enable) => {
        setStoredBoolean(PLAYER_BOTTOM_BAR_GLASS_STORAGE_KEY, enable);
        set({ playerBottomBarGlass: enable });
    },
    handleSetPlayerBottomBarGlassBlur: (blurPx) => {
        const next = Math.min(GLASS_BLUR_MAX_PX, Math.max(GLASS_BLUR_MIN_PX, blurPx));
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_BLUR_STORAGE_KEY, next);
        set({ playerBottomBarGlassBlur: next });
    },
    handleSetPlayerBottomBarGlassOpacity: (opacityPercent) => {
        const next = Math.min(GLASS_OPACITY_MAX_PERCENT, Math.max(GLASS_OPACITY_MIN_PERCENT, opacityPercent));
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_OPACITY_STORAGE_KEY, next);
        set({ playerBottomBarGlassOpacity: next });
    },
    handleSetPlayerBottomBarGlassBrightness: (brightness) => {
        const next = Math.min(GLASS_BRIGHTNESS_MAX, Math.max(GLASS_BRIGHTNESS_MIN, brightness));
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_BRIGHTNESS_STORAGE_KEY, next);
        set({ playerBottomBarGlassBrightness: next });
    },
    handleSetPlayerBottomBarGlassSaturate: (saturate) => {
        const next = Math.min(GLASS_SATURATE_MAX, Math.max(GLASS_SATURATE_MIN, saturate));
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_SATURATE_STORAGE_KEY, next);
        set({ playerBottomBarGlassSaturate: next });
    },
    handleSetPlayerBottomBarGlassGlow: (glow) => {
        const next = Math.min(GLASS_GLOW_MAX, Math.max(GLASS_GLOW_MIN, glow));
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_GLOW_STORAGE_KEY, next);
        set({ playerBottomBarGlassGlow: next });
    },
    handleToggleGlobalGlass: (enable) => {
        setStoredBoolean(GLOBAL_GLASS_ENABLED_STORAGE_KEY, enable);
        set({ globalGlassEnabled: enable });
    },
    handleToggleShowSplashAnimation: (enable) => {
        setStoredBoolean(SHOW_SPLASH_ANIMATION_STORAGE_KEY, enable);
        set({ showSplashAnimation: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'splashAnimationOn' : 'splashAnimationOff')),
        });
    },
    handleSetGlobalGlassBlur: (blurPx) => {
        const next = Math.min(GLASS_BLUR_MAX_PX, Math.max(GLASS_BLUR_MIN_PX, blurPx));
        writeStoredNumber(GLOBAL_GLASS_BLUR_STORAGE_KEY, next);
        set({ globalGlassBlur: next });
    },
    handleSetGlobalGlassOpacity: (opacityPercent) => {
        const next = Math.min(GLASS_OPACITY_MAX_PERCENT, Math.max(GLASS_OPACITY_MIN_PERCENT, opacityPercent));
        writeStoredNumber(GLOBAL_GLASS_OPACITY_STORAGE_KEY, next);
        set({ globalGlassOpacity: next });
    },
    handleSetGlobalGlassBrightness: (brightness) => {
        const next = Math.min(GLASS_BRIGHTNESS_MAX, Math.max(GLASS_BRIGHTNESS_MIN, brightness));
        writeStoredNumber(GLOBAL_GLASS_BRIGHTNESS_STORAGE_KEY, next);
        set({ globalGlassBrightness: next });
    },
    handleSetGlobalGlassSaturate: (saturate) => {
        const next = Math.min(GLASS_SATURATE_MAX, Math.max(GLASS_SATURATE_MIN, saturate));
        writeStoredNumber(GLOBAL_GLASS_SATURATE_STORAGE_KEY, next);
        set({ globalGlassSaturate: next });
    },
    handleSetGlobalGlassGlow: (glow) => {
        const next = Math.min(GLASS_GLOW_MAX, Math.max(GLASS_GLOW_MIN, glow));
        writeStoredNumber(GLOBAL_GLASS_GLOW_STORAGE_KEY, next);
        set({ globalGlassGlow: next });
    },
    handleResetPlayerBottomBarGlass: () => {
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_BLUR_STORAGE_KEY, DEFAULT_GLASS_BLUR_PX);
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_OPACITY_STORAGE_KEY, DEFAULT_GLASS_OPACITY_PERCENT);
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_BRIGHTNESS_STORAGE_KEY, DEFAULT_GLASS_BRIGHTNESS);
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_SATURATE_STORAGE_KEY, DEFAULT_GLASS_SATURATE);
        writeStoredNumber(PLAYER_BOTTOM_BAR_GLASS_GLOW_STORAGE_KEY, DEFAULT_GLASS_GLOW);
        set({
            playerBottomBarGlassBlur: DEFAULT_GLASS_BLUR_PX,
            playerBottomBarGlassOpacity: DEFAULT_GLASS_OPACITY_PERCENT,
            playerBottomBarGlassBrightness: DEFAULT_GLASS_BRIGHTNESS,
            playerBottomBarGlassSaturate: DEFAULT_GLASS_SATURATE,
            playerBottomBarGlassGlow: DEFAULT_GLASS_GLOW,
        });
    },
    handleResetGlobalGlass: () => {
        writeStoredNumber(GLOBAL_GLASS_BLUR_STORAGE_KEY, DEFAULT_GLASS_BLUR_PX);
        writeStoredNumber(GLOBAL_GLASS_OPACITY_STORAGE_KEY, DEFAULT_GLASS_OPACITY_PERCENT);
        writeStoredNumber(GLOBAL_GLASS_BRIGHTNESS_STORAGE_KEY, DEFAULT_GLASS_BRIGHTNESS);
        writeStoredNumber(GLOBAL_GLASS_SATURATE_STORAGE_KEY, DEFAULT_GLASS_SATURATE);
        writeStoredNumber(GLOBAL_GLASS_GLOW_STORAGE_KEY, DEFAULT_GLASS_GLOW);
        set({
            globalGlassBlur: DEFAULT_GLASS_BLUR_PX,
            globalGlassOpacity: DEFAULT_GLASS_OPACITY_PERCENT,
            globalGlassBrightness: DEFAULT_GLASS_BRIGHTNESS,
            globalGlassSaturate: DEFAULT_GLASS_SATURATE,
            globalGlassGlow: DEFAULT_GLASS_GLOW,
        });
    },
}));

/**
 * The PlayerChromeSettings half of the former settings snapshot, for the surfaces that
 * legitimately edit this whole domain at once. Ordinary consumers select one field instead.
 */
export const selectPlayerChromeSettingsSnapshot = (state: PlayerChromeSettingsState) => ({
    hidePlayerProgressBar: state.hidePlayerProgressBar,
    playerBottomBarOffset: state.playerBottomBarOffset,
    playerControlSlotPrimary: state.playerControlSlotPrimary,
    playerControlSlotSecondary: state.playerControlSlotSecondary,
    hidePlayerRightPanelButton: state.hidePlayerRightPanelButton,
    alwaysShowPlayerBackButton: state.alwaysShowPlayerBackButton,
    alwaysShowTrackSwitchButtons: state.alwaysShowTrackSwitchButtons,
    alwaysShowMainWindowTitlebar: state.alwaysShowMainWindowTitlebar,
    hideFullscreenButton: state.hideFullscreenButton,
    useNativeMacFullscreenButton: state.useNativeMacFullscreenButton,
    transparentPlayerBackground: state.transparentPlayerBackground,
    enablePlayerPageNativeBlur: state.enablePlayerPageNativeBlur,
    autoHidePlayerChrome: state.autoHidePlayerChrome,
    autoHideCursorWithPlayerChrome: state.autoHideCursorWithPlayerChrome,
    showOpenPanelCloseButton: state.showOpenPanelCloseButton,
    showPlayerVolumeSlider: state.showPlayerVolumeSlider,
    volumeButtonLayout: state.volumeButtonLayout,
    playerBottomBarGlass: state.playerBottomBarGlass,
    playerBottomBarGlassBlur: state.playerBottomBarGlassBlur,
    playerBottomBarGlassOpacity: state.playerBottomBarGlassOpacity,
    playerBottomBarGlassBrightness: state.playerBottomBarGlassBrightness,
    playerBottomBarGlassSaturate: state.playerBottomBarGlassSaturate,
    playerBottomBarGlassGlow: state.playerBottomBarGlassGlow,
    globalGlassEnabled: state.globalGlassEnabled,
    globalGlassBlur: state.globalGlassBlur,
    globalGlassOpacity: state.globalGlassOpacity,
    globalGlassBrightness: state.globalGlassBrightness,
    globalGlassSaturate: state.globalGlassSaturate,
    globalGlassGlow: state.globalGlassGlow,
    showSplashAnimation: state.showSplashAnimation,
    handleToggleHidePlayerProgressBar: state.handleToggleHidePlayerProgressBar,
    handleSetPlayerBottomBarOffset: state.handleSetPlayerBottomBarOffset,
    handleSetPlayerControlSlot: state.handleSetPlayerControlSlot,
    handleToggleHidePlayerRightPanelButton: state.handleToggleHidePlayerRightPanelButton,
    handleToggleAlwaysShowPlayerBackButton: state.handleToggleAlwaysShowPlayerBackButton,
    handleToggleAlwaysShowTrackSwitchButtons: state.handleToggleAlwaysShowTrackSwitchButtons,
    handleToggleAlwaysShowMainWindowTitlebar: state.handleToggleAlwaysShowMainWindowTitlebar,
    handleToggleHideFullscreenButton: state.handleToggleHideFullscreenButton,
    handleToggleNativeMacFullscreenButton: state.handleToggleNativeMacFullscreenButton,
    handleToggleTransparentPlayerBackground: state.handleToggleTransparentPlayerBackground,
    setTransparentPlayerBackgroundFromSystem: state.setTransparentPlayerBackgroundFromSystem,
    handleTogglePlayerPageNativeBlur: state.handleTogglePlayerPageNativeBlur,
    handleToggleAutoHidePlayerChrome: state.handleToggleAutoHidePlayerChrome,
    handleToggleAutoHideCursorWithPlayerChrome: state.handleToggleAutoHideCursorWithPlayerChrome,
    handleToggleOpenPanelCloseButton: state.handleToggleOpenPanelCloseButton,
    handleTogglePlayerVolumeSlider: state.handleTogglePlayerVolumeSlider,
    handleSetVolumeButtonLayout: state.handleSetVolumeButtonLayout,
    handleTogglePlayerBottomBarGlass: state.handleTogglePlayerBottomBarGlass,
    handleSetPlayerBottomBarGlassBlur: state.handleSetPlayerBottomBarGlassBlur,
    handleSetPlayerBottomBarGlassOpacity: state.handleSetPlayerBottomBarGlassOpacity,
    handleSetPlayerBottomBarGlassBrightness: state.handleSetPlayerBottomBarGlassBrightness,
    handleSetPlayerBottomBarGlassSaturate: state.handleSetPlayerBottomBarGlassSaturate,
    handleSetPlayerBottomBarGlassGlow: state.handleSetPlayerBottomBarGlassGlow,
    handleToggleGlobalGlass: state.handleToggleGlobalGlass,
    handleToggleShowSplashAnimation: state.handleToggleShowSplashAnimation,
    handleSetGlobalGlassBlur: state.handleSetGlobalGlassBlur,
    handleSetGlobalGlassOpacity: state.handleSetGlobalGlassOpacity,
    handleSetGlobalGlassBrightness: state.handleSetGlobalGlassBrightness,
    handleSetGlobalGlassSaturate: state.handleSetGlobalGlassSaturate,
    handleSetGlobalGlassGlow: state.handleSetGlobalGlassGlow,
    handleWallpaperTransparentRefused: state.handleWallpaperTransparentRefused,
});
