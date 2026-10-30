import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { getNexyAsset, getNexyReleases, isNexyReleaseNewer } from '../nexyUpdater';

const url = (name) => `https://github.com/valzzu/Nexy/releases/download/v2026.11.1/${name}`;
const asset = (name, overrides = {}) => ({
    name,
    state: 'uploaded',
    size: 12345,
    browser_download_url: url(name),
    content_type: 'application/octet-stream',
    digest: `sha256:${'a'.repeat(64)}`,
    ...overrides
});
const release = (name, { prerelease = false, assets = [asset('Nexy_2026.11.1_Setup_x64.exe')], ...other } = {}) => ({
    name,
    tag_name: name,
    draft: false,
    prerelease,
    published_at: '2026-11-01T12:00:00Z',
    assets,
    ...other
});

describe('Nexy release updater', () => {
    test('accepts Nexy Windows installers and verifies GitHub origin and checksum', () => {
        expect(getNexyAsset([asset('Nexy_2026.11.1_Setup_x64.exe')], 'win32')).toEqual({
            downloadUrl: url('Nexy_2026.11.1_Setup_x64.exe'),
            hashString: 'a'.repeat(64),
            size: 12345
        });
        expect(getNexyAsset([asset('VRCX_2026.11.1_Setup_x64.exe')], 'win32').downloadUrl).toBe('');
        expect(
            getNexyAsset(
                [
                    asset('Nexy_2026.11.1_Setup_x64.exe', {
                        browser_download_url: 'https://github.com/rs189/VRCX/releases/download/foo/file.exe'
                    })
                ],
                'win32'
            ).downloadUrl
        ).toBe('');
    });
    test('matches Linux architecture and accepts GitHub application/octet-stream assets', () => {
        const assets = [asset('Nexy_2026.11.1_x64.AppImage'), asset('Nexy_2026.11.1_arm64.AppImage')];
        expect(getNexyAsset(assets, 'linux', 'arm64').downloadUrl).toBe(url('Nexy_2026.11.1_arm64.AppImage'));
        expect(getNexyAsset(assets, 'linux', 'x64').downloadUrl).toBe(url('Nexy_2026.11.1_x64.AppImage'));
        expect(getNexyAsset(assets, 'darwin', 'x64').downloadUrl).toBe('');
    });
    test('separates stable and nightly, ignores drafts and incompatible releases', () => {
        const stable = release('Nexy 2026.11.1');
        const nightly = release('Nexy Nightly 2026.11.2', { prerelease: true });
        const draft = release('Nexy 2026.11.3', { draft: true });
        const wrong = release('VRCX 2026.11.4', { assets: [asset('VRCX_2026.11.4_Setup_x64.exe')] });
        expect(getNexyReleases([stable, nightly, draft, wrong], 'Stable', 'win32', 'x64')).toEqual([stable]);
        expect(getNexyReleases([stable, nightly, draft, wrong], 'Nightly', 'win32', 'x64')).toEqual([nightly]);
        expect(getNexyReleases([], 'Stable', 'win32', 'x64')).toEqual([]);
        expect(getNexyReleases({ message: 'Not Found' }, 'Stable', 'win32', 'x64')).toEqual([]);
    });
    test('keeps Windows Nexy installation separate from the original VRCX app', () => {
        const installer = readFileSync('Installer/installer.nsi', 'utf8');
        expect(installer).toContain('InstallDir "$PROGRAMFILES64\\Nexy"');
        expect(installer).toContain('OutFile "Nexy_Setup_x64.exe"');
        expect(installer).not.toContain('InstallDir "$PROGRAMFILES64\\VRCX"');
        expect(installer).not.toContain('taskkill /IM VRCX.exe');
        expect(installer).not.toContain('Software\\Classes\\vrcx');
    });

    test('compares numeric date versions, not lexicographic names', () => {
        expect(isNexyReleaseNewer(release('Nexy 2026.11.1'), 'Nexy 2026.9.30')).toBe(true);
        expect(isNexyReleaseNewer(release('Nexy 2026.9.30'), 'Nexy 2026.11.1')).toBe(false);
        expect(isNexyReleaseNewer(release('Nexy 2026.11.1'), 'Nexy 2026.11.1')).toBe(false);
        expect(isNexyReleaseNewer(release('Nexy 2026.11.1'), 'Nexy Nightly 2026.10.31-abcdefg')).toBe(true);
        expect(isNexyReleaseNewer(release('bad-version'), 'Nexy 2026.10.31')).toBe(false);
    });
});
