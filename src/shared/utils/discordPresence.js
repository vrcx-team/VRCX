import { ActivityType, StatusDisplayType } from '../constants/discord';

/**
 * RPC world configuration table.
 * Maps worldId → { activityType, statusDisplayType, appId, bigIcon }.
 */
const RPC_WORLD_CONFIGS = new Map([
    // PyPyDance
    [
        'wrld_f20326da-f1ac-45fc-a062-609723b097b1',
        {
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '784094509008551956',
            bigIcon: 'pypy'
        }
    ],
    [
        'wrld_10e5e467-fc65-42ed-8957-f02cace1398c',
        {
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '784094509008551956',
            bigIcon: 'pypy'
        }
    ],
    [
        'wrld_04899f23-e182-4a8d-b2c7-2c74c7c15534',
        {
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '784094509008551956',
            bigIcon: 'pypy'
        }
    ],
    // VR Dancing
    [
        'wrld_42377cf1-c54f-45ed-8996-5875b0573a83',
        {
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '846232616054030376',
            bigIcon: 'vr_dancing'
        }
    ],
    [
        'wrld_dd6d2888-dbdc-47c2-bc98-3d631b2acd7c',
        {
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '846232616054030376',
            bigIcon: 'vr_dancing'
        }
    ],
    // ZuwaZuwa Dance
    [
        'wrld_52bdcdab-11cd-4325-9655-0fb120846945',
        {
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '939473404808007731',
            bigIcon: 'zuwa_zuwa_dance'
        }
    ],
    [
        'wrld_2d40da63-8f1f-4011-8a9e-414eb8530acd',
        {
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '939473404808007731',
            bigIcon: 'zuwa_zuwa_dance'
        }
    ],
    // LS Media
    [
        'wrld_74970324-58e8-4239-a17b-2c59dfdf00db',
        {
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '968292722391785512',
            bigIcon: 'ls_media'
        }
    ],
    [
        'wrld_db9d878f-6e76-4776-8bf2-15bcdd7fc445',
        {
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '968292722391785512',
            bigIcon: 'ls_media'
        }
    ],
    [
        'wrld_435bbf25-f34f-4b8b-82c6-cd809057eb8e',
        {
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '968292722391785512',
            bigIcon: 'ls_media'
        }
    ],
    [
        'wrld_f767d1c8-b249-4ecc-a56f-614e433682c8',
        {
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '968292722391785512',
            bigIcon: 'ls_media'
        }
    ],
    // Popcorn Palace
    [
        'wrld_266523e8-9161-40da-acd0-6bd82e075833',
        {
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '1095440531821170820',
            bigIcon: 'popcorn_palace'
        }
    ],
    [
        'wrld_27c7e6b2-d938-447e-a270-3d1a873e2cf3',
        {
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '1095440531821170820',
            bigIcon: 'popcorn_palace'
        }
    ]
]);

/** Set of Popcorn Palace world IDs (big icon can be overridden by thumbnail) */
const POPCORN_PALACE_WORLD_IDS = new Set([
    'wrld_266523e8-9161-40da-acd0-6bd82e075833',
    'wrld_27c7e6b2-d938-447e-a270-3d1a873e2cf3'
]);

/**
 * Get custom world rpc configuration for a specific world ID.
 * @param {string} worldId
 * @returns {{ activityType: number, statusDisplayType: number, appId: string, bigIcon: string } | null}
 */
export function getRpcWorldConfig(worldId) {
    const config = RPC_WORLD_CONFIGS.get(worldId);
    if (!config) {
        return null;
    }
    return { ...config };
}

/**
 * Check if a world ID is a Popcorn Palace world.
 * @param {string} worldId
 * @returns {boolean}
 */
export function isPopcornPalaceWorld(worldId) {
    return POPCORN_PALACE_WORLD_IDS.has(worldId);
}

/**
 * Get the platform display label for Discord RPC.
 * @param {string} platform - VRC platform string (e.g. 'standalonewindows', 'android')
 * @param {boolean} isGameRunning
 * @param {boolean} isGameNoVR
 * @param {Function} t - i18n translate function
 * @returns {string} Platform label string (e.g. ' (VR)', ' (PC)'), or empty string
 */
export function getPlatformLabel(platform, isGameRunning, isGameNoVR, t) {
    if (isGameRunning) {
        return isGameNoVR
            ? ` (${t('view.settings.discord_presence.rpc.desktop')})`
            : ` (${t('view.settings.discord_presence.rpc.vr')})`;
    }
    switch (platform) {
        case 'web':
            return '';
        case 'standalonewindows':
            return ` (PC)`;
        case 'android':
            return ` (Android)`;
        case 'ios':
            return ` (iOS)`;
        default:
            return platform ? ` (${platform})` : '';
    }
}

/**
 * Get Discord status info from VRC user status.
 * @param {string} status - VRC user status ('active', 'join me', 'ask me', 'busy')
 * @param {boolean} discordHideInvite - Whether invite-hiding is enabled
 * @param {Function} t - i18n translate function
 * @returns {{ statusName: string, statusImage: string, hidePrivate: boolean }}
 */
export function getStatusInfo(status, discordHideInvite, t) {
    switch (status) {
        case 'active':
            return {
                statusName: t('dialog.user.status.active'),
                statusImage: 'active',
                hidePrivate: false
            };
        case 'join me':
            return {
                statusName: t('dialog.user.status.join_me'),
                statusImage: 'joinme',
                hidePrivate: false
            };
        case 'ask me':
            return {
                statusName: t('dialog.user.status.ask_me'),
                statusImage: 'askme',
                hidePrivate: discordHideInvite
            };
        case 'busy':
            return {
                statusName: t('dialog.user.status.busy'),
                statusImage: 'busy',
                hidePrivate: true
            };
        default:
            return {
                statusName: t('dialog.user.status.offline'),
                statusImage: 'offline',
                hidePrivate: true
            };
    }
}
