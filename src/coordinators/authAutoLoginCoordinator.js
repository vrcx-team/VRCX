import { toast } from 'vue-sonner';
import { i18n } from '../plugins/i18n';

import { AppDebug } from '../services/appConfig';
import { useAdvancedSettingsStore } from '../stores/settings/advanced';
import { useAuthStore } from '../stores/auth';

/**
 * Runs the full auto-login orchestration flow.
 * @param {object} [options] Test seams.
 * @param {function} [options.isOnline] Online-check provider.
 */
export async function runHandleAutoLoginFlow({
    isOnline = () => navigator.onLine
} = {}) {
    const authStore = useAuthStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const t = i18n.global.t;

    if (authStore.attemptingAutoLogin) {
        console.warn('Already attempting auto login, skipping.');
        return;
    }
    authStore.setAttemptingAutoLogin(true);
    const user = await authStore.getSavedCredentials(
        authStore.loginForm.lastUserLoggedIn
    );
    if (!user) {
        console.log('No saved credentials found for auto login.');
        authStore.setAttemptingAutoLogin(false);
        return;
    }
    if (advancedSettingsStore.enablePrimaryPassword) {
        console.error('Primary password is enabled, this disables auto login.');
        authStore.setAttemptingAutoLogin(false);
        await authStore.handleLogoutEvent();
        return;
    }
    const currentTimestamp = Date.now();
    const attemptsInLastHour = Array.from(authStore.autoLoginAttempts).filter(
        (timestamp) => timestamp > currentTimestamp - 3600000
    ).length;
    if (attemptsInLastHour >= 3) {
        console.error(
            'More than 3 auto login attempts within the past hour, logging out instead of attempting auto login.'
        );
        authStore.setAttemptingAutoLogin(false);
        await authStore.handleLogoutEvent();
        AppApi.FlashWindow();
        return;
    }
    authStore.autoLoginAttempts.add(currentTimestamp);
    console.log('Attempting automatic login...');
    try {
        await authStore.relogin(user);
        if (AppDebug.errorNoty) {
            toast.dismiss(AppDebug.errorNoty);
        }
        AppDebug.errorNoty = toast.success(
            t('message.auth.auto_login_success')
        );
        console.log('Automatically logged in.');
    } catch (err) {
        if (AppDebug.errorNoty) {
            toast.dismiss(AppDebug.errorNoty);
        }
        AppDebug.errorNoty = toast.error(t('message.auth.auto_login_failed'));
        console.error('Failed to login automatically.', err);
    } finally {
        authStore.setAttemptingAutoLogin(false);
        if (!isOnline()) {
            AppDebug.errorNoty = toast.error(t('message.auth.offline'));
            console.error(`You're offline.`);
        }
    }
}
