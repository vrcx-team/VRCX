vi.mock('../../appConfig', () => ({
    AppDebug: { endpointDomain: 'https://nexvr.net/api', websocketDomain: '', debugWebRequests: false }
}));
vi.mock('../../config', () => ({
    default: { getString: async () => '', setString: async () => {}, remove: async () => {} }
}));

import { handleShimRequest } from '../shim';
import { PresenceStatus } from '../realtimeSchema';
import { realtime } from '../realtime';

const user = (id, displayName) => ({ id, username: id, displayName, profileImageUrl: `https://cdn/${id}.png` });

/** Canned NexVR responses by path; anything else is a 404 */
const responses = {
    '/groups/g1': {
        id: 'g1',
        name: 'Lotus',
        owner: 'owner',
        roles: [{ id: 'r-mod', name: 'Moderator', permissions: [] }],
        joinPolicy: { baseSetting: 'free-join' },
        memberCount: 3
    },
    '/groups/g1/membership': {
        status: 'active',
        isOwner: false,
        roles: ['r-mod'],
        membershipVisibility: 'friends-only',
        muted: false,
        permissions: ['manage-members', 'manage-roles']
    },
    '/groups/g1/rules': { groupId: 'g1', markdown: 'Be kind.', flags: ['no_recording', 'english_only'] },
    '/groups/g1/members': [
        {
            user: user('a', 'Alpha'),
            roles: [],
            membershipVisibility: 'public',
            status: 'active',
            joinedAt: '2026-01-01T00:00:00Z'
        },
        {
            user: user('me', 'Iris'),
            roles: [{ roleId: 'r-mod' }],
            membershipVisibility: 'friends-only',
            status: 'active',
            joinedAt: '2026-03-01T00:00:00Z'
        },
        {
            user: user('b', 'Bravo'),
            roles: [{ roleId: 'r-mod' }],
            membershipVisibility: 'hidden',
            status: 'active',
            joinedAt: '2026-02-01T00:00:00Z'
        },
        {
            user: user('p', 'Pending'),
            roles: [],
            membershipVisibility: 'public',
            status: 'pending',
            joinedAt: '2026-04-01T00:00:00Z'
        }
    ],
    '/groups/g1/announcements': [
        {
            id: 'p1',
            groupId: 'g1',
            author: user('owner', 'Owner'),
            title: 'Hi',
            body: 'Welcome',
            createdAt: '2026-04-01T00:00:00Z'
        }
    ],
    '/groups/g2': { id: 'g2', name: 'Other', owner: 'x', roles: [], joinPolicy: { baseSetting: 'request-join' } },
    '/groups/g2/members': []
};

const native = async ({ url }) => {
    const path = new URL(url).pathname.replace(/^\/api/, '');
    if (path in responses) {
        return { status: 200, data: JSON.stringify(responses[path]) };
    }
    return { status: 404, data: JSON.stringify({ message: 'Not found' }) };
};

async function get(path) {
    const res = await handleShimRequest({ url: `https://nexvr.net/api/${path}`, method: 'GET' }, native);
    return { status: res.status, json: JSON.parse(res.data) };
}

beforeEach(() => {
    realtime.userId = 'me';
    // the caller and Alpha are online; Bravo isn't a friend, so their presence is unknown
    realtime.friends = new Map([
        ['me', { userId: 'me', status: PresenceStatus.ONLINE }],
        ['a', { userId: 'a', status: PresenceStatus.ASK_ME }]
    ]);
});

describe('NexVR group routes', () => {
    test('a group carries the caller membership and its rules', async () => {
        const { json } = await get('groups/g1?includeRoles=true');
        expect(json.membershipStatus).toBe('member');
        expect(json.myMember.roleIds).toEqual(['r-mod']);
        expect(json.myMember.visibility).toBe('friends');
        expect(json.myMember.joinedAt).toBe('2026-03-01T00:00:00Z');
        expect(json.rules).toBe('Be kind.\n\n• No recording\n• English only');
    });

    test('counts and permissions: active members only, online among known presence', async () => {
        const { json } = await get('groups/g1');
        // the pending request isn't a member and isn't counted
        expect(json.memberCount).toBe(3);
        expect(json.onlineMemberCount).toBe(2);
        // manage-members shows every member; manage-roles stays NexVR-only
        expect(json.myMember.permissions).toEqual(
            expect.arrayContaining(['manage-members', 'group-members-viewall', 'group-members-manage'])
        );
        expect(json.myMember.permissions).not.toContain('group-roles-manage');
    });

    test('a group the caller is not in reads as inactive, with no myMember', async () => {
        const { json } = await get('groups/g2');
        expect(json.membershipStatus).toBe('inactive');
        expect(json.myMember).toBeNull();
        expect(json.rules).toBe('');
    });

    test('members are paged, sorted by join date and filtered by role', async () => {
        const all = (await get('groups/g1/members?n=100&offset=0&sort=joinedAt:desc')).json;
        expect(all.map((m) => m.userId)).toEqual(['me', 'b', 'a']);
        expect(all[0].user.iconUrl).toBe('https://cdn/me.png');
        expect(all[1].visibility).toBe('hidden');

        const page = (await get('groups/g1/members?n=1&offset=1&sort=joinedAt:asc')).json;
        expect(page.map((m) => m.userId)).toEqual(['b']);

        const mods = (await get('groups/g1/members?n=100&offset=0&roleId=r-mod')).json;
        expect(mods.map((m) => m.userId).sort()).toEqual(['b', 'me']);
    });

    test('the caller member entry merges their membership; others come from the list', async () => {
        const mine = (await get('groups/g1/members/me')).json;
        expect(mine.membershipStatus).toBe('member');
        expect(mine.user.displayName).toBe('Iris');

        expect((await get('groups/g1/members/a')).json.user.displayName).toBe('Alpha');
        expect((await get('groups/g1/members/nobody')).status).toBe(404);
    });

    test('member search is not mistaken for a user id', async () => {
        const { json } = await get('groups/g1/members/search?query=bra&n=10');
        expect(json.results.map((m) => m.userId)).toEqual(['b']);
    });

    test('announcements come through as posts', async () => {
        const { json } = await get('groups/g1/posts?n=100&offset=0');
        expect(json.total).toBe(1);
        expect(json.posts[0]).toMatchObject({ id: 'p1', authorId: 'owner', title: 'Hi', text: 'Welcome' });
    });
});
