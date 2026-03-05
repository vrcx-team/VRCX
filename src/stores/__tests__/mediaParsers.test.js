import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../shared/utils', () => ({
    convertYoutubeTime: vi.fn((dur) => {
        // simplified mock: PT3M30S → 210
        const m = /(\d+)M/.exec(dur);
        const s = /(\d+)S/.exec(dur);
        return (m ? Number(m[1]) * 60 : 0) + (s ? Number(s[1]) : 0);
    }),
    findUserByDisplayName: vi.fn(),
    isRpcWorld: vi.fn(() => false),
    replaceBioSymbols: vi.fn((s) => s)
}));

import { isRpcWorld, findUserByDisplayName } from '../../shared/utils';
import { createMediaParsers } from '../gameLog/mediaParsers';

/**
 *
 * @param overrides
 */
function makeDeps(overrides = {}) {
    return {
        nowPlaying: { value: { url: '' } },
        setNowPlaying: vi.fn(),
        clearNowPlaying: vi.fn(),
        userStore: { cachedUsers: new Map() },
        advancedSettingsStore: {
            youTubeApi: false,
            lookupYouTubeVideo: vi.fn()
        },
        ...overrides
    };
}

// ─── addGameLogVideo ─────────────────────────────────────────────────

describe('addGameLogVideo', () => {
    let deps, parsers;

    beforeEach(() => {
        vi.clearAllMocks();
        isRpcWorld.mockReturnValue(false);
        deps = makeDeps();
        parsers = createMediaParsers(deps);
    });

    test('creates VideoPlay entry for a normal URL', async () => {
        const gameLog = {
            dt: '2024-01-01',
            videoUrl: 'https://example.com/video.mp4',
            displayName: 'Alice'
        };
        await parsers.addGameLogVideo(gameLog, 'wrld_123:456', 'usr_a');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'VideoPlay',
                videoUrl: 'https://example.com/video.mp4',
                displayName: 'Alice',
                location: 'wrld_123:456',
                userId: 'usr_a'
            })
        );
    });

    test('skips video in RPC world (non-YouTube)', async () => {
        isRpcWorld.mockReturnValue(true);
        deps = makeDeps();
        parsers = createMediaParsers(deps);

        const gameLog = {
            dt: '2024-01-01',
            videoUrl: 'https://example.com/video.mp4'
        };
        await parsers.addGameLogVideo(gameLog, 'wrld_rpc', 'usr_a');

        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });

    test('processes YouTube video in RPC world when videoId is YouTube', async () => {
        isRpcWorld.mockReturnValue(true);
        deps = makeDeps();
        parsers = createMediaParsers(deps);

        const gameLog = {
            dt: '2024-01-01',
            videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
            videoId: 'YouTube'
        };
        await parsers.addGameLogVideo(gameLog, 'wrld_rpc', 'usr_a');

        // YouTube API off, so videoId/videoName/videoLength default
        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'VideoPlay',
                videoUrl: 'https://youtu.be/dQw4w9WgXcQ'
            })
        );
    });

    test('extracts YouTube video ID from youtu.be URL', async () => {
        deps = makeDeps({
            advancedSettingsStore: {
                youTubeApi: true,
                lookupYouTubeVideo: vi.fn().mockResolvedValue({
                    pageInfo: { totalResults: 1 },
                    items: [
                        {
                            snippet: { title: 'Test Video' },
                            contentDetails: { duration: 'PT3M30S' }
                        }
                    ]
                })
            }
        });
        parsers = createMediaParsers(deps);

        const gameLog = {
            dt: '2024-01-01',
            videoUrl: 'https://youtu.be/dQw4w9WgXcQ'
        };
        await parsers.addGameLogVideo(gameLog, 'wrld_123:456', 'usr_a');

        expect(
            deps.advancedSettingsStore.lookupYouTubeVideo
        ).toHaveBeenCalledWith('dQw4w9WgXcQ');
        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                videoId: 'YouTube',
                videoName: 'Test Video',
                videoLength: 210
            })
        );
    });

    test('respects videoPos from gameLog', async () => {
        const gameLog = {
            dt: '2024-01-01',
            videoUrl: 'https://example.com/v.mp4',
            videoPos: 42
        };
        await parsers.addGameLogVideo(gameLog, 'wrld_123:456', 'usr_a');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({ videoPos: 42 })
        );
    });

    test('unwraps proxy URLs (t-ne.x0.to)', async () => {
        const gameLog = {
            dt: '2024-01-01',
            videoUrl:
                'https://t-ne.x0.to/?url=https://www.youtube.com/watch?v=abcdefghijk'
        };
        deps = makeDeps({
            advancedSettingsStore: {
                youTubeApi: true,
                lookupYouTubeVideo: vi.fn().mockResolvedValue({
                    pageInfo: { totalResults: 1 },
                    items: [
                        {
                            snippet: { title: 'Proxy Video' },
                            contentDetails: { duration: 'PT1M' }
                        }
                    ]
                })
            }
        });
        parsers = createMediaParsers(deps);

        await parsers.addGameLogVideo(gameLog, 'wrld_123:456', 'usr_a');

        expect(
            deps.advancedSettingsStore.lookupYouTubeVideo
        ).toHaveBeenCalledWith('abcdefghijk');
    });
});

// ─── addGameLogPyPyDance ─────────────────────────────────────────────

describe('addGameLogPyPyDance', () => {
    let deps, parsers;

    beforeEach(() => {
        vi.clearAllMocks();
        isRpcWorld.mockReturnValue(true);
        findUserByDisplayName.mockReturnValue(null);
        deps = makeDeps();
        parsers = createMediaParsers(deps);
    });

    test('parses PyPyDance data and calls setNowPlaying', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(PyPyDance) "https://example.com/v.mp4",10,300,"SomeSource: Song Title(TestUser)"'
        };
        parsers.addGameLogPyPyDance(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'VideoPlay',
                videoUrl: 'https://example.com/v.mp4',
                videoLength: 300,
                displayName: 'TestUser'
            })
        );
    });

    test('returns early for unparseable data', () => {
        const gameLog = { dt: '2024-01-01', data: 'garbage data' };
        parsers.addGameLogPyPyDance(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });

    test('sets displayName to empty when Random', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(PyPyDance) "https://example.com/v.mp4",5,200,"Source: Title(Random)"'
        };
        parsers.addGameLogPyPyDance(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: '' })
        );
    });

    test('updates nowPlaying when URL matches', () => {
        deps.nowPlaying.value.url = 'https://example.com/v.mp4';
        parsers = createMediaParsers(deps);

        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(PyPyDance) "https://example.com/v.mp4",20,300,"Source: Title(User1)"'
        };
        parsers.addGameLogPyPyDance(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                updatedAt: '2024-01-01',
                videoPos: 20,
                videoLength: 300
            })
        );
    });
});

// ─── addGameLogVRDancing ─────────────────────────────────────────────

describe('addGameLogVRDancing', () => {
    let deps, parsers;

    beforeEach(() => {
        vi.clearAllMocks();
        isRpcWorld.mockReturnValue(true);
        findUserByDisplayName.mockReturnValue(null);
        deps = makeDeps();
        parsers = createMediaParsers(deps);
    });

    test('parses VRDancing data and creates entry', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(VRDancing) "https://example.com/v.mp4",10,300,42,"Alice","Cool Song"'
        };
        parsers.addGameLogVRDancing(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'VideoPlay',
                videoUrl: 'https://example.com/v.mp4',
                displayName: 'Alice',
                videoName: 'Cool Song'
            })
        );
    });

    test('converts videoId -1 to YouTube', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(VRDancing) "https://youtu.be/dQw4w9WgXcQ",0,300,-1,"Alice","Song"'
        };
        // This will call addGameLogVideo internally (YouTube path)
        parsers.addGameLogVRDancing(gameLog, 'wrld_rpc');

        // setNowPlaying is called via addGameLogVideo for YouTube
        expect(deps.setNowPlaying).toHaveBeenCalled();
    });

    test('strips HTML from videoName', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(VRDancing) "https://example.com/v.mp4",0,200,5,"Bob","[Tag]</b> Actual Title"'
        };
        parsers.addGameLogVRDancing(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({ videoName: 'Actual Title' })
        );
    });

    test('resets videoPos when it equals videoLength', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(VRDancing) "https://example.com/v.mp4",300,300,5,"Bob","Title"'
        };
        parsers.addGameLogVRDancing(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({ videoPos: 0 })
        );
    });

    test('returns early for unparseable data', () => {
        const gameLog = { dt: '2024-01-01', data: 'bad data' };
        parsers.addGameLogVRDancing(gameLog, 'wrld_rpc');
        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });
});

// ─── addGameLogZuwaZuwaDance ─────────────────────────────────────────

describe('addGameLogZuwaZuwaDance', () => {
    let deps, parsers;

    beforeEach(() => {
        vi.clearAllMocks();
        isRpcWorld.mockReturnValue(true);
        findUserByDisplayName.mockReturnValue(null);
        deps = makeDeps();
        parsers = createMediaParsers(deps);
    });

    test('parses ZuwaZuwaDance data correctly', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(ZuwaZuwaDance) "https://example.com/v.mp4",5,200,42,"Alice","Dance Song"'
        };
        parsers.addGameLogZuwaZuwaDance(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'VideoPlay',
                displayName: 'Alice',
                videoName: 'Dance Song',
                videoId: '42'
            })
        );
    });

    test('converts videoId 9999 to YouTube', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(ZuwaZuwaDance) "https://youtu.be/dQw4w9WgXcQ",0,200,9999,"Alice","Song"'
        };
        parsers.addGameLogZuwaZuwaDance(gameLog, 'wrld_rpc');
        expect(deps.setNowPlaying).toHaveBeenCalled();
    });

    test('sets displayName to empty when Random', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(ZuwaZuwaDance) "https://example.com/v.mp4",0,200,1,"Random","Song"'
        };
        parsers.addGameLogZuwaZuwaDance(gameLog, 'wrld_rpc');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: '' })
        );
    });

    test('returns early for unparseable data', () => {
        const gameLog = { dt: '2024-01-01', data: 'bad' };
        parsers.addGameLogZuwaZuwaDance(gameLog, 'wrld_rpc');
        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });
});

// ─── addGameLogLSMedia ───────────────────────────────────────────────

describe('addGameLogLSMedia', () => {
    let deps, parsers;

    beforeEach(() => {
        vi.clearAllMocks();
        findUserByDisplayName.mockReturnValue(null);
        deps = makeDeps();
        parsers = createMediaParsers(deps);
    });

    test('parses LSMedia log correctly', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'LSMedia 0,6298.292,Natsumi-sama,The Outfit (2022),'
        };
        parsers.addGameLogLSMedia(gameLog, 'wrld_123:456');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'VideoPlay',
                videoId: 'LSMedia',
                displayName: 'Natsumi-sama',
                videoName: 'The Outfit (2022)'
            })
        );
    });

    test('returns early for empty video name (regex does not match)', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'LSMedia 0,4268.981,Natsumi-sama,,'
        };
        parsers.addGameLogLSMedia(gameLog, 'wrld_123:456');

        // The regex requires a non-empty 4th capture group,
        // so an empty video name causes the parse to fail
        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });

    test('returns early for unparseable data', () => {
        const gameLog = { dt: '2024-01-01', data: 'bad data' };
        parsers.addGameLogLSMedia(gameLog, 'wrld_123:456');
        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });

    test('looks up userId when displayName given', () => {
        findUserByDisplayName.mockReturnValue({ id: 'usr_found' });

        const gameLog = {
            dt: '2024-01-01',
            data: 'LSMedia 0,100,Alice,Movie,'
        };
        parsers.addGameLogLSMedia(gameLog, 'wrld_123:456');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'usr_found' })
        );
    });
});

// ─── addGameLogPopcornPalace ─────────────────────────────────────────

describe('addGameLogPopcornPalace', () => {
    let deps, parsers;

    beforeEach(() => {
        vi.clearAllMocks();
        findUserByDisplayName.mockReturnValue(null);
        deps = makeDeps();
        parsers = createMediaParsers(deps);
    });

    test('parses PopcornPalace JSON data', () => {
        const json = JSON.stringify({
            videoName: 'How to Train Your Dragon',
            videoPos: 37.28,
            videoLength: 11474.05,
            thumbnailUrl: 'https://example.com/thumb.jpg',
            displayName: 'miner28_3',
            isPaused: false,
            is3D: false,
            looping: false
        });
        const gameLog = {
            dt: '2024-01-01',
            data: `VideoPlay(PopcornPalace) ${json}`
        };
        parsers.addGameLogPopcornPalace(gameLog, 'wrld_123:456');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'VideoPlay',
                videoId: 'PopcornPalace',
                videoName: 'How to Train Your Dragon',
                displayName: 'miner28_3',
                thumbnailUrl: 'https://example.com/thumb.jpg'
            })
        );
    });

    test('calls clearNowPlaying when videoName is empty', () => {
        const json = JSON.stringify({
            videoName: '',
            videoPos: 0,
            videoLength: 0,
            displayName: 'user'
        });
        const gameLog = {
            dt: '2024-01-01',
            data: `VideoPlay(PopcornPalace) ${json}`
        };
        parsers.addGameLogPopcornPalace(gameLog, 'wrld_123:456');

        expect(deps.clearNowPlaying).toHaveBeenCalled();
        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });

    test('returns early for null data', () => {
        const gameLog = { dt: '2024-01-01', data: null };
        parsers.addGameLogPopcornPalace(gameLog, 'wrld_123:456');

        expect(deps.setNowPlaying).not.toHaveBeenCalled();
        expect(deps.clearNowPlaying).not.toHaveBeenCalled();
    });

    test('returns early for invalid JSON', () => {
        const gameLog = {
            dt: '2024-01-01',
            data: 'VideoPlay(PopcornPalace) {bad json'
        };
        parsers.addGameLogPopcornPalace(gameLog, 'wrld_123:456');

        expect(deps.setNowPlaying).not.toHaveBeenCalled();
    });

    test('updates existing nowPlaying when URL matches', () => {
        deps.nowPlaying.value.url = 'Movie Title';
        parsers = createMediaParsers(deps);

        const json = JSON.stringify({
            videoName: 'Movie Title',
            videoPos: 500,
            videoLength: 7200,
            thumbnailUrl: '',
            displayName: 'user'
        });
        const gameLog = {
            dt: '2024-01-01',
            data: `VideoPlay(PopcornPalace) ${json}`
        };
        parsers.addGameLogPopcornPalace(gameLog, 'wrld_123:456');

        expect(deps.setNowPlaying).toHaveBeenCalledWith(
            expect.objectContaining({
                updatedAt: '2024-01-01',
                videoPos: 500,
                videoLength: 7200
            })
        );
    });
});
