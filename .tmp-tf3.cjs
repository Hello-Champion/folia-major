const fs = require('fs');
const patch = (p, pairs) => {
    let s = fs.readFileSync(p, 'utf8');
    for (const [from, to] of pairs) {
        if (!s.includes(from)) throw new Error(`anchor missing in ${p}: ${from.slice(0, 70)}`);
        s = s.replace(from, to);
    }
    fs.writeFileSync(p, s);
};

patch('src/library/suites/bravais/useBravaisTilt.ts', [
[
    "    deg,\n    seamFollowsTilt,",
    "    deg,\n    frontDeg,\n    seamFollowsTilt,",
],
[
    "    /** 整层该转到的角度（度；0 = 回正）。 */\n    deg: number;",
    "    /** 整层该转到的角度（度；0 = 回正）。 */\n    deg: number;\n    /** 前后倾斜角（度，rotateX）。不补间：改的是设置里的滑块，松手时直接到位。 */\n    frontDeg: number;",
],
[
    `        const to = deg;
        const from = frameRef.current.tiltDeg;
        animationRef.current?.stop();
        animationRef.current = null;
        frameRef.current.tiltTargetDeg = to;`,
`        const to = deg;
        const from = frameRef.current.tiltDeg;
        animationRef.current?.stop();
        animationRef.current = null;
        // shortcut: 前后角不进补间（和左右角分开动画要两套进度），滑块改完立刻生效。
        frameRef.current.tiltFrontDeg = frontDeg;
        frameRef.current.tiltTargetDeg = to;`,
],
[
    "    }, [checkCull, deg, frameRef, quickOut, reducedMotion, renderFrame]);",
    "    }, [checkCull, deg, frameRef, frontDeg, quickOut, reducedMotion, renderFrame]);",
],
]);

patch('src/library/suites/bravais/useBravaisFrame.ts', [
[
    "    tiltDeg: number;\n    /** 倾斜正在补间去的角度",
    "    tiltDeg: number;\n    /** 前后倾斜角（rotateX，度）。 */\n    tiltFrontDeg: number;\n    /** 倾斜正在补间去的角度",
],
[
    "        tiltDeg: 0,",
    "        tiltDeg: 0,\n        tiltFrontDeg: 0,",
],
[
    "            tiltDeg: state.tiltDeg,",
    "            tiltDeg: state.tiltDeg,\n            tiltFrontDeg: state.tiltFrontDeg,",
],
]);

patch('src/library/suites/bravais/bravaisFrame.ts', [
[
    "    tiltDeg?: number;\n    liftY?: number;",
    "    tiltDeg?: number;\n    /** 前后倾斜角（rotateX，度）；与 tiltDeg 同时生效。 */\n    tiltFrontDeg?: number;\n    liftY?: number;",
],
[
    "    tilt: { deg: number; pivotX: number; pivotY: number; axis?: SeamAxis };",
    "    tilt: { deg: number; frontDeg?: number; pivotX: number; pivotY: number; axis?: SeamAxis };",
],
[
    "export const computeBravaisFrame = ({ center, view, anchorX, anchorY = null, openWidth, contentWidth, hidden, poster = false, tiltDeg = 0, liftY = 0 }: BravaisFrameInput): BravaisFrame => {",
    "export const computeBravaisFrame = ({ center, view, anchorX, anchorY = null, openWidth, contentWidth, hidden, poster = false, tiltDeg = 0, tiltFrontDeg = 0, liftY = 0 }: BravaisFrameInput): BravaisFrame => {",
],
[
    "            tilt: { deg: tiltDeg, pivotX: view.width / 2, pivotY: geometry.screenY + geometry.width / 2, axis: 'y' },",
    "            tilt: { deg: tiltDeg, frontDeg: tiltFrontDeg, pivotX: view.width / 2, pivotY: geometry.screenY + geometry.width / 2, axis: 'y' },",
],
[
    "        tilt: { deg: tiltDeg, pivotX: geometry.screenX + geometry.width / 2, pivotY: view.height / 2, axis: 'x' },",
    "        tilt: { deg: tiltDeg, frontDeg: tiltFrontDeg, pivotX: geometry.screenX + geometry.width / 2, pivotY: view.height / 2, axis: 'x' },",
],
[
`export const withTilt = (transform: string, tilt: BravaisFrame['tilt']) => {
    if (Math.abs(tilt.deg) < 0.001) return transform;
    const pivot = \`translate(\${tilt.pivotX}px, \${tilt.pivotY}px)\`;
    const back = \`translate(\${-tilt.pivotX}px, \${-tilt.pivotY}px)\`;
    const turn = tilt.axis === 'y'
        ? \`perspective(1400px) rotateX(\${tilt.deg}deg)\`
        : \`rotate(\${tilt.deg}deg)\`;
    return \`\${pivot} \${turn} \${back} \${transform}\`;
};`,
`export const withTilt = (transform: string, tilt: BravaisFrame['tilt']) => {
    const front = tilt.frontDeg ?? 0;
    if (Math.abs(tilt.deg) < 0.001 && Math.abs(front) < 0.001) return transform;
    const pivot = \`translate(\${tilt.pivotX}px, \${tilt.pivotY}px)\`;
    const back = \`translate(\${-tilt.pivotX}px, \${-tilt.pivotY}px)\`;
    // 横缝的前后角以前直接写在 deg 里；现在两个角度总是同时生效。
    const frontDeg = front + (tilt.axis === 'y' ? tilt.deg : 0);
    const turns = [
        Math.abs(frontDeg) >= 0.001 ? \`perspective(1400px) rotateX(\${frontDeg}deg)\` : '',
        tilt.axis !== 'y' && Math.abs(tilt.deg) >= 0.001 ? \`rotate(\${tilt.deg}deg)\` : '',
    ].filter(Boolean).join(' ');
    return \`\${pivot} \${turns} \${back} \${transform}\`;
};`,
],
[
    `    const left = seam.x - seam.width / 2;
    if (Math.abs(tilt.deg) < 0.001) return { track: \`translate3d(\${left}px, 0, 0)\`, seam: '' };`,
    `    const left = seam.x - seam.width / 2;
    const front = tilt.frontDeg ?? 0;
    if (Math.abs(tilt.deg) < 0.001 && Math.abs(front) < 0.001) return { track: \`translate3d(\${left}px, 0, 0)\`, seam: '' };`,
],
[
    `    const pivotX = round(tilt.pivotX - left);
    const pivotY = round(tilt.pivotY);
    return {
        track: \`translate3d(\${Math.round(left * ratio) / ratio}px, 0, 0)\`,
        seam: \`translate(\${pivotX}px, \${pivotY}px) rotate(\${tilt.deg}deg) translate(\${-pivotX}px, \${-pivotY}px)\`,
    };`,
    `    const pivotX = round(tilt.pivotX - left);
    const pivotY = round(tilt.pivotY);
    const seamTurns = [
        Math.abs(front) >= 0.001 ? \`perspective(1400px) rotateX(\${front}deg)\` : '',
        Math.abs(tilt.deg) >= 0.001 ? \`rotate(\${tilt.deg}deg)\` : '',
    ].filter(Boolean).join(' ');
    return {
        track: \`translate3d(\${Math.round(left * ratio) / ratio}px, 0, 0)\`,
        seam: \`translate(\${pivotX}px, \${pivotY}px) \${seamTurns} translate(\${-pivotX}px, \${-pivotY}px)\`,
    };`,
],
]);
console.log('hook + frame ok');
