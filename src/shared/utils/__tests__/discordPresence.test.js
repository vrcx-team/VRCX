import { describe, expect, test, vi } from 'vitest';

import {
    getPlatformLabel,
    getStatusInfo,
    getRpcWorldConfig,
    isPopcornPalaceWorld
} from '../discordPresence';
import { ActivityType, StatusDisplayType } from '../../constants/discord';

const t = (key) => key;

describe('getPlatformLabel', () => {
    test('returns VR label when game is running in VR', () => {
        const result = getPlatformLabel('standalonewindows', true, false, t);
        expect(result).toBe(' (view.settings.discord_presence.rpc.vr)');
    });

    test('returns desktop label when game is running in desktop mode', () => {
        const result = getPlatformLabel('standalonewindows', true, true, t);
        expect(result).toBe(' (view.settings.discord_presence.rpc.desktop)');
    });

    test('returns empty string for web platform', () => {
        expect(getPlatformLabel('web', false, false, t)).toBe('');
    });

    test('returns (PC) for standalonewindows', () => {
        expect(getPlatformLabel('standalonewindows', false, false, t)).toBe(
            ' (PC)'
        );
    });

    test('returns (Android) for android', () => {
        expect(getPlatformLabel('android', false, false, t)).toBe(' (Android)');
    });

    test('returns (iOS) for ios', () => {
        expect(getPlatformLabel('ios', false, false, t)).toBe(' (iOS)');
    });

    test('returns platform name in parens for unknown platform', () => {
        expect(getPlatformLabel('quest', false, false, t)).toBe(' (quest)');
    });

    test('returns empty string for empty/falsy platform when not game running', () => {
        expect(getPlatformLabel('', false, false, t)).toBe('');
        expect(getPlatformLabel(undefined, false, false, t)).toBe('');
    });
});

describe('getStatusInfo', () => {
    test('active status', () => {
        const result = getStatusInfo('active', false, t);
        expect(result).toEqual({
            statusName: 'dialog.user.status.active',
            statusImage: 'active',
            hidePrivate: false
        });
    });

    test('join me status', () => {
        const result = getStatusInfo('join me', false, t);
        expect(result).toEqual({
            statusName: 'dialog.user.status.join_me',
            statusImage: 'joinme',
            hidePrivate: false
        });
    });

    test('ask me status without hide invite', () => {
        const result = getStatusInfo('ask me', false, t);
        expect(result).toEqual({
            statusName: 'dialog.user.status.ask_me',
            statusImage: 'askme',
            hidePrivate: false
        });
    });

    test('ask me status with hide invite', () => {
        const result = getStatusInfo('ask me', true, t);
        expect(result).toEqual({
            statusName: 'dialog.user.status.ask_me',
            statusImage: 'askme',
            hidePrivate: true
        });
    });

    test('busy status always hides private', () => {
        const result = getStatusInfo('busy', false, t);
        expect(result).toEqual({
            statusName: 'dialog.user.status.busy',
            statusImage: 'busy',
            hidePrivate: true
        });
    });

    test('unknown status defaults to offline', () => {
        const result = getStatusInfo('unknown', false, t);
        expect(result).toEqual({
            statusName: 'dialog.user.status.offline',
            statusImage: 'offline',
            hidePrivate: true
        });
    });

    test('empty status defaults to offline', () => {
        const result = getStatusInfo('', false, t);
        expect(result).toEqual({
            statusName: 'dialog.user.status.offline',
            statusImage: 'offline',
            hidePrivate: true
        });
    });
});

describe('getRpcWorldConfig', () => {
    test('returns PyPyDance config for known PyPyDance world', () => {
        const config = getRpcWorldConfig(
            'wrld_f20326da-f1ac-45fc-a062-609723b097b1'
        );
        expect(config).toEqual({
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '784094509008551956',
            bigIcon: 'pypy'
        });
    });

    test('returns VR Dancing config', () => {
        const config = getRpcWorldConfig(
            'wrld_42377cf1-c54f-45ed-8996-5875b0573a83'
        );
        expect(config).toEqual({
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '846232616054030376',
            bigIcon: 'vr_dancing'
        });
    });

    test('returns ZuwaZuwa Dance config', () => {
        const config = getRpcWorldConfig(
            'wrld_52bdcdab-11cd-4325-9655-0fb120846945'
        );
        expect(config).toEqual({
            activityType: ActivityType.Listening,
            statusDisplayType: StatusDisplayType.Details,
            appId: '939473404808007731',
            bigIcon: 'zuwa_zuwa_dance'
        });
    });

    test('returns LS Media config', () => {
        const config = getRpcWorldConfig(
            'wrld_74970324-58e8-4239-a17b-2c59dfdf00db'
        );
        expect(config).toEqual({
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '968292722391785512',
            bigIcon: 'ls_media'
        });
    });

    test('returns Popcorn Palace config', () => {
        const config = getRpcWorldConfig(
            'wrld_266523e8-9161-40da-acd0-6bd82e075833'
        );
        expect(config).toEqual({
            activityType: ActivityType.Watching,
            statusDisplayType: StatusDisplayType.Details,
            appId: '1095440531821170820',
            bigIcon: 'popcorn_palace'
        });
    });

    test('returns null for unknown world', () => {
        expect(getRpcWorldConfig('wrld_unknown')).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(getRpcWorldConfig('')).toBeNull();
    });

    test('returns a copy, not the original object', () => {
        const a = getRpcWorldConfig(
            'wrld_f20326da-f1ac-45fc-a062-609723b097b1'
        );
        const b = getRpcWorldConfig(
            'wrld_f20326da-f1ac-45fc-a062-609723b097b1'
        );
        expect(a).toEqual(b);
        expect(a).not.toBe(b);
    });

    test('covers all PyPyDance world IDs', () => {
        const pypyIds = [
            'wrld_f20326da-f1ac-45fc-a062-609723b097b1',
            'wrld_10e5e467-fc65-42ed-8957-f02cace1398c',
            'wrld_04899f23-e182-4a8d-b2c7-2c74c7c15534'
        ];
        for (const id of pypyIds) {
            const config = getRpcWorldConfig(id);
            expect(config.appId).toBe('784094509008551956');
            expect(config.bigIcon).toBe('pypy');
        }
    });

    test('covers all LS Media world IDs', () => {
        const lsIds = [
            'wrld_74970324-58e8-4239-a17b-2c59dfdf00db',
            'wrld_db9d878f-6e76-4776-8bf2-15bcdd7fc445',
            'wrld_435bbf25-f34f-4b8b-82c6-cd809057eb8e',
            'wrld_f767d1c8-b249-4ecc-a56f-614e433682c8'
        ];
        for (const id of lsIds) {
            const config = getRpcWorldConfig(id);
            expect(config.appId).toBe('968292722391785512');
            expect(config.bigIcon).toBe('ls_media');
        }
    });
});

describe('isPopcornPalaceWorld', () => {
    test('returns true for Popcorn Palace worlds', () => {
        expect(
            isPopcornPalaceWorld('wrld_266523e8-9161-40da-acd0-6bd82e075833')
        ).toBe(true);
        expect(
            isPopcornPalaceWorld('wrld_27c7e6b2-d938-447e-a270-3d1a873e2cf3')
        ).toBe(true);
    });

    test('returns false for non-Popcorn Palace worlds', () => {
        expect(
            isPopcornPalaceWorld('wrld_f20326da-f1ac-45fc-a062-609723b097b1')
        ).toBe(false);
        expect(isPopcornPalaceWorld('wrld_unknown')).toBe(false);
    });
});
