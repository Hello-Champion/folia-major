const fs = require('fs');
const patch = (p, pairs) => {
    let s = fs.readFileSync(p, 'utf8');
    for (const [from, to] of pairs) {
        if (!s.includes(from)) throw new Error(`anchor missing in ${p}: ${from.slice(0, 70)}`);
        s = s.replace(from, to);
    }
    fs.writeFileSync(p, s);
};

// Store: a second angle for seams that run across (the front/back lean).
patch('src/stores/useLibraryWallLookStore.ts', [
[
    "const LIBRARY_WALL_TILT_KEY = 'library_wall_tilt';",
    "const LIBRARY_WALL_TILT_KEY = 'library_wall_tilt';\nconst LIBRARY_WALL_TILT_FRONT_KEY = 'library_wall_tilt_front';",
],
[
    "    tiltDeg: clampLibraryWallTiltDeg(readStored(LIBRARY_WALL_TILT_KEY)),",
    "    tiltDeg: clampLibraryWallTiltDeg(readStored(LIBRARY_WALL_TILT_KEY)),\n    tiltFrontDeg: clampLibraryWallTiltDeg(readStored(LIBRARY_WALL_TILT_FRONT_KEY)),",
],
[
    "    tiltDeg: number;",
    "    tiltDeg: number;\n    /** 横缝的前后倾斜角度（度，正数向里倒，负数向外翻）；与 tiltDeg 一样 0 = 不倾。 */\n    tiltFrontDeg: number;",
],
[
    "    /** 先钳到 -25–25 再写入。 */\n    setTiltDeg: (deg: number) => void;",
    "    /** 先钳到 -25–25 再写入。 */\n    setTiltDeg: (deg: number) => void;\n    setTiltFrontDeg: (deg: number) => void;",
],
[
`    setTiltDeg: (deg) => {
        const normalized = clampLibraryWallTiltDeg(deg);
        writeStored(LIBRARY_WALL_TILT_KEY, String(normalized));
        set({ tiltDeg: normalized });
    },`,
`    setTiltDeg: (deg) => {
        const normalized = clampLibraryWallTiltDeg(deg);
        writeStored(LIBRARY_WALL_TILT_KEY, String(normalized));
        set({ tiltDeg: normalized });
    },
    setTiltFrontDeg: (deg) => {
        const normalized = clampLibraryWallTiltDeg(deg);
        writeStored(LIBRARY_WALL_TILT_FRONT_KEY, String(normalized));
        set({ tiltFrontDeg: normalized });
    },`,
],
]);

// Rule: the angle table depends on the seam's axis.
patch('src/library/suites/bravais/bravaisTilt.ts', [
[
`export const resolveBravaisTiltDeg = (
    { variant, openWidth, targetAxis, renderedAxis, finite, reducedMotion, collectionTilt }: BravaisTiltInput,
    table: Record<BravaisTiltPage, number> = BRAVAIS_TILT_DEG,
): number => {`,
`export const resolveBravaisTiltDeg = (
    { variant, openWidth, targetAxis, renderedAxis, finite, reducedMotion, collectionTilt }: BravaisTiltInput,
    table: Record<BravaisTiltPage, number> = BRAVAIS_TILT_DEG,
    /** 横缝（左右向）用的角度表：前后倒的角度由它给，缺省跟竖缝同一张。 */
    frontTable: Record<BravaisTiltPage, number> = table,
): number => {`,
],
[
    "    return table[page];",
    "    return (targetAxis === 'y' ? frontTable : table)[page];",
],
]);

// Stage: build both tables from the store.
patch('src/library/suites/bravais/BravaisStage.tsx', [
[
`    const wallTiltDeg = useLibraryWallLookStore(state => state.tiltDeg);
    const tiltTable = useMemo(
        () => ({ home: 0, collection: -wallTiltDeg, poster: -wallTiltDeg }),
        [wallTiltDeg],
    );`,
`    const wallTiltDeg = useLibraryWallLookStore(state => state.tiltDeg);
    const wallTiltFrontDeg = useLibraryWallLookStore(state => state.tiltFrontDeg);
    const tiltTable = useMemo(
        () => ({ home: 0, collection: -wallTiltDeg, poster: -wallTiltDeg }),
        [wallTiltDeg],
    );
    const tiltFrontTable = useMemo(
        () => ({ home: 0, collection: -wallTiltFrontDeg, poster: -wallTiltFrontDeg }),
        [wallTiltFrontDeg],
    );`,
],
[
`            collectionTilt: collectionTiltRef.current,
        }, tiltTable);
    }, [seamInputFor, tiltTable]);`,
`            collectionTilt: collectionTiltRef.current,
        }, tiltTable, tiltFrontTable);
    }, [seamInputFor, tiltTable, tiltFrontTable]);`,
],
[
`            collectionTilt,
        }, tiltTable),`,
`            collectionTilt,
        }, tiltTable, tiltFrontTable),`,
],
]);
console.log('store + rule + stage patched');
