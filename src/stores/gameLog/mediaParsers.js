import {
    convertYoutubeTime,
    findUserByDisplayName,
    isRpcWorld,
    replaceBioSymbols
} from '../../shared/utils';

/**
 * Creates the media parser functions for the GameLog store.
 * @param {object} deps
 * @param {import('vue').Ref} deps.nowPlaying
 * @param {Function} deps.setNowPlaying
 * @param {Function} deps.clearNowPlaying
 * @param {object} deps.userStore      – needs `.cachedUsers`
 * @param {object} deps.advancedSettingsStore – needs `.youTubeApi`, `.lookupYouTubeVideo()`
 * @returns {object} The media parser functions
 */
export function createMediaParsers({
    nowPlaying,
    setNowPlaying,
    clearNowPlaying,
    userStore,
    advancedSettingsStore
}) {
    async function addGameLogVideo(gameLog, location, userId) {
        let url;
        const videoUrl = gameLog.videoUrl;
        let youtubeVideoId = '';
        let videoId = '';
        let videoName = '';
        let videoLength = 0;
        let displayName = '';
        let videoPos = 8; // video loading delay
        if (typeof gameLog.displayName !== 'undefined') {
            displayName = gameLog.displayName;
        }
        if (typeof gameLog.videoPos !== 'undefined') {
            videoPos = gameLog.videoPos;
        }
        if (!isRpcWorld(location) || gameLog.videoId === 'YouTube') {
            // skip PyPyDance and VRDancing videos
            try {
                url = new URL(videoUrl);
                if (
                    url.origin === 'https://t-ne.x0.to' ||
                    url.origin === 'https://nextnex.com' ||
                    url.origin === 'https://r.0cm.org'
                ) {
                    url = new URL(url.searchParams.get('url'));
                }
                if (videoUrl.startsWith('https://u2b.cx/')) {
                    url = new URL(videoUrl.substring(15));
                }
                const id1 = url.pathname;
                const id2 = url.searchParams.get('v');
                if (id1 && id1.length === 12) {
                    // https://youtu.be/
                    youtubeVideoId = id1.substring(1, 12);
                }
                if (id1 && id1.length === 19) {
                    // https://www.youtube.com/shorts/
                    youtubeVideoId = id1.substring(8, 19);
                }
                if (id2 && id2.length === 11) {
                    // https://www.youtube.com/watch?v=
                    // https://music.youtube.com/watch?v=
                    youtubeVideoId = id2;
                }
                if (advancedSettingsStore.youTubeApi && youtubeVideoId) {
                    const data =
                        await advancedSettingsStore.lookupYouTubeVideo(
                            youtubeVideoId
                        );
                    if (data || data.pageInfo.totalResults !== 0) {
                        videoId = 'YouTube';
                        videoName = data.items[0].snippet.title;
                        videoLength = convertYoutubeTime(
                            data.items[0].contentDetails.duration
                        );
                    }
                }
            } catch {
                console.error(`Invalid URL: ${url}`);
            }
            const entry = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry);
        }
    }

    function addGameLogPyPyDance(gameLog, location) {
        const data =
            /VideoPlay\(PyPyDance\) "(.+?)",([\d.]+),([\d.]+),"(.*)"/g.exec(
                gameLog.data
            );
        if (!data) {
            console.error('failed to parse', gameLog.data);
            return;
        }
        const videoUrl = data[1];
        const videoPos = Number(data[2]);
        const videoLength = Number(data[3]);
        const title = data[4];
        const bracketArray = title.split('(');
        const text1 = bracketArray.pop();
        let displayName = text1.slice(0, -1);
        let text2 = bracketArray.join('(');
        let videoId = '';
        if (text2 === 'Custom URL') {
            videoId = 'YouTube';
        } else {
            videoId = text2.substr(0, text2.indexOf(':') - 1);
            text2 = text2.substr(text2.indexOf(':') + 2);
        }
        const videoName = text2.slice(0, -1);
        if (displayName === 'Random') {
            displayName = '';
        }
        if (videoUrl === nowPlaying.value.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            userId =
                findUserByDisplayName(
                    userStore.cachedUsers,
                    displayName,
                    userStore.cachedUserIdsByDisplayName
                )?.id ?? '';
        }
        if (videoId === 'YouTube') {
            const entry1 = {
                dt: gameLog.dt,
                videoUrl,
                displayName,
                videoPos,
                videoId
            };
            addGameLogVideo(entry1, location, userId);
        } else {
            const entry2 = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry2);
        }
    }

    function addGameLogVRDancing(gameLog, location) {
        const data =
            /VideoPlay\(VRDancing\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                gameLog.data
            );
        if (!data) {
            console.error('failed to parse', gameLog.data);
            return;
        }
        const videoUrl = data[1];
        let videoPos = Number(data[2]);
        const videoLength = Number(data[3]);
        let videoId = data[4];
        const displayName = data[5];
        let videoName = data[6];
        if (videoId === '-1') {
            videoId = 'YouTube';
        }
        const videoNameIndex = videoName.indexOf(']</b> ');
        if (videoNameIndex !== -1) {
            videoName = videoName.substring(videoNameIndex + 6);
        }
        if (videoPos === videoLength) {
            // ummm okay
            videoPos = 0;
        }
        if (videoUrl === nowPlaying.value.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            userId =
                findUserByDisplayName(
                    userStore.cachedUsers,
                    displayName,
                    userStore.cachedUserIdsByDisplayName
                )?.id ?? '';
        }
        if (videoId === 'YouTube') {
            const entry1 = {
                dt: gameLog.dt,
                videoUrl,
                displayName,
                videoPos,
                videoId
            };
            addGameLogVideo(entry1, location, userId);
        } else {
            const entry2 = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry2);
        }
    }

    function addGameLogZuwaZuwaDance(gameLog, location) {
        const data =
            /VideoPlay\(ZuwaZuwaDance\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                gameLog.data
            );
        if (!data) {
            console.error('failed to parse', gameLog.data);
            return;
        }
        const videoUrl = data[1];
        const videoPos = Number(data[2]);
        const videoLength = Number(data[3]);
        let videoId = data[4];
        let displayName = data[5];
        const videoName = data[6];
        if (displayName === 'Random') {
            displayName = '';
        }
        if (videoId === '9999') {
            videoId = 'YouTube';
        }
        if (videoUrl === nowPlaying.value.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            userId =
                findUserByDisplayName(
                    userStore.cachedUsers,
                    displayName,
                    userStore.cachedUserIdsByDisplayName
                )?.id ?? '';
        }
        if (videoId === 'YouTube') {
            const entry1 = {
                dt: gameLog.dt,
                videoUrl,
                displayName,
                videoPos,
                videoId
            };
            addGameLogVideo(entry1, location, userId);
        } else {
            const entry2 = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry2);
        }
    }

    function addGameLogLSMedia(gameLog, location) {
        // [VRCX] LSMedia 0,4268.981,Natsumi-sama,,
        // [VRCX] LSMedia 0,6298.292,Natsumi-sama,The Outfit (2022), 1080p
        const data = /LSMedia ([\d.]+),([\d.]+),(.+?),(.+?),(?=[^,]*$)/g.exec(
            gameLog.data
        );
        if (!data) {
            return;
        }
        const videoPos = Number(data[1]);
        const videoLength = Number(data[2]);
        const displayName = data[3];
        const videoName = replaceBioSymbols(data[4]);
        const videoUrl = videoName;
        const videoId = 'LSMedia';
        if (videoUrl === nowPlaying.value.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            userId =
                findUserByDisplayName(
                    userStore.cachedUsers,
                    displayName,
                    userStore.cachedUserIdsByDisplayName
                )?.id ?? '';
        }
        const entry1 = {
            created_at: gameLog.dt,
            type: 'VideoPlay',
            videoUrl,
            videoId,
            videoName,
            videoLength,
            location,
            displayName,
            userId,
            videoPos
        };
        setNowPlaying(entry1);
    }

    function addGameLogPopcornPalace(gameLog, location) {
        // [VRCX] VideoPlay(PopcornPalace) {"videoName": "How to Train Your Dragon - 2025-06-06", "videoPos": 37.28777, "videoLength": 11474.05, "thumbnailUrl": "", "displayName": "miner28_3", "isPaused": false, "is3D": false, "looping": false}
        let data = gameLog.data;
        if (!data) {
            return;
        }
        try {
            const j = data.indexOf('{');
            data = JSON.parse(data.substring(j));
        } catch (err) {
            console.error('Failed to parse PopcornPalace data:', err);
            return;
        }

        const videoPos = Number(data.videoPos);
        const videoLength = Number(data.videoLength);
        const displayName = data.displayName || '';
        const videoName = data.videoName || '';
        const videoUrl = videoName;
        const videoId = 'PopcornPalace';
        const thumbnailUrl = data.thumbnailUrl || '';
        if (!videoName) {
            clearNowPlaying();
            return;
        }
        if (videoUrl === nowPlaying.value.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos,
                thumbnailUrl
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            userId =
                findUserByDisplayName(
                    userStore.cachedUsers,
                    displayName,
                    userStore.cachedUserIdsByDisplayName
                )?.id ?? '';
        }
        const entry1 = {
            created_at: gameLog.dt,
            type: 'VideoPlay',
            videoUrl,
            videoId,
            videoName,
            videoLength,
            location,
            displayName,
            userId,
            videoPos,
            thumbnailUrl
        };
        setNowPlaying(entry1);
    }

    return {
        addGameLogVideo,
        addGameLogPyPyDance,
        addGameLogVRDancing,
        addGameLogZuwaZuwaDance,
        addGameLogLSMedia,
        addGameLogPopcornPalace
    };
}
