import { afterEach, describe, expect, it, vi } from 'vitest';

// test/unit/theme/themeDaylightPerPage.test.ts
// 首页与播放页各记一份明暗偏好：切页时主题换成那一页的；跟随系统时不动；老键 default_theme_daylight 两份都当初始值。

let storage: Map<string, string>;

const loadStore = async (initial: Record<string, string> = {}) => {
    vi.resetModules();
    storage = new Map(Object.entries(initial));
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => { storage.set(key, value); },
        removeItem: (key: string) => { storage.delete(key); },
        clear: () => { storage.clear(); },
    });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    const module = await import('@/stores/useThemeSettingsStore');
    return module.useThemeSettingsStore;
};

afterEach(() => vi.unstubAllGlobals());

describe('per-page day/night preference', () => {
    it('keeps the home and the player page apart and follows the page on a switch', async () => {
        const store = await loadStore();
        const state = () => store.getState();

        state().setPageDaylight('player', true);
        expect(state().isDaylight).toBe(true);
        expect(state().playerDaylight).toBe(true);
        expect(state().homeDaylight).toBe(false);

        state().setPageDaylight('home', true);
        expect(state().isDaylight).toBe(true);
        state().setPageDaylight('home', false);
        expect(state().isDaylight).toBe(false);
        expect(state().playerDaylight).toBe(true);

        state().syncDaylightToPage('player');
        expect(state().isDaylight).toBe(true);
        state().syncDaylightToPage('home');
        expect(state().isDaylight).toBe(false);

        expect(storage.get('home_theme_daylight')).toBe('false');
        expect(storage.get('player_theme_daylight')).toBe('true');
    });

    it('starts both pages from the old key when the new ones were never written', async () => {
        const store = await loadStore({ default_theme_daylight: 'true' });
        expect(store.getState().homeDaylight).toBe(true);
        expect(store.getState().playerDaylight).toBe(true);
    });

    it('leaves the mode alone while the system is followed', async () => {
        const store = await loadStore({ follow_system_theme: 'true', home_theme_daylight: 'true', player_theme_daylight: 'false' });
        const before = store.getState().isDaylight;
        store.getState().syncDaylightToPage('player');
        expect(store.getState().isDaylight).toBe(before);
    });

    it('writes both pages when the global setter is used', async () => {
        const store = await loadStore();
        store.getState().setDaylightPreference(true);
        expect(store.getState().homeDaylight).toBe(true);
        expect(store.getState().playerDaylight).toBe(true);
        expect(storage.get('default_theme_daylight')).toBe('true');
    });
});
