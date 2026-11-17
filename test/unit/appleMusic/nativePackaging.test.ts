import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Verify release path isolation and per-target native compilation without running a full package build.
const require = createRequire(import.meta.url);
const { resolveNativeExecutable } = require('../../../electron/appleMusic/nativePaths.cjs');
const { prepareMacCompanion, verifyMacCompanion } = require('../../../electron/appleMusic/macos/prepareBundle.cjs');
const { WINDOWS_COMPANION_FILES, prepareWindowsCompanion, verifyWindowsCompanion } = require('../../../electron/appleMusic/windows/prepareBundle.cjs');
const root = path.resolve('/project');
const resources = path.resolve('/installed/Resources');
const base = { platform: 'darwin', isPackaged: false, projectRoot: root, resourcesPath: resources };

describe('Apple Music native delivery', () => {
    it('resolves development output and only absolute developer overrides', () => {
        expect(resolveNativeExecutable(base)).toBe(path.join(root, 'build/apple-music-native/FoliaAppleMusicCompanion.app/Contents/MacOS/FoliaAppleMusicCompanion'));
        expect(resolveNativeExecutable({ ...base, override: path.resolve('/custom/native') })).toBe(path.resolve('/custom/native'));
        expect(resolveNativeExecutable({ ...base, override: 'relative' })).toBe('');
    });
    it('uses bundled resources and ignores overrides in production', () => {
        expect(resolveNativeExecutable({ ...base, isPackaged: true, override: path.resolve('/custom/native') })).toBe(path.join(resources, 'apple-music/FoliaAppleMusicCompanion.app/Contents/MacOS/FoliaAppleMusicCompanion'));
    });
    it('never resolves a Linux host', () => {
        expect(resolveNativeExecutable({ ...base, platform: 'linux', override: path.resolve('/custom/native') })).toBe('');
    });
    it('resolves the Windows host in development and from packaged resources', () => {
        expect(resolveNativeExecutable({ ...base, platform: 'win32' })).toBe(path.join(root, 'build/apple-music-native/windows/FoliaAppleMusicCompanion.exe'));
        expect(resolveNativeExecutable({ ...base, platform: 'win32', isPackaged: true, override: path.resolve('/custom/native') })).toBe(path.join(resources, 'apple-music/windows/FoliaAppleMusicCompanion.exe'));
    });
    it('compiles the Windows host for x64 only and fails when packaged files are missing', async () => {
        const run = vi.fn();
        expect(prepareWindowsCompanion({ arch: 'x64', projectRoot: root, run })).toBe(path.join(root, 'build/apple-music-native/windows'));
        expect(run).toHaveBeenCalledWith('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'electron/appleMusic/windows/buildCompanion.ps1')], { stdio: 'inherit' });
        run.mockClear();
        expect(() => prepareWindowsCompanion({ arch: 'arm64', projectRoot: root, run })).toThrow('Unsupported');
        expect(run).not.toHaveBeenCalled();
        await expect(verifyWindowsCompanion(path.join(root, 'missing-resources'))).rejects.toThrow();
    });
    it.each([['x64', 'x86_64'], ['arm64', 'arm64']])('compiles %s for the requested target rather than host architecture', (arch, target) => {
        const run = vi.fn();
        const bundle = prepareMacCompanion({ arch, projectRoot: root, run });
        expect(bundle).toBe(path.join(root, `build/apple-music-native/darwin-${arch}/FoliaAppleMusicCompanion.app`));
        expect(run).toHaveBeenCalledWith('sh', [path.join(root, 'electron/appleMusic/macos/buildCompanion.sh'), bundle, 'org.folia.AppleMusicCompanion', target], { stdio: 'inherit' });
    });
    it('fails unsupported architectures and missing packaged resources', async () => {
        const run = vi.fn();
        expect(() => prepareMacCompanion({ arch: 'ia32', projectRoot: root, run })).toThrow('Unsupported');
        expect(run).not.toHaveBeenCalled();
        await expect(verifyMacCompanion(path.join(root, 'missing-resources'))).rejects.toThrow();
    });
    it('ships no native companion: packaging needs no native toolchain', () => {
        // 本分支去掉了 Apple Music 伴生宿主：Windows 要 VS 的 .NET 桌面工作负载、macOS 要原生工具链，
        // 都不再是打包前置条件。构建钩子与 extraResources 里不该再有它。
        const config = require('../../../package.json').build;
        expect(JSON.stringify(config.mac.extraResources)).not.toContain('apple-music-native');
        expect(JSON.stringify(config.win.extraResources)).not.toContain('apple-music-native');
        const beforePack = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../../build/beforePack.cjs'), 'utf8');
        expect(beforePack).not.toContain('prepareWindowsCompanion');
        expect(beforePack).not.toContain('prepareMacCompanion');
    });
});
