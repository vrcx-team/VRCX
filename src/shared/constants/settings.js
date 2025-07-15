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

const branches = {
    Stable: {
        name: 'Stable',
        urlReleases: 'https://api0.vrcx.app/releases/stable',
        urlLatest: 'https://api0.vrcx.app/releases/stable/latest'
    },
    Nightly: {
        name: 'Nightly',
        urlReleases: 'https://api0.vrcx.app/releases/nightly',
        urlLatest: 'https://api0.vrcx.app/releases/nightly/latest'
    }
    // LinuxTest: {
    //     name: 'LinuxTest',
    //     urlReleases: 'https://api.github.com/repos/rs189/VRCX/releases',
    //     urlLatest:
    //         'https://api.github.com/repos/rs189/VRCX/releases/latest'
    // }
};

export { VRChatScreenshotResolutions, VRChatCameraResolutions, branches };
