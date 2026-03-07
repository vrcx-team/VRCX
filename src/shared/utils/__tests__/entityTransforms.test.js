import {
    sanitizeEntityJson,
    createDefaultFavoriteGroupRef,
    createDefaultFavoriteCachedRef
} from '../entityTransforms';

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
