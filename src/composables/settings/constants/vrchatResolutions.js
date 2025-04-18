function getVRChatResolution(res) {
    switch (res) {
        case '1280x720':
            return '1280x720 (720p)';
        case '1920x1080':
            return '1920x1080 (1080p)';
        case '2560x1440':
            return '2560x1440 (2K)';
        case '3840x2160':
            return '3840x2160 (4K)';
        case '7680x4320':
            return '7680x4320 (8K)';
    }
    return `${res} (Custom)`;
}

const VRChatScreenshotResolutions = [
    { name: '1280x720 (720p)', width: 1280, height: 720 },
    { name: '1920x1080 (1080p Default)', width: '', height: '' },
    { name: '2560x1440 (1440p)', width: 2560, height: 1440 },
    { name: '3840x2160 (4K)', width: 3840, height: 2160 }
];

const VRChatCameraResolutions = [
    { name: '1280x720 (720p)', width: 1280, height: 720 },
    { name: '1920x1080 (1080p Default)', width: '', height: '' },
    { name: '2560x1440 (1440p)', width: 2560, height: 1440 },
    { name: '3840x2160 (4K)', width: 3840, height: 2160 },
    { name: '7680x4320 (8K)', width: 7680, height: 4320 }
];

export {
    getVRChatResolution,
    VRChatScreenshotResolutions,
    VRChatCameraResolutions
};
