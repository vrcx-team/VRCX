vi.mock('../../appConfig', () => ({
    AppDebug: { endpointDomain: 'https://nexvr.net/api', websocketDomain: '', debugWebRequests: false }
}));
vi.mock('../../config', () => ({
    default: { getString: async () => '', setString: async () => {}, remove: async () => {} }
}));

import { create } from '@bufbuild/protobuf';

import { FriendPresenceSchema, PresenceStatus } from '../realtimeSchema';
import { getRawPresence, getRawResponse, keepRawResponse, presentSections } from '../rawResponses';
import { handleShimRequest } from '../shim';
import { realtime } from '../realtime';
import { maskEmail, toVrcCurrentUser, toVrcUser } from '../mappers';

const native = async ({ url, method }) => {
    const path = new URL(url).pathname.replace(/^\/api/, '');
    if (path === '/users/u1') {
        return { status: 200, data: JSON.stringify({ id: 'u1', username: 'u1', displayName: 'One', socialRank: 'C' }) };
    }
    if (path === '/auth/login' && method === 'POST') {
        return {
            status: 200,
            data: JSON.stringify({ accessToken: 'secret', refreshToken: 'secret', user: { id: 'me' } })
        };
    }
    return { status: 404, data: JSON.stringify({ message: 'Not found' }) };
};

describe('raw NexVR responses for the JSON tabs', () => {
    test('GET responses are kept by path exactly as the server sent them', async () => {
        await handleShimRequest({ url: 'https://nexvr.net/api/users/u1', method: 'GET' }, native);
        // the raw profile, not the VRChat-shaped copy (which would have tags, userIcon, ...)
        expect(getRawResponse('/users/u1')).toEqual({ id: 'u1', username: 'u1', displayName: 'One', socialRank: 'C' });
    });

    test('responses carrying session tokens are never kept', () => {
        keepRawResponse('/auth/login', { accessToken: 'secret' });
        keepRawResponse('/auth/refresh', { accessToken: 'secret' });
        expect(getRawResponse('/auth/login')).toBeUndefined();
        expect(getRawResponse('/auth/refresh')).toBeUndefined();
    });

    test('the account email is masked before it is kept', () => {
        keepRawResponse('/auth/me', { id: 'me', primaryEmail: 'someone@example.com', emailVerified: true });
        expect(getRawResponse('/auth/me')).toEqual({ id: 'me', primaryEmail: 's****@e****.com', emailVerified: true });
        expect(JSON.stringify(getRawResponse('/auth/me'))).not.toContain('someone@');
    });

    test('the cache is capped, dropping the oldest path first', () => {
        for (let i = 0; i < 310; i++) {
            keepRawResponse(`/cap/${i}`, i);
        }
        expect(getRawResponse('/cap/0')).toBeUndefined();
        expect(getRawResponse('/cap/309')).toBe(309);
    });

    test('presence is shown in protobuf JSON, with enum names', () => {
        realtime.friends = new Map([
            [
                'f1',
                create(FriendPresenceSchema, {
                    userId: 'f1',
                    status: PresenceStatus.JOIN_ME,
                    friendsSince: '2026-01-01T00:00:00Z'
                })
            ]
        ]);
        expect(getRawPresence('f1')).toMatchObject({
            userId: 'f1',
            status: 'PRESENCE_STATUS_JOIN_ME',
            friendsSince: '2026-01-01T00:00:00Z'
        });
        expect(getRawPresence('stranger')).toBeUndefined();
    });

    test('sections with nothing to show are left out', () => {
        expect(presentSections({ user: { id: 'u1' }, presence: undefined })).toEqual({ user: { id: 'u1' } });
    });
});

test('a friend fetched by profile carries when the friendship began', () => {
    const user = toVrcUser(
        { id: 'f1', username: 'f1' },
        { userId: 'f1', status: PresenceStatus.ONLINE, friendsSince: '2026-02-03T00:00:00Z' }
    );
    expect(user.$friendsSince).toBe('2026-02-03T00:00:00Z');
});

test('the signed-in account only ever exposes a masked email', () => {
    expect(maskEmail('someone@example.com')).toBe('s****@e****.com');
    expect(maskEmail('a@localhost')).toBe('a****@l****');
    expect(maskEmail('')).toBe('');
    expect(maskEmail('not-an-email')).toBe('');
    const me = toVrcCurrentUser({ id: 'me', username: 'me', primaryEmail: 'someone@example.com' }, new Map());
    expect(me.obfuscatedEmail).toBe('s****@e****.com');
    expect(JSON.stringify(me)).not.toContain('someone@');
});
