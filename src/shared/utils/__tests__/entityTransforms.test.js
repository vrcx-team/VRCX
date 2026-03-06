import {
    sanitizeUserJson,
    sanitizeEntityJson,
    computeTrustLevel,
    computeUserPlatform,
    computeDisabledContentSettings,
    diffObjectProps,
    createDefaultUserRef,
    createDefaultWorldRef,
    createDefaultAvatarRef,
    createDefaultGroupRef,
    createDefaultInstanceRef,
    createDefaultFavoriteGroupRef,
    createDefaultFavoriteCachedRef
} from '../entityTransforms';

describe('sanitizeUserJson', () => {
    it('applies replaceBioSymbols to statusDescription, bio, note', () => {
        const json = {
            statusDescription: 'hello？ world',
            bio: 'test＃ bio',
            note: 'test＠ note'
        };
        sanitizeUserJson(json, '');
        // replaceBioSymbols replaces Unicode look-alikes with ASCII
        expect(json.statusDescription).toContain('?');
        expect(json.bio).toContain('#');
        expect(json.note).toContain('@');
    });

    it('removes emojis from statusDescription', () => {
        const json = { statusDescription: 'hello 🎉 world' };
        sanitizeUserJson(json, '');
        // removeEmojis removes emoji then collapses whitespace
        expect(json.statusDescription).toBe('hello world');
    });

    it('strips robot avatar URL', () => {
        const robotUrl = 'https://example.com/robot.png';
        const json = {
            currentAvatarImageUrl: robotUrl,
            currentAvatarThumbnailImageUrl: 'thumb.png'
        };
        sanitizeUserJson(json, robotUrl);
        expect(json.currentAvatarImageUrl).toBeUndefined();
        expect(json.currentAvatarThumbnailImageUrl).toBeUndefined();
    });

    it('keeps avatar URL when it does not match robot', () => {
        const json = {
            currentAvatarImageUrl: 'https://example.com/user.png',
            currentAvatarThumbnailImageUrl: 'thumb.png'
        };
        sanitizeUserJson(json, 'https://example.com/robot.png');
        expect(json.currentAvatarImageUrl).toBe('https://example.com/user.png');
    });

    it('handles missing fields gracefully', () => {
        const json = { id: 'usr_123' };
        expect(() => sanitizeUserJson(json, '')).not.toThrow();
    });
});

describe('sanitizeEntityJson', () => {
    it('applies replaceBioSymbols to specified fields', () => {
        const json = {
            name: 'hello？',
            description: 'test＃',
            other: 'unchanged＠'
        };
        sanitizeEntityJson(json, ['name', 'description']);
        expect(json.name).toContain('?');
        expect(json.description).toContain('#');
        expect(json.other).toContain('＠'); // not sanitized, still has Unicode
    });

    it('skips falsy fields', () => {
        const json = { name: '', description: null };
        expect(() =>
            sanitizeEntityJson(json, ['name', 'description'])
        ).not.toThrow();
    });
});

describe('computeTrustLevel', () => {
    it('returns Visitor for empty tags', () => {
        const result = computeTrustLevel([], '');
        expect(result.trustLevel).toBe('Visitor');
        expect(result.trustClass).toBe('x-tag-untrusted');
        expect(result.trustColorKey).toBe('untrusted');
        expect(result.trustSortNum).toBe(1);
    });

    it('returns Trusted User for veteran tags', () => {
        const result = computeTrustLevel(['system_trust_veteran'], '');
        expect(result.trustLevel).toBe('Trusted User');
        expect(result.trustClass).toBe('x-tag-veteran');
        expect(result.trustColorKey).toBe('veteran');
        expect(result.trustSortNum).toBe(5);
    });

    it('returns Known User for trusted tags', () => {
        const result = computeTrustLevel(['system_trust_trusted'], '');
        expect(result.trustLevel).toBe('Known User');
        expect(result.trustSortNum).toBe(4);
    });

    it('returns User for known tags', () => {
        const result = computeTrustLevel(['system_trust_known'], '');
        expect(result.trustLevel).toBe('User');
        expect(result.trustSortNum).toBe(3);
    });

    it('returns New User for basic tags', () => {
        const result = computeTrustLevel(['system_trust_basic'], '');
        expect(result.trustLevel).toBe('New User');
        expect(result.trustSortNum).toBe(2);
    });

    it('detects troll status', () => {
        const result = computeTrustLevel(
            ['system_troll', 'system_trust_known'],
            ''
        );
        expect(result.isTroll).toBe(true);
        expect(result.trustColorKey).toBe('troll');
        expect(result.trustSortNum).toBeCloseTo(3.1); // 3 + 0.1
    });

    it('detects probable troll when not already troll', () => {
        const result = computeTrustLevel(
            ['system_probable_troll', 'system_trust_basic'],
            ''
        );
        expect(result.isProbableTroll).toBe(true);
        expect(result.isTroll).toBe(false);
        expect(result.trustColorKey).toBe('troll');
    });

    it('probable troll is not set when already troll', () => {
        const result = computeTrustLevel(
            ['system_troll', 'system_probable_troll'],
            ''
        );
        expect(result.isTroll).toBe(true);
        expect(result.isProbableTroll).toBe(false);
    });

    it('detects moderator from developerType', () => {
        const result = computeTrustLevel([], 'internal');
        expect(result.isModerator).toBe(true);
        expect(result.trustColorKey).toBe('vip');
        expect(result.trustSortNum).toBeCloseTo(1.3); // 1 + 0.3
    });

    it('detects moderator from admin_moderator tag', () => {
        const result = computeTrustLevel(
            ['admin_moderator', 'system_trust_veteran'],
            ''
        );
        expect(result.isModerator).toBe(true);
        expect(result.trustColorKey).toBe('vip');
    });

    it('does not treat "none" developerType as moderator', () => {
        const result = computeTrustLevel([], 'none');
        expect(result.isModerator).toBe(false);
    });
});

describe('computeUserPlatform', () => {
    it('returns platform when valid', () => {
        expect(computeUserPlatform('standalonewindows', 'android')).toBe(
            'standalonewindows'
        );
    });

    it('falls back to last_platform when platform is "offline"', () => {
        expect(computeUserPlatform('offline', 'android')).toBe('android');
    });

    it('falls back to last_platform when platform is "web"', () => {
        expect(computeUserPlatform('web', 'ios')).toBe('ios');
    });

    it('falls back to last_platform when platform is empty', () => {
        expect(computeUserPlatform('', 'standalonewindows')).toBe(
            'standalonewindows'
        );
    });

    it('returns empty string when both are empty', () => {
        expect(computeUserPlatform('', '')).toBe('');
    });
});

describe('computeDisabledContentSettings', () => {
    const settingsList = ['gore', 'nudity', 'violence'];

    it('returns empty for null contentSettings', () => {
        expect(computeDisabledContentSettings(null, settingsList)).toEqual([]);
    });

    it('returns empty for empty object', () => {
        expect(computeDisabledContentSettings({}, settingsList)).toEqual([]);
    });

    it('returns disabled settings (false values)', () => {
        const result = computeDisabledContentSettings(
            { gore: false, nudity: true, violence: false },
            settingsList
        );
        expect(result).toEqual(['gore', 'violence']);
    });

    it('skips undefined settings', () => {
        const result = computeDisabledContentSettings(
            { gore: true },
            settingsList
        );
        expect(result).toEqual([]);
    });
});

describe('diffObjectProps', () => {
    const arraysMatch = (a, b) =>
        a.length === b.length && a.every((v, i) => v === b[i]);

    it('detects changed primitive props', () => {
        const ref = { name: 'old', id: '1' };
        const json = { name: 'new', id: '1' };
        const result = diffObjectProps(ref, json, arraysMatch);
        expect(result.hasPropChanged).toBe(true);
        expect(result.changedProps.name).toEqual(['new', 'old']);
    });

    it('detects unchanged props', () => {
        const ref = { name: 'same', id: '1' };
        const json = { name: 'same', id: '1' };
        const result = diffObjectProps(ref, json, arraysMatch);
        expect(result.hasPropChanged).toBe(false);
    });

    it('detects changed arrays', () => {
        const ref = { tags: ['a', 'b'] };
        const json = { tags: ['a', 'c'] };
        const result = diffObjectProps(ref, json, arraysMatch);
        expect(result.hasPropChanged).toBe(true);
        expect(result.changedProps.tags).toBeDefined();
    });

    it('ignores props only in json (not in ref)', () => {
        const ref = { id: '1' };
        const json = { id: '1', newProp: 'value' };
        const result = diffObjectProps(ref, json, arraysMatch);
        expect(result.hasPropChanged).toBe(false);
    });

    it('ignores props only in ref (not in json)', () => {
        const ref = { id: '1', extra: 'value' };
        const json = { id: '1' };
        const result = diffObjectProps(ref, json, arraysMatch);
        expect(result.hasPropChanged).toBe(false);
    });
});

describe('createDefaultUserRef', () => {
    it('creates object with defaults', () => {
        const ref = createDefaultUserRef({});
        expect(ref.id).toBe('');
        expect(ref.displayName).toBe('');
        expect(ref.tags).toEqual([]);
        expect(ref.$trustLevel).toBe('Visitor');
        expect(ref.$platform).toBe('');
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultUserRef({
            id: 'usr_123',
            displayName: 'Test'
        });
        expect(ref.id).toBe('usr_123');
        expect(ref.displayName).toBe('Test');
        expect(ref.bio).toBe('');
    });
});

describe('createDefaultWorldRef', () => {
    it('creates object with defaults', () => {
        const ref = createDefaultWorldRef({});
        expect(ref.id).toBe('');
        expect(ref.name).toBe('');
        expect(ref.capacity).toBe(0);
        expect(ref.$isLabs).toBe(false);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultWorldRef({
            id: 'wrld_123',
            name: 'Test World'
        });
        expect(ref.id).toBe('wrld_123');
        expect(ref.name).toBe('Test World');
    });
});

describe('createDefaultAvatarRef', () => {
    it('creates object with defaults', () => {
        const ref = createDefaultAvatarRef({});
        expect(ref.id).toBe('');
        expect(ref.name).toBe('');
        expect(ref.version).toBe(0);
        expect(ref.tags).toEqual([]);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultAvatarRef({
            id: 'avtr_123',
            name: 'My Avatar'
        });
        expect(ref.id).toBe('avtr_123');
        expect(ref.name).toBe('My Avatar');
    });
});

describe('createDefaultGroupRef', () => {
    it('creates object with defaults including myMember', () => {
        const ref = createDefaultGroupRef({});
        expect(ref.id).toBe('');
        expect(ref.name).toBe('');
        expect(ref.myMember).toBeDefined();
        expect(ref.myMember.roleIds).toEqual([]);
        expect(ref.roles).toEqual([]);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultGroupRef({
            id: 'grp_123',
            name: 'Test Group'
        });
        expect(ref.id).toBe('grp_123');
    });
});

describe('createDefaultInstanceRef', () => {
    it('creates object with defaults', () => {
        const ref = createDefaultInstanceRef({});
        expect(ref.id).toBe('');
        expect(ref.capacity).toBe(0);
        expect(ref.hasCapacityForYou).toBe(true);
        expect(ref.$fetchedAt).toBe('');
        expect(ref.$disabledContentSettings).toEqual([]);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultInstanceRef({
            id: 'wrld_123:12345',
            capacity: 40
        });
        expect(ref.id).toBe('wrld_123:12345');
        expect(ref.capacity).toBe(40);
    });
});

describe('createDefaultFavoriteGroupRef', () => {
    it('creates object with defaults', () => {
        const ref = createDefaultFavoriteGroupRef({});
        expect(ref.id).toBe('');
        expect(ref.name).toBe('');
        expect(ref.displayName).toBe('');
        expect(ref.type).toBe('');
        expect(ref.visibility).toBe('');
        expect(ref.tags).toEqual([]);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultFavoriteGroupRef({
            id: 'fvgrp_1',
            name: 'group_0',
            displayName: 'Group 1',
            type: 'friend'
        });
        expect(ref.id).toBe('fvgrp_1');
        expect(ref.name).toBe('group_0');
        expect(ref.displayName).toBe('Group 1');
        expect(ref.type).toBe('friend');
    });
});

describe('createDefaultFavoriteCachedRef', () => {
    it('creates object with defaults and computes $groupKey', () => {
        const ref = createDefaultFavoriteCachedRef({});
        expect(ref.id).toBe('');
        expect(ref.type).toBe('');
        expect(ref.favoriteId).toBe('');
        expect(ref.tags).toEqual([]);
        expect(ref.$groupKey).toBe(':undefined');
    });

    it('computes $groupKey from type and first tag', () => {
        const ref = createDefaultFavoriteCachedRef({
            id: 'fav_1',
            type: 'friend',
            favoriteId: 'usr_123',
            tags: ['group_0']
        });
        expect(ref.$groupKey).toBe('friend:group_0');
        expect(ref.favoriteId).toBe('usr_123');
    });

    it('handles multiple tags (uses first)', () => {
        const ref = createDefaultFavoriteCachedRef({
            type: 'world',
            tags: ['worlds1', 'worlds2']
        });
        expect(ref.$groupKey).toBe('world:worlds1');
    });
});
