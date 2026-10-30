import { nextTick, reactive } from 'vue';

const entries = [];
const game = reactive({ isGameRunning: true });
const location = reactive({ lastLocation: { location: '', playerList: new Map() } });

vi.mock('../../appConfig', () => ({ AppDebug: { debugGameLog: false, websocketDomain: '' } }));
vi.mock('../../../coordinators/gameLogCoordinator', () => ({
    addGameLogEntry: vi.fn(async (entry) => {
        entries.push(entry);
    })
}));
vi.mock('../../../stores/game', () => ({ useGameStore: () => game }));
vi.mock('../../../stores/location', () => ({ useLocationStore: () => location }));
vi.mock('../../../shared/utils/world', () => ({ getWorldName: async () => 'Club' }));

import { PresenceStatus } from '../realtimeSchema';
import { realtime } from '../realtime';
import { startGameSession } from '../gameSession';

const WORLD = 'w1';

/**
 * @param {string} userId
 * @param {string | null} instanceId
 */
function presence(userId, instanceId) {
    return {
        userId,
        displayName: userId.toUpperCase(),
        status: PresenceStatus.ONLINE,
        location: instanceId ? { instanceId, worldId: WORLD, region: 'ca' } : undefined
    };
}

/**
 * @param {any[]} list
 */
async function setFriends(list) {
    realtime.friends = new Map(list.map((p) => [p.userId, p]));
    realtime.emit('friends', { snapshot: false, changed: [], removed: [] });
    await flush();
}

async function flush() {
    for (let i = 0; i < 10; i++) {
        await nextTick();
        await Promise.resolve();
    }
}

const summary = () => entries.map((e) => `${e.type}:${e.userId ?? e.location}`);

describe('NexVR game session', () => {
    let stop;

    beforeEach(() => {
        entries.length = 0;
        realtime.userId = 'me';
        realtime.watchedInstances = [];
        game.isGameRunning = true;
        location.lastLocation = { location: '', playerList: new Map() };
    });

    afterEach(() => stop?.());

    test('logs the instance and the friends in it, then the occupant feed', async () => {
        realtime.friends = new Map([
            ['me', presence('me', 'i1')],
            ['a', presence('a', 'i1')],
            ['b', presence('b', 'i2')]
        ]);
        stop = startGameSession();
        await flush();

        expect(summary()).toEqual(['location:w1:i1~region(ca)', 'player-joined:me', 'player-joined:a']);
        expect(realtime.watchedInstances).toEqual(['i1']);

        // the occupant feed adds a stranger and is now the source of truth
        realtime.emit('instanceModeration', {
            instanceId: 'i1',
            moderation: {
                occupants: [
                    { userId: 'me', displayName: 'ME' },
                    { userId: 'a', displayName: 'A' },
                    { userId: 'x', displayName: 'Stranger', joinedAt: '2026-10-31T00:00:00.000Z' }
                ]
            }
        });
        await flush();
        expect(summary().slice(3)).toEqual(['player-joined:x']);
        expect(entries[3].dt).toBe('2026-10-31T00:00:00.000Z');

        realtime.emit('instanceModeration', {
            instanceId: 'i1',
            moderation: {
                occupants: [
                    { userId: 'me', displayName: 'ME' },
                    { userId: 'x', displayName: 'Stranger' }
                ]
            }
        });
        await flush();
        expect(summary().slice(4)).toEqual(['player-left:a']);
    });

    test('without an occupant feed, friends coming and going are the player list', async () => {
        realtime.friends = new Map([['me', presence('me', 'i1')]]);
        stop = startGameSession();
        await flush();

        await setFriends([presence('me', 'i1'), presence('a', 'i1')]);
        await setFriends([presence('me', 'i1')]);
        expect(summary()).toEqual([
            'location:w1:i1~region(ca)',
            'player-joined:me',
            'player-joined:a',
            'player-left:a'
        ]);
    });

    test('a move starts a new instance; an empty occupant list is ignored', async () => {
        realtime.friends = new Map([['me', presence('me', 'i1')]]);
        stop = startGameSession();
        await flush();

        realtime.emit('instanceModeration', { instanceId: 'i1', moderation: { occupants: [] } });
        await setFriends([presence('me', 'i2')]);
        expect(summary()).toEqual([
            'location:w1:i1~region(ca)',
            'player-joined:me',
            'location:w1:i2~region(ca)',
            'player-joined:me'
        ]);
        expect(realtime.watchedInstances).toEqual(['i2']);
    });

    test('nothing is logged while the NexVR client is closed', async () => {
        game.isGameRunning = false;
        realtime.friends = new Map([['me', presence('me', 'i1')]]);
        stop = startGameSession();
        await flush();
        expect(entries).toEqual([]);

        game.isGameRunning = true;
        await flush();
        expect(summary()).toEqual(['location:w1:i1~region(ca)', 'player-joined:me']);
    });

    test('after a restart, carries on with the restored instance instead of logging it again', async () => {
        location.lastLocation = {
            location: 'w1:i1~region(ca)',
            playerList: new Map([['me', { displayName: 'ME' }]])
        };
        realtime.friends = new Map([
            ['me', presence('me', 'i1')],
            ['a', presence('a', 'i1')]
        ]);
        stop = startGameSession();
        await flush();
        expect(summary()).toEqual(['player-joined:a']);
    });
});
