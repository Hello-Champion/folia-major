// src/stores/useThemeSettingsStore.ts
// Day/night mode and the background-derivation switches.
//
// Split out of useSettingsUiStore so the theme has one owner. Consumers deliberately keep
// receiving isDaylight as a prop for now: it is read in 187 files, and giving each of them its
// own subscription would wake 187 components on every toggle without removing the re-render.
// Changing how it is consumed is a separate, one-shot migration.
//
// @note default_theme_daylight、home_theme_daylight、player_theme_daylight（OBS 链接另有 isDaylight 参数）、disable_home_dynamic_background（以及只在迁移时读的旧键 enable_home_dynamic_background） 是用户明确决定「不进外观配置导入导出」的设置（2026-11-08）：配置码也用于 web 版 OBS 链接，
// 只加 OBS 页面看得到的，这些在 OBS 页面上看不到。不要按 settings-feature-integration「视觉设置必须进
// buildCurrentConfig / compressConfig / decompressConfig / validKeys / handleImportConfig」的规则把它们补进短码或 JSON。

import { create } from 'zustand';
import i18n from '../i18n/config';

import { getStoredBoolean, setStoredBoolean } from './storagePrimitives';
import { setStatusMessage } from './useStatusMessageStore';
import { isPerfCheckSurface } from '../utils/appSurface';

export const FOLLOW_SYSTEM_THEME_STORAGE_KEY = 'follow_system_theme';

export const readSystemThemeIsDaylight = (): boolean | null => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: light)').matches;
};

const initialFollowSystemTheme = getStoredBoolean(FOLLOW_SYSTEM_THEME_STORAGE_KEY, false);
const initialStoredDaylight = getStoredBoolean('default_theme_daylight', false);
const initialDaylight = initialFollowSystemTheme
    ? (readSystemThemeIsDaylight() ?? initialStoredDaylight)
    : initialStoredDaylight;
// 首页（资料库墙）与播放页各记一份明暗偏好；旧键 default_theme_daylight 保持在两者之间同步写入，
// 老版本、设置页与命令面板改它时两边一起变。
const HOME_DAYLIGHT_KEY = 'home_theme_daylight';
const PLAYER_AUTO_DAYLIGHT_KEY = 'player_auto_daylight';
const PLAYER_DAYLIGHT_KEY = 'player_theme_daylight';
const initialHomeDaylight = getStoredBoolean(HOME_DAYLIGHT_KEY, initialStoredDaylight);
const initialPlayerDaylight = getStoredBoolean(PLAYER_DAYLIGHT_KEY, initialStoredDaylight);

const readStoredDisableHomeDynamicBackground = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const saved = localStorage.getItem('disable_home_dynamic_background');
    if (saved !== null) {
        return saved === 'true';
    }

    const legacySaved = localStorage.getItem('enable_home_dynamic_background');
    if (legacySaved !== null) {
        return legacySaved !== 'true';

    }

    return false;
};

export type ThemeSettingsState = {
    useCoverColorBg: boolean;
    staticMode: boolean;
    disableHomeDynamicBackground: boolean;
    isDaylight: boolean;
    /** 首页（含 Lattice 歌曲墙）自己的明暗偏好：切回首页时主题换成它。 */
    homeDaylight: boolean;
    /** 播放页自己的明暗偏好：切到播放页时主题换成它。 */
    playerDaylight: boolean;
    /** 播放页「自动」：按当前封面的深浅决定明暗（system-follow 优先）。 */
    playerDaylightAuto: boolean;
    followSystemTheme: boolean;
    handleToggleCoverColorBg: (enable: boolean) => void;
    handleToggleStaticMode: (enable: boolean) => void;
    handleToggleDisableHomeDynamicBackground: (disable: boolean) => void;
    setDaylightPreference: (isDaylight: boolean) => void;
    /** 某一页上手动切换明暗：只改那一页的偏好（跟随系统会因此关掉）。 */
    setPageDaylight: (page: 'home' | 'player', isDaylight: boolean) => void;
    setPlayerDaylightAuto: (enabled: boolean) => void;
    /** 切页时把主题换成那一页的偏好（跟随系统时不动）。 */
    syncDaylightToPage: (page: 'home' | 'player') => void;
    setDaylightPreferenceFromSystem: (isDaylight: boolean) => void;
    setFollowSystemTheme: (enabled: boolean) => void;
};

export const useThemeSettingsStore = create<ThemeSettingsState>((set, get) => ({
    useCoverColorBg: getStoredBoolean('use_cover_color_bg', false),
    staticMode: getStoredBoolean('static_mode', false),
    disableHomeDynamicBackground: readStoredDisableHomeDynamicBackground(),
    followSystemTheme: initialFollowSystemTheme,
    isDaylight: initialDaylight,
    homeDaylight: initialHomeDaylight,
    playerDaylight: initialPlayerDaylight,
    playerDaylightAuto: getStoredBoolean(PLAYER_AUTO_DAYLIGHT_KEY, false),
    handleToggleCoverColorBg: (enable) => {
        setStoredBoolean('use_cover_color_bg', enable);
        set({ useCoverColorBg: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'coverColorAdded' : 'coverColorDefault')),
        });
    },
    handleToggleStaticMode: (enable) => {
        setStoredBoolean('static_mode', enable);
        set({ staticMode: enable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (enable ? 'staticModeOn' : 'staticModeOff')),
        });
    },
    handleToggleDisableHomeDynamicBackground: (disable) => {
        setStoredBoolean('disable_home_dynamic_background', disable);
        set({ disableHomeDynamicBackground: disable });
        setStatusMessage({
            type: 'info',
            text: i18n.t('notifications.' + (disable ? 'homeBgDisabled' : 'homeBgEnabled')),
        });
    },
    // System updates are kept separate from the manual setter so a user click can disable auto-follow.
    setDaylightPreferenceFromSystem: (enabled) => {
        if (!get().followSystemTheme) {
            return;
        }

        setStoredBoolean('default_theme_daylight', enabled);
        set({ isDaylight: enabled });
        if (typeof window !== 'undefined' && window.electron?.setNativeTheme) {
            void window.electron.setNativeTheme('system');
        }
    },
    setFollowSystemTheme: (enabled) => {
        setStoredBoolean(FOLLOW_SYSTEM_THEME_STORAGE_KEY, enabled);
        set({ followSystemTheme: enabled });

        if (typeof window !== 'undefined' && window.electron?.setNativeTheme) {
            void window.electron.setNativeTheme(enabled ? 'system' : (get().isDaylight ? 'light' : 'dark'));
        }

        if (enabled) {
            const systemThemeIsDaylight = readSystemThemeIsDaylight();
            if (systemThemeIsDaylight !== null) {
                get().setDaylightPreferenceFromSystem(systemThemeIsDaylight);
            }
        }
    },
    // 设置页、命令面板这类全局入口改的是两边一起：两页都换成同一个模式。
    setDaylightPreference: (enabled) => {
        const wasFollowingSystem = get().followSystemTheme;
        if (wasFollowingSystem) {
            setStoredBoolean(FOLLOW_SYSTEM_THEME_STORAGE_KEY, false);
        }
        setStoredBoolean('default_theme_daylight', enabled);
        setStoredBoolean(HOME_DAYLIGHT_KEY, enabled);
        setStoredBoolean(PLAYER_DAYLIGHT_KEY, enabled);
        setStoredBoolean(PLAYER_AUTO_DAYLIGHT_KEY, false);
        set({
            isDaylight: enabled,
            homeDaylight: enabled,
            playerDaylight: enabled,
            playerDaylightAuto: false,
            ...(wasFollowingSystem ? { followSystemTheme: false } : {}),
        });
        if (typeof window !== 'undefined' && window.electron?.setNativeTheme) {
            void window.electron.setNativeTheme(enabled ? 'light' : 'dark');
        }
    },
    setPageDaylight: (page, enabled) => {
        const wasFollowingSystem = get().followSystemTheme;
        if (wasFollowingSystem) {
            setStoredBoolean(FOLLOW_SYSTEM_THEME_STORAGE_KEY, false);
        }
        setStoredBoolean(page === 'player' ? PLAYER_DAYLIGHT_KEY : HOME_DAYLIGHT_KEY, enabled);
        setStoredBoolean('default_theme_daylight', enabled);
        set({
            isDaylight: enabled,
            ...(page === 'player' ? { playerDaylight: enabled } : { homeDaylight: enabled }),
            ...(wasFollowingSystem ? { followSystemTheme: false } : {}),
        });
        if (typeof window !== 'undefined' && window.electron?.setNativeTheme) {
            void window.electron.setNativeTheme(enabled ? 'light' : 'dark');
        }
    },
    setPlayerDaylightAuto: (enabled) => {
        setStoredBoolean(PLAYER_AUTO_DAYLIGHT_KEY, enabled);
        // 播放页的「自动（按画面深浅）」按画面自己切明暗，跟随系统开着就永远轮不到它。
        const wasFollowingSystem = enabled && get().followSystemTheme;
        if (wasFollowingSystem) {
            setStoredBoolean(FOLLOW_SYSTEM_THEME_STORAGE_KEY, false);
        }
        set({
            playerDaylightAuto: enabled,
            ...(wasFollowingSystem ? { followSystemTheme: false } : {}),
        });
        if (wasFollowingSystem && typeof window !== 'undefined' && window.electron?.setNativeTheme) {
            void window.electron.setNativeTheme(get().isDaylight ? 'light' : 'dark');
        }
    },
    syncDaylightToPage: (page) => {
        if (get().followSystemTheme) return;
        const enabled = page === 'player' ? get().playerDaylight : get().homeDaylight;
        if (get().isDaylight === enabled) return;
        set({ isDaylight: enabled });
        if (typeof window !== 'undefined' && window.electron?.setNativeTheme) {
            void window.electron.setNativeTheme(enabled ? 'light' : 'dark');
        }
    },
}));

/**
 * The ThemeSettings half of the former settings snapshot, for the surfaces that
 * legitimately edit this whole domain at once. Ordinary consumers select one field instead.
 */
export const selectThemeSettingsSnapshot = (state: ThemeSettingsState) => ({
    isDaylight: state.isDaylight,
    followSystemTheme: state.followSystemTheme,
    useCoverColorBg: state.useCoverColorBg,
    staticMode: state.staticMode,
    disableHomeDynamicBackground: state.disableHomeDynamicBackground,
    setDaylightPreference: state.setDaylightPreference,
    setDaylightPreferenceFromSystem: state.setDaylightPreferenceFromSystem,
    setFollowSystemTheme: state.setFollowSystemTheme,
    handleToggleCoverColorBg: state.handleToggleCoverColorBg,
    handleToggleStaticMode: state.handleToggleStaticMode,
    handleToggleDisableHomeDynamicBackground: state.handleToggleDisableHomeDynamicBackground,
});

// Seed Electron's native theme from the stored preference at startup. Lives here rather than in
// useSettingsUiStore because it reads nothing but this domain.
// Not from the performance check's window, which may not set it (the main window has, already).
if (typeof window !== 'undefined' && !isPerfCheckSurface && window.electron?.setNativeTheme) {
    const initialTheme = useThemeSettingsStore.getState();
    void window.electron.setNativeTheme(
        initialTheme.followSystemTheme ? 'system' : (initialTheme.isDaylight ? 'light' : 'dark'),
    );
}

// Module-level handle for the assembly layer; an action needs no subscription.
export const handleToggleCoverColorBg = (enable: boolean) => useThemeSettingsStore.getState().handleToggleCoverColorBg(enable);
