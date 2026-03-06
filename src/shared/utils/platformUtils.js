/**
 * @param {object} unityPackages
 * @returns {{ isPC: boolean, isQuest: boolean, isIos: boolean }}
 */
function getAvailablePlatforms(unityPackages) {
    let isPC = false;
    let isQuest = false;
    let isIos = false;
    if (typeof unityPackages === 'object') {
        for (const unityPackage of unityPackages) {
            if (
                unityPackage.variant &&
                unityPackage.variant !== 'standard' &&
                unityPackage.variant !== 'security'
            ) {
                continue;
            }
            if (unityPackage.platform === 'standalonewindows') {
                isPC = true;
            } else if (unityPackage.platform === 'android') {
                isQuest = true;
            } else if (unityPackage.platform === 'ios') {
                isIos = true;
            }
        }
    }
    return { isPC, isQuest, isIos };
}

export { getAvailablePlatforms };
