/**
 * @param {object} deps Coordinator dependencies.
 * @returns {object} Friend presence coordinator methods.
 */
export function createFriendPresenceCoordinator(deps) {
    const {
        friends,
        localFavoriteFriends,
        pendingOfflineMap,
        pendingOfflineDelay,
        watchState,
        appDebug,
        getCachedUsers,
        isRealInstance,
        requestUser,
        getWorldName,
        getGroupName,
        feedStore,
        database,
        updateOnlineFriendCounter,
        now,
        nowIso
    } = deps;

    /**
     * @param {object} ctx
     * @param {string} newState
     * @param {string} location
     * @param {number} $location_at
     */
    async function runUpdateFriendDelayedCheckFlow(
        ctx,
        newState,
        location,
        $location_at
    ) {
        let feed;
        let groupName;
        let worldName;
        const id = ctx.id;
        if (appDebug.debugFriendState) {
            console.log(
                `${ctx.name} updateFriendState ${ctx.state} -> ${newState}`
            );
            if (
                typeof ctx.ref !== 'undefined' &&
                location !== ctx.ref.location
            ) {
                console.log(
                    `${ctx.name} pendingOfflineLocation ${location} -> ${ctx.ref.location}`
                );
            }
        }
        if (!friends.has(id)) {
            console.log('Friend not found', id);
            return;
        }
        const isVIP = localFavoriteFriends.has(id);
        const ref = ctx.ref;
        if (ctx.state !== newState && typeof ctx.ref !== 'undefined') {
            if (
                (newState === 'offline' || newState === 'active') &&
                ctx.state === 'online'
            ) {
                ctx.ref.$online_for = '';
                ctx.ref.$offline_for = now();
                ctx.ref.$active_for = '';
                if (newState === 'active') {
                    ctx.ref.$active_for = now();
                }
                const ts = now();
                const time = ts - $location_at;
                worldName = await getWorldName(location);
                groupName = await getGroupName(location);
                feed = {
                    created_at: nowIso(),
                    type: 'Offline',
                    userId: ref.id,
                    displayName: ref.displayName,
                    location,
                    worldName,
                    groupName,
                    time
                };
                feedStore.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            } else if (
                newState === 'online' &&
                (ctx.state === 'offline' || ctx.state === 'active')
            ) {
                ctx.ref.$previousLocation = '';
                ctx.ref.$travelingToTime = now();
                ctx.ref.$location_at = now();
                ctx.ref.$online_for = now();
                ctx.ref.$offline_for = '';
                ctx.ref.$active_for = '';
                worldName = await getWorldName(location);
                groupName = await getGroupName(location);
                feed = {
                    created_at: nowIso(),
                    type: 'Online',
                    userId: id,
                    displayName: ctx.name,
                    location,
                    worldName,
                    groupName,
                    time: ''
                };
                feedStore.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            }
            if (newState === 'active') {
                ctx.ref.$active_for = now();
            }
        }
        if (ctx.state !== newState) {
            ctx.state = newState;
            updateOnlineFriendCounter();
        }
        if (ref?.displayName) {
            ctx.name = ref.displayName;
        }
        ctx.isVIP = isVIP;
    }

    /**
     * Handles immediate friend presence updates and pending-offline orchestration.
     * @param {string} id Friend id.
     * @param {string | undefined} stateInput Optional incoming state.
     */
    async function runUpdateFriendFlow(id, stateInput = undefined) {
        const ctx = friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        const ref = getCachedUsers().get(id);

        if (stateInput === 'online') {
            const pendingOffline = pendingOfflineMap.get(id);
            if (appDebug.debugFriendState && pendingOffline) {
                const time = (now() - pendingOffline.startTime) / 1000;
                console.log(`${ctx.name} pendingOfflineCancelTime ${time}`);
            }
            ctx.pendingOffline = false;
            pendingOfflineMap.delete(id);
        }
        const isVIP = localFavoriteFriends.has(id);
        let location = '';
        let $location_at = undefined;
        if (typeof ref !== 'undefined') {
            location = ref.location;
            $location_at = ref.$location_at;

            const currentState = stateInput || ctx.state;
            // wtf, fetch user if offline in an instance
            if (
                currentState !== 'online' &&
                isRealInstance(ref.location) &&
                ref.$lastFetch < now() - 10000 // 10 seconds
            ) {
                console.log(
                    `Fetching offline friend in an instance ${ctx.name}`
                );
                requestUser(id);
            }
            // wtf, fetch user if online in an offline location
            if (
                currentState === 'online' &&
                ref.location === 'offline' &&
                ref.$lastFetch < now() - 10000 // 10 seconds
            ) {
                console.log(
                    `Fetching online friend in an offline location ${ctx.name}`
                );
                requestUser(id);
            }
        }
        if (typeof stateInput === 'undefined' || ctx.state === stateInput) {
            // this is should be: undefined -> user
            if (ctx.ref !== ref) {
                ctx.ref = ref;
                // NOTE
                // AddFriend (CurrentUser) 이후,
                // 서버에서 오는 순서라고 보면 될 듯.
                if (ctx.state === 'online') {
                    if (watchState.isFriendsLoaded) {
                        requestUser(id);
                    }
                }
            }
            if (ctx.isVIP !== isVIP) {
                ctx.isVIP = isVIP;
            }
            if (typeof ref !== 'undefined' && ctx.name !== ref.displayName) {
                ctx.name = ref.displayName;
            }
            return;
        }
        if (
            ctx.state === 'online' &&
            (stateInput === 'active' || stateInput === 'offline')
        ) {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;
            }
            if (!watchState.isFriendsLoaded) {
                await runUpdateFriendDelayedCheckFlow(
                    ctx,
                    stateInput,
                    location,
                    $location_at
                );
                return;
            }
            // prevent status flapping
            if (pendingOfflineMap.has(id)) {
                if (appDebug.debugFriendState) {
                    console.log(ctx.name, 'pendingOfflineAlreadyWaiting');
                }
                return;
            }
            if (appDebug.debugFriendState) {
                console.log(ctx.name, 'pendingOfflineBegin');
            }
            pendingOfflineMap.set(id, {
                startTime: now(),
                newState: stateInput,
                previousLocation: location,
                previousLocationAt: $location_at
            });
            ctx.pendingOffline = true;
            return;
        }
        ctx.ref = ref;
        ctx.isVIP = isVIP;
        if (typeof ref !== 'undefined') {
            ctx.name = ref.displayName;
            await runUpdateFriendDelayedCheckFlow(
                ctx,
                ctx.ref.state,
                location,
                $location_at
            );
        }
    }

    /**
     * Processes pending-offline entries and executes delayed transitions.
     */
    async function runPendingOfflineTickFlow() {
        const currentTime = now();
        for (const [id, pending] of pendingOfflineMap.entries()) {
            if (currentTime - pending.startTime >= pendingOfflineDelay) {
                const ctx = friends.get(id);
                if (typeof ctx === 'undefined') {
                    pendingOfflineMap.delete(id);
                    continue;
                }
                ctx.pendingOffline = false;
                if (pending.newState === ctx.state) {
                    console.error(
                        ctx.name,
                        'pendingOfflineCancelledStateMatched, this should never happen'
                    );
                    pendingOfflineMap.delete(id);
                    continue;
                }
                if (appDebug.debugFriendState) {
                    console.log(ctx.name, 'pendingOfflineEnd');
                }
                pendingOfflineMap.delete(id);
                await runUpdateFriendDelayedCheckFlow(
                    ctx,
                    pending.newState,
                    pending.previousLocation,
                    pending.previousLocationAt
                );
            }
        }
    }

    return {
        runUpdateFriendFlow,
        runUpdateFriendDelayedCheckFlow,
        runPendingOfflineTickFlow
    };
}
