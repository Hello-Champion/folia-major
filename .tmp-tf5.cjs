const fs = require('fs');
const patch = (p, pairs) => {
    let s = fs.readFileSync(p, 'utf8');
    for (const [from, to] of pairs) {
        if (!s.includes(from)) throw new Error(`anchor missing in ${p}: ${from.slice(0, 70)}`);
        s = s.replace(from, to);
    }
    fs.writeFileSync(p, s);
};

patch('src/components/modal/settings/pages/BravaisWallGroup.tsx', [
[
    "    tilt: option(BRAVAIS_WALL, 'libraryWallTilt', 'options.bravaisTilt'),",
    "    tilt: option(BRAVAIS_WALL, 'libraryWallTilt', 'options.bravaisTilt'),\n    tiltFront: option(BRAVAIS_WALL, 'libraryWallTiltFront', 'options.bravaisTiltFront'),",
],
[
    "        tiltDeg: state.tiltDeg,",
    "        tiltDeg: state.tiltDeg,\n        tiltFrontDeg: state.tiltFrontDeg,",
],
[
    "        setTiltDeg: state.setTiltDeg,",
    "        setTiltDeg: state.setTiltDeg,\n        setTiltFrontDeg: state.setTiltFrontDeg,",
],
[
`            <Row option={O.tilt} hint={t('options.bravaisTiltHint', { deg: wall.tiltDeg })} note={t('options.bravaisTiltDesc')}>
                <Slider
                    value={wall.tiltDeg}
                    min={MIN_LIBRARY_WALL_TILT_DEG}
                    max={MAX_LIBRARY_WALL_TILT_DEG}
                    step={1}
                    onChange={wall.setTiltDeg}
                    format={value => \`\${value}°\`}
                />
            </Row>`,
`            <Row option={O.tilt} hint={t('options.bravaisTiltHint', { deg: wall.tiltDeg })} note={t('options.bravaisTiltDesc')}>
                <Slider
                    value={wall.tiltDeg}
                    min={MIN_LIBRARY_WALL_TILT_DEG}
                    max={MAX_LIBRARY_WALL_TILT_DEG}
                    step={1}
                    onChange={wall.setTiltDeg}
                    format={value => \`\${value}°\`}
                />
            </Row>
            <Row option={O.tiltFront} hint={t('options.bravaisTiltFrontHint', { deg: wall.tiltFrontDeg })} note={t('options.bravaisTiltFrontDesc')}>
                <Slider
                    value={wall.tiltFrontDeg}
                    min={MIN_LIBRARY_WALL_TILT_DEG}
                    max={MAX_LIBRARY_WALL_TILT_DEG}
                    step={1}
                    onChange={wall.setTiltFrontDeg}
                    format={value => \`\${value}°\`}
                />
            </Row>`,
],
]);

// Codec: second appearance field, short key lwtf.
patch('src/utils/appearanceCodec.ts', [
[
    "    if (config.libraryWallTilt !== undefined) minified.lwlt = config.libraryWallTilt;",
    "    if (config.libraryWallTilt !== undefined) minified.lwlt = config.libraryWallTilt;\n    if (config.libraryWallTiltFront !== undefined) minified.lwtf = config.libraryWallTiltFront;",
],
[
    "        || parsed.lwlt !== undefined",
    "        || parsed.lwlt !== undefined\n        || parsed.lwtf !== undefined",
],
[
    "        if (parsed.lwlt !== undefined) decompressed.libraryWallTilt = parsed.lwlt;",
    "        if (parsed.lwlt !== undefined) decompressed.libraryWallTilt = parsed.lwlt;\n        if (parsed.lwtf !== undefined) decompressed.libraryWallTiltFront = parsed.lwtf;",
],
[
    "            'libraryWallStackEdges', 'libraryWallTilt',",
    "            'libraryWallStackEdges', 'libraryWallTilt', 'libraryWallTiltFront',",
],
]);
patch('src/components/modal/settings/ImportConfirmDialog.tsx', [
[ "    libraryWallTilt: 'options.bravaisTilt',", "    libraryWallTilt: 'options.bravaisTilt',\n    libraryWallTiltFront: 'options.bravaisTiltFront'," ],
]);
patch('src/components/modal/settings/pages/storage/visualConfigTransfer.ts', [
[
`    if (has('libraryWallTilt')) {
        storeLibraryWall.setTiltDeg(Number(config.libraryWallTilt));
    }`,
`    if (has('libraryWallTilt')) {
        storeLibraryWall.setTiltDeg(Number(config.libraryWallTilt));
    }
    if (has('libraryWallTiltFront')) {
        storeLibraryWall.setTiltFrontDeg(Number(config.libraryWallTiltFront));
    }`,
],
]);
patch('src/utils/appearanceImportPlan.ts', [
[ "    libraryWallTilt: 'libraryWall',", "    libraryWallTilt: 'libraryWall',\n    libraryWallTiltFront: 'libraryWall'," ],
]);
patch('src/services/obs/visualSettingsConfig.ts', [
[
    "    libraryWallTilt: useLibraryWallLookStore.getState().tiltDeg,",
    "    libraryWallTilt: useLibraryWallLookStore.getState().tiltDeg,\n    libraryWallTiltFront: useLibraryWallLookStore.getState().tiltFrontDeg,",
],
]);
patch('dev/dedicatus/appearanceDestinations.mjs', [
[ "    'library_wall_tilt': { config: 'libraryWallTilt' },", "    'library_wall_tilt': { config: 'libraryWallTilt' },\n    'library_wall_tilt_front': { config: 'libraryWallTiltFront' }," ],
]);
patch('dev/dedicatus/appearanceShortKeys.mjs', [
[ "    'config.libraryWallTilt=lwlt',", "    'config.libraryWallTilt=lwlt',\n    'config.libraryWallTiltFront=lwtf'," ],
]);
patch('dev/dedicatus/storageKeys.mjs', [
[ "    'web:library_wall_tilt',", "    'web:library_wall_tilt',\n    'web:library_wall_tilt_front'," ],
]);
console.log('ui + registries ok');
