/**
 * @param {object} deps Coordinator dependencies.
 * @returns {object} Auto-login flow coordinator methods.
 */
export function createAuthAutoLoginCoordinator(deps) {
    const {
        getIsAttemptingAutoLogin,
        setAttemptingAutoLogin,
        getLastUserLoggedIn,
        getSavedCredentials,
        isPrimaryPasswordEnabled,
        handleLogoutEvent,
        autoLoginAttempts,
        relogin,
        notifyAutoLoginSuccess,
        notifyAutoLoginFailed,
        notifyOffline,
        flashWindow,
        isOnline,
        now
    } = deps;

    /**
     * Runs the full auto-login orchestration flow.
     */
    async function runHandleAutoLoginFlow() {
        if (getIsAttemptingAutoLogin()) {
            return;
        }
        setAttemptingAutoLogin(true);
        const user = await getSavedCredentials(getLastUserLoggedIn());
        if (!user) {
            setAttemptingAutoLogin(false);
            return;
        }
        if (isPrimaryPasswordEnabled()) {
            console.error(
                'Primary password is enabled, this disables auto login.'
            );
            setAttemptingAutoLogin(false);
            await handleLogoutEvent();
            return;
        }
        const currentTimestamp = now();
        const attemptsInLastHour = Array.from(autoLoginAttempts).filter(
            (timestamp) => timestamp > currentTimestamp - 3600000
        ).length;
        if (attemptsInLastHour >= 3) {
            console.error(
                'More than 3 auto login attempts within the past hour, logging out instead of attempting auto login.'
            );
            setAttemptingAutoLogin(false);
            await handleLogoutEvent();
            flashWindow();
            return;
        }
        autoLoginAttempts.add(currentTimestamp);
        console.log('Attempting automatic login...');
        relogin(user)
            .then(() => {
                notifyAutoLoginSuccess();
                console.log('Automatically logged in.');
            })
            .catch((err) => {
                notifyAutoLoginFailed();
                console.error('Failed to login automatically.', err);
            })
            .finally(() => {
                setAttemptingAutoLogin(false);
                if (!isOnline()) {
                    notifyOffline();
                    console.error(`You're offline.`);
                }
            });
    }

    return {
        runHandleAutoLoginFlow
    };
}
