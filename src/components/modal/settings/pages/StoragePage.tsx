import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LYRIC_EXPORT_COMMAND_ID } from '../../../command-palette/commands/lyricExportCommands';
import ConfirmDialog from '../../../shared/ConfirmDialog';
import { clearAllData } from '../../../../services/db';
import { openCommandPaletteCommand } from '../../../../stores/useAppViewStore';
import { useAudioSettingsStore } from '../../../../stores/useAudioSettingsStore';
import { closeSettings } from '../../../../stores/useSettingsModalStore';
import { Button, CopyValue, FoldedGroup, Group, Row, Select, Toggle, Value, useSettingsKitTheme, type SettingsOptionDef } from '../kit';
import { useSettingsPage } from './settingsPageContext';
import ConfigTransferRows from './storage/ConfigTransferRows';
import FolderWatchGroup from './storage/FolderWatchGroup';
import { BACKUP, CACHE_ROWS, CACHES, FACTORY, MEDIA, O } from './storage/options';

// src/components/modal/settings/pages/StoragePage.tsx
// The 存储与备份 page: what Folia keeps on disk and how to carry its look to another Folia. The
// song cache first (on or off, and in the desktop app where it is and how large it may grow), then
// what each kind of cache takes with a button to clear it, the watch on imported folders, and a
// folded group for copying and pasting the visual settings as a config code. The cache sizes and
// the cache folder are the settings dialog's own state.

export const OPTIONS: SettingsOptionDef[] = [...Object.values(O), ...CACHE_ROWS.map(row => row.option)];

// Zero is "no ceiling", which is a real answer rather than a missing one, so it gets a name.
const CACHE_LIMITS_GB = [1, 2, 5, 10, 20, 50, 0];

const StoragePage: React.FC = () => {
    const { t } = useTranslation();
    const { isElectron, viewProps } = useSettingsPage();
    const { isDaylight } = useSettingsKitTheme();
    const { cacheDirectory, cacheDirectoryIsDefault, cacheDirectoryStatus, cacheSizes, isCleaning, mediaCount, onChooseCacheDirectory, onClear } = viewProps.storage;
    const mediaCacheEnabled = useAudioSettingsStore(state => state.enableMediaCache);
    const setMediaCacheEnabled = useAudioSettingsStore(state => state.handleToggleMediaCache);
    const cacheLimitGb = useAudioSettingsStore(state => state.mediaCacheLimitGb);
    const setCacheLimitGb = useAudioSettingsStore(state => state.handleSetMediaCacheLimitGb);
    const [clearingAll, setClearingAll] = useState<'no' | 'asking' | 'running'>('no');
    const [factoryResetAsking, setFactoryResetAsking] = useState(false);

    // Everything the app stored goes, so it starts again from an empty state.
    const clearEverything = async () => {
        setClearingAll('running');
        await clearAllData();
        window.location.reload();
    };

    // 恢复出厂设置：清空 IndexedDB（缓存 / 本地库）与全部 localStorage 持久化设置后重载，
    // 让所有 store 回到初始默认值；各平台登录会话（online_provider:* 与旧版 cookie 键）保留，
    // 重置后无需重新登录。已在页面上的数据清不回去，所以先弹确认。
    const factoryReset = async () => {
        setFactoryResetAsking(false);
        try {
            await clearAllData();
        } catch (error) {
            console.error('[FactoryReset] Failed to clear database:', error);
        }
        try {
            const keptKeys = new Set<string>(['active_online_provider_id', 'netease_cookie', 'netease_anonymous_cookie']);
            const allKeys: string[] = [];
            for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (key) allKeys.push(key);
            }
            for (const key of allKeys) {
                if (keptKeys.has(key) || key.startsWith('online_provider:')) continue;
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('[FactoryReset] Failed to clear localStorage:', error);
        }
        window.location.reload();
    };

    return (
        <>
            <Group def={MEDIA}>
                <Row option={O.mediaCache} hint={t('options.enableMediaCacheDesc')}>
                    <Toggle checked={mediaCacheEnabled} onChange={setMediaCacheEnabled} />
                </Row>
                {isElectron && (
                    <>
                        <Row
                            option={O.cacheDirectory}
                            hint={t(cacheDirectoryIsDefault ? 'options.cacheDirectoryDefaultHint' : 'options.cacheDirectoryCustomHint')}
                        >
                            {cacheDirectory ? <CopyValue value={cacheDirectory} /> : <Value>...</Value>}
                            <Button onClick={onChooseCacheDirectory} disabled={cacheDirectoryStatus !== 'idle'}>
                                {t('options.chooseCacheDirectory')}
                            </Button>
                        </Row>
                        <Row option={O.cacheLimit} hint={t('options.mediaCacheLimitDesc')}>
                            <Select
                                value={String(cacheLimitGb)}
                                options={CACHE_LIMITS_GB.map(gigabytes => ({
                                    value: String(gigabytes),
                                    label: gigabytes === 0 ? t('options.mediaCacheLimitNone') : `${gigabytes} GB`,
                                }))}
                                onChange={value => setCacheLimitGb(Number(value))}
                            />
                        </Row>
                    </>
                )}
                <Row label={t('options.cachedSongsCount')}>
                    <Value>{mediaCount} · {cacheSizes.media}</Value>
                </Row>
            </Group>

            <Group
                def={CACHES}
                action={(
                    <Button variant="quiet" onClick={() => setClearingAll('asking')} disabled={clearingAll === 'running'}>
                        {clearingAll === 'running' ? t('options.cacheClearing') : t('options.clearAll')}
                    </Button>
                )}
            >
                {CACHE_ROWS.map(({ category, option }) => (
                    <Row key={category} option={option}>
                        <Value>{cacheSizes[category]}</Value>
                        {category === 'lyrics' && (
                            // Named for the Ponder hint of the lyric export, which finds its entry by this attribute.
                            <span data-ponder-lyric-export-settings-entry className="contents">
                                <Button
                                    onClick={() => {
                                        openCommandPaletteCommand(LYRIC_EXPORT_COMMAND_ID);
                                        closeSettings();
                                    }}
                                >
                                    {t('lyricExport.settingsEntry')}
                                </Button>
                            </span>
                        )}
                        <Button onClick={() => onClear(category)} disabled={isCleaning === category}>
                            {isCleaning === category ? t('options.cacheClearing') : t('ui.clear')}
                        </Button>
                    </Row>
                ))}
            </Group>

            <FolderWatchGroup />

            <FoldedGroup def={BACKUP}>
                <ConfigTransferRows />
            </FoldedGroup>

            <Group def={FACTORY}>
                <Row option={O.factoryReset} hint={t('options.factoryResetDesc')}>
                    <button
                        type="button"
                        onClick={() => setFactoryResetAsking(true)}
                        className="st-t-fast inline-flex h-8 items-center gap-1.5 rounded-lg border border-[color:var(--st-err)]/25 bg-[var(--st-err)]/10 px-3 text-[13px] font-medium text-[color:var(--st-err)] transition-colors hover:bg-[var(--st-err)]/20"
                    >
                        <RotateCcw size={14} aria-hidden />
                        {t('options.factoryReset')}
                    </button>
                </Row>
            </Group>

            <ConfirmDialog
                isOpen={clearingAll === 'asking'}
                title={t('options.clearAll')}
                description={t('options.confirmClearAll')}
                confirmVariant="danger"
                isDaylight={isDaylight}
                onConfirm={() => void clearEverything()}
                onClose={() => setClearingAll('no')}
            />

            <ConfirmDialog
                isOpen={factoryResetAsking}
                title={t('options.factoryReset')}
                description={t('options.factoryResetConfirmDesc')}
                confirmText={t('options.factoryResetConfirm')}
                confirmVariant="danger"
                isDaylight={isDaylight}
                onConfirm={() => void factoryReset()}
                onClose={() => setFactoryResetAsking(false)}
            />
        </>
    );
};

export default StoragePage;
