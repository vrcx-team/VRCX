import { describe, it, expect, vi } from 'vitest';
import {
    sanitizeNotificationJson,
    parseNotificationDetails,
    createDefaultNotificationRef,
    createDefaultNotificationV2Ref,
    applyBoopLegacyHandling
} from '../notificationTransforms';

describe('sanitizeNotificationJson', () => {
    it('should remove null and undefined values', () => {
        const json = { id: '1', message: null, type: undefined, seen: false };
        const result = sanitizeNotificationJson(json);
        expect(result).not.toHaveProperty('message');
        expect(result).not.toHaveProperty('type');
        expect(result).toHaveProperty('id', '1');
        expect(result).toHaveProperty('seen', false);
    });

    it('should apply replaceBioSymbols to message', () => {
        // replaceBioSymbols replaces Unicode look-alikes with ASCII, not zero-width spaces
        const json = { message: 'hello？ world' };
        const result = sanitizeNotificationJson(json);
        expect(result.message).toContain('?');
    });

    it('should apply replaceBioSymbols to title', () => {
        const json = { title: 'hello？ world' };
        const result = sanitizeNotificationJson(json);
        expect(result.title).toContain('?');
    });

    it('should not touch other fields', () => {
        const json = { id: 'abc', seen: true, details: { x: 1 } };
        const result = sanitizeNotificationJson(json);
        expect(result).toEqual({ id: 'abc', seen: true, details: { x: 1 } });
    });

    it('should mutate and return the same object', () => {
        const json = { id: '1', bad: null };
        const result = sanitizeNotificationJson(json);
        expect(result).toBe(json);
    });
});

describe('parseNotificationDetails', () => {
    it('should return object details as-is', () => {
        const details = { worldId: 'wrld_123' };
        expect(parseNotificationDetails(details)).toBe(details);
    });

    it('should parse JSON string details', () => {
        const details = '{"worldId":"wrld_123"}';
        expect(parseNotificationDetails(details)).toEqual({
            worldId: 'wrld_123'
        });
    });

    it('should return empty object for "{}"', () => {
        expect(parseNotificationDetails('{}')).toEqual({});
    });

    it('should return empty object for invalid JSON', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
        expect(parseNotificationDetails('not json')).toEqual({});
        spy.mockRestore();
    });

    it('should return parsed array for JSON array string (arrays are objects)', () => {
        expect(parseNotificationDetails('[1,2]')).toEqual([1, 2]);
    });

    it('should return empty object for null', () => {
        expect(parseNotificationDetails(null)).toEqual({});
    });

    it('should return empty object for undefined', () => {
        expect(parseNotificationDetails(undefined)).toEqual({});
    });
});

describe('createDefaultNotificationRef', () => {
    it('should create a ref with all default fields', () => {
        const ref = createDefaultNotificationRef({});
        expect(ref).toEqual({
            id: '',
            senderUserId: '',
            senderUsername: '',
            type: '',
            message: '',
            details: {},
            seen: false,
            created_at: '',
            $isExpired: false
        });
    });

    it('should merge json over defaults', () => {
        const ref = createDefaultNotificationRef({
            id: 'noti_1',
            type: 'friendRequest',
            senderUserId: 'usr_abc'
        });
        expect(ref.id).toBe('noti_1');
        expect(ref.type).toBe('friendRequest');
        expect(ref.senderUserId).toBe('usr_abc');
        expect(ref.message).toBe('');
    });

    it('should parse string details', () => {
        const ref = createDefaultNotificationRef({
            details: '{"worldId":"wrld_1"}'
        });
        expect(ref.details).toEqual({ worldId: 'wrld_1' });
    });

    it('should keep object details', () => {
        const details = { worldId: 'wrld_1' };
        const ref = createDefaultNotificationRef({ details });
        expect(ref.details).toBe(details);
    });
});

describe('createDefaultNotificationV2Ref', () => {
    it('should create a ref with all default V2 fields', () => {
        const ref = createDefaultNotificationV2Ref({});
        expect(ref).toMatchObject({
            id: '',
            createdAt: '',
            updatedAt: '',
            expiresAt: '',
            type: '',
            link: '',
            linkText: '',
            message: '',
            title: '',
            imageUrl: '',
            seen: false,
            senderUserId: '',
            senderUsername: '',
            version: 2
        });
        expect(ref.data).toEqual({});
        expect(ref.responses).toEqual([]);
        expect(ref.details).toEqual({});
    });

    it('should merge json over defaults', () => {
        const ref = createDefaultNotificationV2Ref({
            id: 'noti_v2',
            type: 'boop',
            seen: true
        });
        expect(ref.id).toBe('noti_v2');
        expect(ref.type).toBe('boop');
        expect(ref.seen).toBe(true);
    });
});

describe('applyBoopLegacyHandling', () => {
    it('should not modify non-boop notifications', () => {
        const ref = {
            type: 'friendRequest',
            title: 'Hello',
            message: '',
            imageUrl: ''
        };
        applyBoopLegacyHandling(ref, 'https://api.example.com');
        expect(ref.title).toBe('Hello');
        expect(ref.message).toBe('');
    });

    it('should not modify boop without title', () => {
        const ref = {
            type: 'boop',
            title: '',
            message: 'existing',
            imageUrl: ''
        };
        applyBoopLegacyHandling(ref, 'https://api.example.com');
        expect(ref.message).toBe('existing');
    });

    it('should handle default emoji boops', () => {
        const ref = {
            type: 'boop',
            title: 'Boop!',
            message: '',
            imageUrl: '',
            details: { emojiId: 'default_wave', emojiVersion: '1' }
        };
        applyBoopLegacyHandling(ref, 'https://api.example.com');
        expect(ref.title).toBe('');
        expect(ref.message).toBe('Boop! wave');
        expect(ref.imageUrl).toBe('default_wave');
    });

    it('should handle custom emoji boops', () => {
        const ref = {
            type: 'boop',
            title: 'Boop!',
            message: '',
            imageUrl: '',
            details: { emojiId: 'emj_123', emojiVersion: '5' }
        };
        applyBoopLegacyHandling(ref, 'https://api.example.com');
        expect(ref.title).toBe('');
        expect(ref.message).toBe('Boop!');
        expect(ref.imageUrl).toBe('https://api.example.com/file/emj_123/5');
    });
});
