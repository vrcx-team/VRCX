// Translates the VRChat API calls the app makes into NexVR calls, and NexVR's
// answers back into VRChat shapes. Requests reach here from WebApiService, so
// request.js and every store above it keep working unchanged.
//
// Anything without a route answers 501 "Not available on NexVR".

import {
    VRC_STATUS_TO_PREFERENCE,
    instanceIdFromLocation,
    presenceState,
    presenceToUser,
    toVrcCurrentUser,
    toVrcGroup,
    toVrcGroupMember,
    toVrcGroupPost,
    toVrcGroupRules,
    toVrcInstance,
    toVrcMembershipStatus,
    toVrcMyMember,
    toVrcNotification,
    toVrcPlayerModeration,
    toVrcPublicProfile,
    toVrcUser,
    toVrcWorld
} from './mappers';
import { clearTokens, getAccessToken, refreshTokens, setTokens } from './session';
import { AppDebug } from '../appConfig';
import { keepRawResponse } from './rawResponses';
import { realtime } from './realtime';

const SNAPSHOT_TIMEOUT = 8000;
const NOT_AVAILABLE = 'Not available on NexVR';

class ShimError extends Error {
    /**
     * @param {number} status
     * @param {string} message
     */
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

/**
 * @typedef {(options: object) => Promise<{ status: number; data?: string }>} NativeExecute
 */

/** @type {NativeExecute} */
let native;

/** Pending 2FA challenge from /auth/login */
let challenge = null;
/** @type {Map<string, any>} realtime notification by id, for accept/hide */
const notificationsById = new Map();
/** @type {Map<string, Promise<string>>} */
const displayNameCache = new Map();
/** @type {Map<string, string[]>} tags from full profiles, kept across presence-only refreshes */
const profileTags = new Map();

/**
 * @param {object} user VRChat-shaped user
 * @returns {object} The same user
 */
function rememberTags(user) {
    profileTags.set(user.id, user.tags);
    return user;
}

/**
 * @param {string} path NexVR gateway path, e.g. '/users/123'
 * @param {{ method?: string; body?: object; query?: Record<string, any>; auth?: boolean }} [opts]
 * @returns {Promise<any>}
 */
async function nexvr(path, { method = 'GET', body, query, auth = true } = {}) {
    const url = new URL(`${AppDebug.endpointDomain}${path}`);
    for (const [key, value] of Object.entries(query || {})) {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    }
    const send = async () => {
        const headers = {};
        if (auth) {
            const token = await getAccessToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }
        const init = { url: url.toString(), method, headers };
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json;charset=utf-8';
            init.body = JSON.stringify(body);
        }
        return native(init);
    };
    let res = await send();
    if (res.status === 401 && auth && (await refreshTokens(exchangeRefreshToken))) {
        res = await send();
    }
    let data = null;
    try {
        data = res.data ? JSON.parse(res.data) : null;
    } catch {
        data = res.data;
    }
    if (AppDebug.debugWebRequests) {
        // these go through .NET, so DevTools' Network tab never sees them;
        // credentials and tokens stay out of the log
        const shown =
            body && ('password' in body || 'refreshToken' in body || 'code' in body)
                ? { username: body.username, redacted: true }
                : body;
        const { accessToken, refreshToken, clientKeypair, ...rest } = data && typeof data === 'object' ? data : {};
        const shownData = accessToken || refreshToken || clientKeypair ? { ...rest, tokens: '[redacted]' } : data;
        console.log(`[NexVR ${method}] ${url.pathname}${url.search} (${res.status})`, shown ?? '', shownData);
    }
    if (res.status < 200 || res.status >= 300) {
        const message = data?.message || data?.error || `HTTP ${res.status}`;
        throw new ShimError(res.status, typeof message === 'string' ? message : JSON.stringify(message));
    }
    if (method === 'GET') {
        keepRawResponse(path, data);
    }
    return data;
}

/**
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string; refreshToken: string } | null>}
 */
async function exchangeRefreshToken(refreshToken) {
    return nexvr('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false });
}

/**
 * @param {string} userId
 * @returns {Promise<string>}
 */
function displayNameOf(userId) {
    if (!userId) {
        return Promise.resolve('');
    }
    const friend = realtime.friends.get(userId);
    if (friend) {
        return Promise.resolve(friend.displayName);
    }
    let pending = displayNameCache.get(userId);
    if (!pending) {
        pending = nexvr(`/users/${encodeURIComponent(userId)}`)
            .then((user) => user.displayName || user.username || '')
            .catch(() => {
                displayNameCache.delete(userId);
                return '';
            });
        displayNameCache.set(userId, pending);
    }
    return pending;
}

/**
 * Opens the realtime socket and waits for the first friends snapshot, which is
 * the only source of the friends list.
 *
 * @param {string} userId
 */
async function ensureRealtime(userId) {
    let token = await getAccessToken();
    let ok = await realtime.connect(token, userId);
    if (!ok && realtime.authFailed && (await refreshTokens(exchangeRefreshToken))) {
        token = await getAccessToken();
        ok = await realtime.connect(token, userId);
    }
    if (ok) {
        await realtime.waitForSnapshot(SNAPSHOT_TIMEOUT);
    }
}

/**
 * @param {any} loginResponse /auth/login or /auth/2fa/verify body
 */
async function acceptSession(loginResponse) {
    challenge = null;
    await setTokens({
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken
    });
}

async function currentUser() {
    if (!(await getAccessToken())) {
        throw new ShimError(401, '"Missing Credentials"');
    }
    let me;
    try {
        me = await nexvr('/auth/me');
    } catch (err) {
        if (err.status === 401) {
            // refresh already failed inside nexvr(); let VRCX re-login
            await clearTokens();
            throw new ShimError(401, '"Missing Credentials"');
        }
        throw err;
    }
    await ensureRealtime(me.id);
    return toVrcCurrentUser(me, realtime.friends);
}

/**
 * VRChat's login is GET auth/user with Basic auth; NexVR's is a POST.
 *
 * @param {string} basic Base64 "user:pass", each part URI-encoded
 */
async function login(basic) {
    const [user, pass] = atob(basic).split(':');
    await clearTokens();
    const res = await nexvr('/auth/login', {
        method: 'POST',
        auth: false,
        body: {
            username: decodeURIComponent(user),
            password: decodeURIComponent(pass ?? '')
        }
    });
    if (res.twoFactorRequired) {
        challenge = res;
        const methods = res.methods || [];
        // VRCX's prompts: TOTP (with recovery-code fallback), or email
        if (!methods.includes('totp') && methods.includes('email')) {
            await nexvr('/auth/2fa/email/send', {
                method: 'POST',
                auth: false,
                body: { challengeId: res.challengeId }
            });
            return { requiresTwoFactorAuth: ['emailOtp'] };
        }
        return { requiresTwoFactorAuth: ['totp', 'otp'] };
    }
    await acceptSession(res);
    return currentUser();
}

/**
 * @param {'totp' | 'email' | 'recovery'} method
 * @param {string} code
 */
async function verifyTwoFactor(method, code) {
    if (!challenge) {
        throw new ShimError(401, 'Two-factor challenge expired, sign in again');
    }
    const res = await nexvr('/auth/2fa/verify', {
        method: 'POST',
        auth: false,
        body: { challengeId: challenge.challengeId, method, code }
    });
    await acceptSession(res);
    return { verified: true };
}

/**
 * @param {URLSearchParams} query
 */
function friendsPage(query) {
    const offline = query.get('offline') === 'true';
    const offset = Number(query.get('offset') || 0);
    const n = Number(query.get('n') || 100);
    const list = [];
    for (const presence of realtime.friends.values()) {
        if (presence.userId === realtime.userId) {
            continue;
        }
        const user = presenceToUser(presence, profileTags.get(presence.userId));
        if ((user.state === 'offline') === offline) {
            list.push(user);
        }
    }
    return list.slice(offset, offset + n);
}

/**
 * @param {string} userId
 */
async function friendStatus(userId) {
    if (realtime.friends.has(userId)) {
        return { isFriend: true, outgoingRequest: false, incomingRequest: false };
    }
    const requests = await nexvr('/friends/requests');
    return {
        isFriend: false,
        outgoingRequest: requests.outgoing.some((r) => r.user.id === userId),
        incomingRequest: requests.incoming.some((r) => r.user.id === userId)
    };
}

async function notificationsList(query) {
    if (query.get('hidden') === 'true' || Number(query.get('offset') || 0) > 0) {
        return [];
    }
    const list = await realtime.getNotifications();
    notificationsById.clear();
    const result = [];
    for (const notification of list) {
        notificationsById.set(notification.id, notification);
        const mapped = toVrcNotification(notification);
        if (!mapped.senderUsername) {
            mapped.senderUsername = await displayNameOf(mapped.senderUserId);
        }
        result.push(mapped);
    }
    return result;
}

/**
 * @param {string} id
 * @param {boolean} accept
 */
async function answerNotification(id, accept) {
    const notification = notificationsById.get(id) ?? realtime.notifications.find((n) => n.id === id);
    const mapped = notification && toVrcNotification(notification);
    if (mapped?.type === 'friendRequest') {
        await nexvr(`/friends/${encodeURIComponent(mapped.senderUserId)}/${accept ? 'accept' : 'decline'}`, {
            method: 'POST'
        });
    }
    if (!accept || mapped?.type !== 'friendRequest') {
        await nexvr(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    }
    notificationsById.delete(id);
    return { success: { message: accept ? 'Accepted' : 'Dismissed', status_code: 200 } };
}

const MEMBER_LIST_TTL = 30000;
/** @type {Map<string, { at: number; members: Promise<any[]> }>} groupId → VRChat-shaped members */
const memberLists = new Map();

/**
 * The caller's membership, or null when they aren't in the group (or can't
 * see it).
 *
 * @param {string} groupId
 */
function groupMembership(groupId) {
    return nexvr(`/groups/${encodeURIComponent(groupId)}/membership`).catch(() => null);
}

/**
 * NexVR returns a group's whole member list at once; VRCX asks for it a page
 * at a time, so the list is fetched once and paged from here.
 *
 * @param {string} groupId
 * @returns {Promise<any[]>}
 */
function groupMembers(groupId) {
    const cached = memberLists.get(groupId);
    if (cached && Date.now() - cached.at < MEMBER_LIST_TTL) {
        return cached.members;
    }
    const members = nexvr(`/groups/${encodeURIComponent(groupId)}/members`)
        // pending requests and outstanding invites aren't members yet
        .then((list) =>
            list.filter((member) => member.status === 'active').map((member) => toVrcGroupMember(groupId, member))
        )
        .catch((err) => {
            memberLists.delete(groupId);
            throw err;
        });
    memberLists.set(groupId, { at: Date.now(), members });
    return members;
}

/**
 * @param {string} groupId
 * @param {URLSearchParams} query N, offset, sort ('joinedAt:asc|desc') and roleId
 */
async function groupMembersPage(groupId, query) {
    let members = await groupMembers(groupId);
    const roleId = query.get('roleId');
    if (roleId) {
        members = members.filter((member) => member.roleIds.includes(roleId));
    }
    const sort = query.get('sort') || '';
    if (sort.startsWith('joinedAt')) {
        const direction = sort.endsWith(':asc') ? 1 : -1;
        members = [...members].sort((a, b) => direction * (Date.parse(a.joinedAt || 0) - Date.parse(b.joinedAt || 0)));
    }
    const offset = Number(query.get('offset') || 0);
    return members.slice(offset, offset + Number(query.get('n') || 100));
}

/**
 * A group with what VRCX reads alongside it: whether the caller is a member
 * (membershipStatus / myMember) and its rules.
 *
 * @param {string} groupId
 */
async function groupDetails(groupId) {
    const id = encodeURIComponent(groupId);
    const [group, membership, rules, members] = await Promise.all([
        nexvr(`/groups/${id}`),
        groupMembership(groupId),
        nexvr(`/groups/${id}/rules`).catch(() => null),
        groupMembers(groupId).catch(() => [])
    ]);
    const listed = members.find((member) => member.userId === realtime.userId);
    // NexVR has no online count; this counts the members whose presence Nexy
    // can see, which is the caller and their friends
    const onlineMemberCount = members.filter((member) => {
        const presence = realtime.friends.get(member.userId);
        return presence && presenceState(presence).state !== 'offline';
    }).length;
    const vrcGroup = toVrcGroup(group);
    return {
        ...vrcGroup,
        // the list can be fresher than the stored count; never show fewer than are listed
        memberCount: Math.max(vrcGroup.memberCount, members.length),
        onlineMemberCount,
        membershipStatus: toVrcMembershipStatus(membership?.status),
        myMember: toVrcMyMember(groupId, realtime.userId, membership, listed),
        rules: toVrcGroupRules(rules)
    };
}

const JOIN_POLICIES = {
    open: 'free-join',
    request: 'request-join',
    invite: 'invite-only',
    // NexVR has no "closed"; invite-only is the nearest
    closed: 'invite-only'
};

/**
 * VRChat's create/edit-group body → NexVR's. Short code, privacy, role
 * template, languages, links and image ids have no NexVR counterpart.
 *
 * @param {any} body
 * @returns {object}
 */
function toNexvrGroupBody(body) {
    const out = {};
    if (body.name !== undefined) {
        out.name = body.name;
    }
    if (body.description !== undefined) {
        out.description = body.description;
    }
    if (JOIN_POLICIES[body.joinState]) {
        out.joinPolicy = { baseSetting: JOIN_POLICIES[body.joinState] };
    }
    return out;
}

/**
 * @param {URLSearchParams} query
 */
async function worldSearch(query) {
    const user = query.get('userId') || (query.get('user') === 'me' ? realtime.userId : '');
    const worlds = await nexvr('/worlds/', {
        query: {
            search: query.get('search'),
            tag: query.get('tag'),
            creator: user || undefined
        }
    });
    const offset = Number(query.get('offset') || 0);
    const n = Number(query.get('n') || worlds.length);
    const page = worlds.slice(offset, offset + n);
    return Promise.all(page.map(async (w) => toVrcWorld(w, await displayNameOf(w.owner))));
}

/**
 * Route table: [method, pattern, handler(match, query, body, headers)].
 * Patterns match the path after the API base, without the query string.
 *
 * @type {[string, RegExp, (...args: any[]) => any][]}
 */
const routes = [
    [
        'GET',
        /^config$/,
        () => ({
            whiteListedAssetUrls: ['https://cdn.nexvr.net'],
            clientApiKey: '',
            disableEventStream: false
        })
    ],
    [
        'GET',
        /^auth\/user$/,
        (m, q, b, headers) => {
            const authorization = headers?.Authorization || '';
            if (authorization.startsWith('Basic ')) {
                return login(authorization.slice(6));
            }
            return currentUser();
        }
    ],
    ['POST', /^auth\/twofactorauth\/totp\/verify$/, (m, q, body) => verifyTwoFactor('totp', body.code)],
    ['POST', /^auth\/twofactorauth\/otp\/verify$/, (m, q, body) => verifyTwoFactor('recovery', body.code)],
    ['POST', /^auth\/twofactorauth\/emailotp\/verify$/, (m, q, body) => verifyTwoFactor('email', body.code)],
    [
        'GET',
        /^auth$/,
        async () => {
            const token = await getAccessToken();
            return { ok: Boolean(token), token };
        }
    ],
    ['GET', /^auth\/permissions$/, () => ({})],
    // same { balance } shape as VRChat's
    ['GET', /^user\/[^/]+\/economy\/balance$/, () => nexvr('/economy/balance')],
    // NexVR-only: keeps the user shown online to friends (5 minute window)
    ['POST', /^users\/me\/ping$/, () => nexvr('/users/me/ping', { method: 'POST' })],
    ['GET', /^auth\/user\/friends$/, (m, q) => friendsPage(q)],
    [
        'DELETE',
        /^auth\/user\/friends\/([^/]+)$/,
        async (m) => {
            await nexvr(`/friends/${encodeURIComponent(m[1])}`, { method: 'DELETE' });
            return { success: { message: 'Friendship destroyed', status_code: 200 } };
        }
    ],
    ['GET', /^auth\/user\/notifications$/, (m, q) => notificationsList(q)],
    ['PUT', /^auth\/user\/notifications\/([^/]+)\/accept$/, (m) => answerNotification(m[1], true)],
    ['PUT', /^auth\/user\/notifications\/([^/]+)\/hide$/, (m) => answerNotification(m[1], false)],
    ['PUT', /^auth\/user\/notifications\/([^/]+)\/see$/, (m) => ({ id: m[1], seen: true })],
    ['GET', /^notifications$/, () => []],
    [
        'GET',
        /^auth\/user\/playermoderations$/,
        async () => {
            const list = await nexvr('/moderation/');
            return list.map(toVrcPlayerModeration);
        }
    ],
    ['GET', /^auth\/user\/avatarmoderations$/, () => []],
    ['GET', /^(favorites|favorite\/groups)$/, () => []],
    [
        'GET',
        /^auth\/user\/favoritelimits$/,
        () => ({
            defaultMaxFavoriteGroups: 0,
            defaultMaxFavoritesPerGroup: 0,
            maxFavoriteGroups: { avatar: 0, friend: 0, world: 0 },
            maxFavoritesPerGroup: { avatar: 0, friend: 0, world: 0 }
        })
    ],
    [
        'GET',
        /^users$/,
        async (m, q) => {
            const users = await nexvr('/users/search', {
                query: { q: q.get('search'), limit: q.get('n') }
            });
            return users.map((u) => rememberTags(toVrcUser(u, realtime.friends.get(u.id))));
        }
    ],
    [
        'GET',
        /^users\/([^/]+)$/,
        async (m) => {
            const user = await nexvr(`/users/${encodeURIComponent(m[1])}`);
            return rememberTags(toVrcUser(user, realtime.friends.get(user.id)));
        }
    ],
    [
        'PUT',
        /^users\/([^/]+)$/,
        async (m, q, body) => {
            const patch = {};
            if (body.status !== undefined) {
                patch.userPreferenceStatus = VRC_STATUS_TO_PREFERENCE[body.status] ?? 'online';
            }
            if (body.statusDescription !== undefined) {
                patch.statusText = body.statusDescription;
            }
            if (body.bio !== undefined) {
                patch.bio = body.bio;
            }
            if (body.pronouns !== undefined) {
                patch.pronouns = body.pronouns;
            }
            if (body.displayName !== undefined) {
                patch.displayName = body.displayName;
            }
            const me = await nexvr('/users/me', { method: 'PATCH', body: patch });
            return toVrcCurrentUser(me, realtime.friends);
        }
    ],
    [
        'GET',
        /^users\/([^/]+)\/groups$/,
        async (m) => {
            const groups = await nexvr(`/groups/user/${encodeURIComponent(m[1])}`);
            return groups.map(toVrcGroup);
        }
    ],
    ['GET', /^users\/([^/]+)\/groups\/represented$/, () => ({})],
    ['GET', /^profile\/([^/]+)$/, async (m) => toVrcPublicProfile(await nexvr(`/users/${encodeURIComponent(m[1])}`))],
    ['GET', /^user\/([^/]+)\/friendStatus$/, (m) => friendStatus(m[1])],
    [
        'POST',
        /^user\/([^/]+)\/friendRequest$/,
        async (m) => {
            await nexvr(`/friends/${encodeURIComponent(m[1])}/request`, { method: 'POST' });
            return { id: '', type: 'friendRequest', receiverUserId: m[1] };
        }
    ],
    [
        'DELETE',
        /^user\/([^/]+)\/friendRequest$/,
        async (m) => {
            await nexvr(`/friends/${encodeURIComponent(m[1])}`, { method: 'DELETE' });
            return { success: { message: 'Friend request cancelled', status_code: 200 } };
        }
    ],
    ['GET', /^worlds$/, (m, q) => worldSearch(q)],
    [
        'GET',
        /^worlds\/([^/]+)$/,
        async (m) => {
            const world = await nexvr(`/worlds/${encodeURIComponent(m[1])}`);
            return toVrcWorld(world, await displayNameOf(world.owner));
        }
    ],
    [
        'GET',
        /^instances\/([^/]+)$/,
        async (m) => {
            const id = instanceIdFromLocation(decodeURIComponent(m[1]));
            return toVrcInstance(await nexvr(`/instances/${encodeURIComponent(id)}`));
        }
    ],
    // NexVR has no role templates; one entry keeps the create dialog's request happy.
    // Must sit above groups/{id}, which would otherwise take 'roleTemplates' for an id.
    ['GET', /^groups\/roleTemplates$/, () => ({ default: { name: 'Default', description: '' } })],
    [
        'POST',
        /^groups$/,
        async (m, q, body) => toVrcGroup(await nexvr('/groups/', { method: 'POST', body: toNexvrGroupBody(body) }))
    ],
    [
        'PUT',
        /^groups\/([^/]+)$/,
        async (m, q, body) =>
            toVrcGroup(
                await nexvr(`/groups/${encodeURIComponent(m[1])}`, { method: 'PATCH', body: toNexvrGroupBody(body) })
            )
    ],
    ['GET', /^groups\/([^/]+)$/, (m) => groupDetails(m[1])],
    // must sit above groups/{id}/members/{userId}, which would take 'search' for a user id
    [
        'GET',
        /^groups\/([^/]+)\/members\/search$/,
        async (m, q) => {
            const query = (q.get('query') || '').toLowerCase();
            const members = await groupMembers(m[1]);
            const results = members.filter((member) => member.user.displayName.toLowerCase().includes(query));
            return { results: results.slice(0, Number(q.get('n') || 100)) };
        }
    ],
    [
        'GET',
        /^groups\/([^/]+)\/members\/([^/]+)$/,
        async (m) => {
            const [groupId, userId] = [m[1], m[2]];
            const listed = (await groupMembers(groupId)).find((member) => member.userId === userId);
            if (userId === realtime.userId) {
                const membership = await groupMembership(groupId);
                const mine = toVrcMyMember(groupId, userId, membership, listed);
                if (mine) {
                    return { ...listed, ...mine };
                }
            }
            if (!listed) {
                throw new ShimError(404, 'Not a member of this group');
            }
            return listed;
        }
    ],
    ['GET', /^groups\/([^/]+)\/members$/, (m, q) => groupMembersPage(m[1], q)],
    [
        'GET',
        /^groups\/([^/]+)\/posts$/,
        async (m, q) => {
            const posts = (await nexvr(`/groups/${encodeURIComponent(m[1])}/announcements`)).map(toVrcGroupPost);
            const offset = Number(q.get('offset') || 0);
            return { posts: posts.slice(offset, offset + Number(q.get('n') || 100)), total: posts.length };
        }
    ],
    [
        'POST',
        /^groups\/([^/]+)\/(join|leave)$/,
        async (m) => {
            await nexvr(`/groups/${encodeURIComponent(m[1])}/${m[2]}`, { method: 'POST' });
            memberLists.delete(m[1]);
            return { success: { message: m[2] === 'join' ? 'Joined group' : 'Left group', status_code: 200 } };
        }
    ],
    [
        'POST',
        /^invite\/([^/]+)$/,
        async (m, q, body) => {
            await nexvr('/invites/', {
                method: 'POST',
                body: { to: m[1], toInstance: instanceIdFromLocation(body.instanceId) }
            });
            return { success: { message: 'Invite sent', status_code: 200 } };
        }
    ],
    [
        'POST',
        /^invite\/myself\/to\/(.+)$/,
        async (m) => {
            // NexVR has no self-invite endpoint; an ordinary invite addressed to the caller
            const res = await nexvr('/invites/', {
                method: 'POST',
                body: { to: realtime.userId, toInstance: instanceIdFromLocation(decodeURIComponent(m[1])) }
            });
            return { id: res?.instanceId ?? '', type: 'invite', receiverUserId: realtime.userId };
        }
    ],
    [
        'POST',
        /^requestInvite\/([^/]+)$/,
        async (m) => {
            await nexvr('/invites/request', { method: 'POST', body: { to: m[1] } });
            return { success: { message: 'Invite requested', status_code: 200 } };
        }
    ]
];

/**
 * @param {string} url
 * @returns {boolean} Whether the URL targets the configured NexVR API
 */
export function isNexvrApiUrl(url) {
    return typeof url === 'string' && url.startsWith(`${AppDebug.endpointDomain}/`);
}

/**
 * Handles one WebApiService request aimed at the API base.
 *
 * @param {any} options WebApiOptions from request.js
 * @param {NativeExecute} executeNative The real HTTP client
 * @returns {Promise<{ status: number; data: string }>}
 */
export async function handleShimRequest(options, executeNative) {
    native = executeNative;
    const url = new URL(options.url);
    const base = new URL(AppDebug.endpointDomain);
    const path = url.pathname.slice(base.pathname.replace(/\/$/, '').length + 1);
    const method = (options.method || 'GET').toUpperCase();
    let body = {};
    if (typeof options.body === 'string' && options.body) {
        try {
            body = JSON.parse(options.body);
        } catch {
            body = {};
        }
    }
    try {
        for (const [routeMethod, pattern, handler] of routes) {
            if (routeMethod !== method) {
                continue;
            }
            const match = pattern.exec(path);
            if (match) {
                const data = await handler(match, url.searchParams, body, options.headers);
                return { status: 200, data: JSON.stringify(data ?? {}) };
            }
        }
        throw new ShimError(501, NOT_AVAILABLE);
    } catch (err) {
        const status = err instanceof ShimError ? err.status : 0;
        if (status === 0) {
            throw err;
        }
        if (status !== 501 && AppDebug.debugWebRequests) {
            console.warn(`[NexVR] ${method} ${path} → ${status}`, err.message);
        }
        return {
            status,
            data: JSON.stringify({ error: { message: err.message, status_code: status } })
        };
    }
}

/**
 * Forgets the session locally. The server session is left alone, like VRCX
 * left VRChat's cookies, so a saved account can still be switched back to.
 */
export async function endSession() {
    challenge = null;
    notificationsById.clear();
    realtime.reset();
    await clearTokens();
}
