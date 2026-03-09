/**
 * @param {object} deps Coordinator dependencies.
 * @returns {object} Auth flow coordinator methods.
 */
export function createAuthCoordinator(deps) {
    const {
        userStore,
        notificationStore,
        updateLoopStore,
        initWebsocket,
        updateStoredUser,
        webApiService,
        loginForm,
        configRepository,
        setAttemptingAutoLogin,
        autoLoginAttempts,
        closeWebSocket,
        queryClient,
        watchState
    } = deps;

    /**
     * Runs the shared logout side effects.
     */
    async function runLogoutFlow() {
        userStore.setUserDialogVisible(false);
        watchState.isLoggedIn = false;
        watchState.isFriendsLoaded = false;
        watchState.isFavoritesLoaded = false;
        notificationStore.setNotificationInitStatus(false);
        await updateStoredUser(userStore.currentUser);
        webApiService.clearCookies();
        loginForm.value.lastUserLoggedIn = '';
        // workerTimers.setTimeout(() => location.reload(), 500);
        await configRepository.remove('lastUserLoggedIn');
        setAttemptingAutoLogin(false);
        autoLoginAttempts.clear();
        closeWebSocket();
        queryClient.clear();
    }

    /**
     * Runs post-login side effects after a successful auth response.
     * @param {object} json Current user payload from auth API.
     */
    function runLoginSuccessFlow(json) {
        updateLoopStore.setNextCurrentUserRefresh(420); // 7mins
        userStore.applyCurrentUser(json);
        initWebsocket();
    }

    return {
        runLogoutFlow,
        runLoginSuccessFlow
    };
}
