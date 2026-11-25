// dev/checkChunkDuplication.mjs
// 打包产物里跨 chunk 共享的模块只能有一个实例。打包器（rolldown 多入口）偶尔会把同一个
// 模块复制进两个 chunk，各持一份模块级状态：模组注册进一份、界面读另一份，功能就静默
// 失效（0.7.29 的「壁纸引擎」背景类型消失就是这样）。
//
// 每个条目是某个模块独有的字符串；出现在两个以上 chunk 时：
//   - 带 `shared`（该模块的 globalThis 共享键）且产物里有这个键：状态已共享，只提示多份体积；
//   - 否则判失败，打包中止。
// 新增会在运行时被登记的共享模块时，在这里加一行。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ASSETS = path.resolve('dist/assets');

const MARKS = [
    { label: 'visualizer registry', marker: 'Duplicate visualizer mode', shared: 'folia.visualizerRegistryState' },
    { label: 'background registry', marker: 'Duplicate background mode', shared: 'folia.visualizerBackgroundRegistryState' },
    { label: 'folio registry factory', marker: 'register: duplicate id', shared: 'folia.foliumRegistryInstances' },
    { label: 'sources registry', marker: 'sources.register: ', shared: 'folia.foliumSourcesState' },
    { label: 'scene registry', marker: 'SceneRegistry]', shared: 'folia.sceneRegistry' },
    { label: 'ponder registry', marker: 'Duplicate target id', shared: 'folia.ponderRegistryState' },
    { label: 'visualizer service', marker: 'visualizer-unavailable-in-', shared: 'folia.foliumVisualizerService' },
    { label: 'theme service', marker: 'theme-unavailable-in-', shared: 'folia.foliumThemeService' },
    { label: 'equalizer service', marker: 'equalizer-unavailable-in-', shared: 'folia.foliumEqualizerService' },
    { label: 'omni service', marker: 'omni-unavailable-in-', shared: 'folia.foliumOmniService' },
    { label: 'account service', marker: 'account-unavailable-in-', shared: 'folia.foliumAccount' },
    { label: 'secrets bridge', marker: 'secret fields could not be declared', shared: 'folia.foliumSecrets' },
    { label: 'online provider registry', marker: 'is not registered: ', shared: 'folia.onlineMusicProviderRegistry' },
    { label: 'source states', marker: 'sourceStates] a listener failed', shared: 'folia.sourceStates' },
    { label: 'source declarations', marker: 'sourceDeclarations] a listener failed', shared: 'folia.sourceDeclarations' },
    { label: 'source readiness', marker: 'folia.sourceReadiness', shared: 'folia.sourceReadiness' },
    { label: 'wall panning flag', marker: 'folia.wallPanningState', shared: 'folia.wallPanningState' },
    { label: 'lyrics worker client', marker: 'folia.lyricsWorkerClient', shared: 'folia.lyricsWorkerClient' },
    { label: 'folium client loader', marker: 'folia.foliumClientLoader', shared: 'folia.foliumClientLoader' },
    { label: 'collection morph flight', marker: 'folia.collectionFlight', shared: 'folia.collectionFlight' },
    { label: 'wall double click', marker: 'folia.wallDoubleClick', shared: 'folia.wallDoubleClick' },
    { label: 'viewport settle', marker: 'folia.viewportSettle', shared: 'folia.viewportSettle' },
    { label: 'source switches', marker: 'folia.sourceSwitches', shared: 'folia.sourceSwitches' },
    { label: 'stand-in handover', marker: 'folia.standInHandover', shared: 'folia.standInHandover' },
    { label: 'bravais cover flight', marker: 'folia.bravaisCoverFlight', shared: 'folia.bravaisCoverFlight' },
    { label: 'folium rpc messages', marker: 'folia.rpcMessages', shared: 'folia.rpcMessages' },
    { label: 'icu segmenter', marker: 'folia.icuSegmenter', shared: 'folia.icuSegmenter' },
    { label: 'icu folia engines', marker: 'folia.icuFolia', shared: 'folia.icuFolia' },
    { label: 'beat fx live', marker: 'folia.beatFxLive', shared: 'folia.beatFxLive' },
    { label: 'monet pipeline', marker: 'folia.monetPipeline', shared: 'folia.monetPipeline' },
    { label: 'machi camera bar', marker: 'folia.machiCameraBar', shared: 'folia.machiCameraBar' },
];

if (!existsSync(ASSETS)) {
    console.error(`check:chunks: ${ASSETS} 不存在，先构建（npm run build:electron 或 vite build）。`);
    process.exit(1);
}

const chunks = readdirSync(ASSETS)
    .filter((name) => name.endsWith('.js') && !name.startsWith('folium-icons'))
    .map((name) => ({ name, text: readFileSync(path.join(ASSETS, name), 'utf8') }));

const chunksWith = (marker) => chunks.filter((chunk) => chunk.text.includes(marker));

let failed = false;
for (const { label, marker, shared } of MARKS) {
    const hits = chunksWith(marker);
    if (hits.length === 0) {
        console.warn(`check:chunks: ${label} 的标记没有出现在任何 chunk 里（标记过时了？）`);
        continue;
    }
    if (hits.length === 1) {
        continue;
    }
    const names = hits.map((chunk) => chunk.name).join(', ');
    if (shared && chunksWith(shared).length > 0) {
        console.warn(`check:chunks: ${label} 被复制进 ${hits.length} 个 chunk（${names}），状态已用 ${shared} 共享，只是多一份体积。`);
        continue;
    }
    failed = true;
    console.error(`check:chunks: ${label} 被复制进 ${hits.length} 个 chunk：${names}；模块级状态会分裂。`);
}

if (failed) {
    console.error('check:chunks: 共享模块被拆成多份，打包中止。见 dev/checkChunkDuplication.mjs 的处理方式。');
    process.exit(1);
}

console.log(`check:chunks: ${chunks.length} 个 chunk，${MARKS.length} 个共享模块检查通过。`);
