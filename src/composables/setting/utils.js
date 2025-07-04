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

export { getVRChatResolution };
