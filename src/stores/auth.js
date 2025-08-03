import Noty from 'noty';
import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { authRequest } from '../api';
import { $app } from '../app';
import { useI18n } from 'vue-i18n-bridge';
import configRepository from '../service/config';
import { database } from '../service/database';
import { AppGlobal } from '../service/appConfig';
import { request } from '../service/request';
import security from '../service/security';
import webApiService from '../service/webapi';
import { closeWebSocket, initWebsocket } from '../service/websocket';
import { watchState } from '../service/watchState';
import { escapeTag } from '../shared/utils';
import { useNotificationStore } from './notification';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVrcxStore } from './vrcx';

export const useAuthStore = defineStore('Auth', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const notificationStore = useNotificationStore();
    const userStore = useUserStore();
    const updateLoopStore = useUpdateLoopStore();
    const vrcxStore = useVrcxStore();

    const { t } = useI18n();
    const state = reactive({
        attemptingAutoLogin: false,
        autoLoginAttempts: new Set(),
        loginForm: {
            loading: false,
            username: '',
            password: '',
            endpoint: '',
            websocket: '',
            saveCredentials: false,
            savedCredentials: {},
            lastUserLoggedIn: '',
            rules: {
                username: [
                    {
                        required: true,
                        trigger: 'blur'
                    }
                ],
                password: [
                    {
                        required: true,
                        trigger: 'blur'
                    }
                ]
            }
        },
        enablePrimaryPasswordDialog: {
            visible: false,
            password: '',
            rePassword: '',
            beforeClose(done) {
                $app._data.enablePrimaryPassword = false;
                done();
            }
        },
        saveCredentials: null,
        // it's a flag
        twoFactorAuthDialogVisible: false,
        enableCustomEndpoint: false,
        cachedConfig: {}
    });

    async function init() {
        const [savedCredentials, lastUserLoggedIn, enableCustomEndpoint] =
            await Promise.all([
                configRepository.getString('savedCredentials'),
                configRepository.getString('lastUserLoggedIn'),
                configRepository.getBool('VRCX_enableCustomEndpoint', false)
            ]);
        try {
            state.loginForm = {
                ...state.loginForm,
                savedCredentials: savedCredentials
                    ? JSON.parse(savedCredentials)
                    : {},
                lastUserLoggedIn
            };
        } catch (error) {
            console.error('Failed to parse savedCredentials:', error);
            state.loginForm = {
                ...state.loginForm,
                savedCredentials: {},
                lastUserLoggedIn
            };
        }
        state.enableCustomEndpoint = enableCustomEndpoint;
    }

    init();

    const loginForm = computed({
        get: () => state.loginForm,
        set: (value) => {
            state.loginForm = value;
        }
    });

    const enablePrimaryPasswordDialog = computed({
        get: () => state.enablePrimaryPasswordDialog,
        set: (value) => {
            state.enablePrimaryPasswordDialog = value;
        }
    });

    const saveCredentials = computed({
        get: () => state.saveCredentials,
        set: (value) => {
            state.saveCredentials = value;
        }
    });

    const twoFactorAuthDialogVisible = computed({
        get: () => state.twoFactorAuthDialogVisible,
        set: (value) => {
            state.twoFactorAuthDialogVisible = value;
        }
    });

    const cachedConfig = computed({
        get: () => state.cachedConfig,
        set: (value) => {
            state.cachedConfig = value;
        }
    });

    const enableCustomEndpoint = computed({
        get: () => state.enableCustomEndpoint,
        set: (value) => {
            state.enableCustomEndpoint = value;
        }
    });

    const attemptingAutoLogin = computed({
        get: () => state.attemptingAutoLogin,
        set: (value) => {
            state.attemptingAutoLogin = value;
        }
    });

    watch(
        [() => watchState.isLoggedIn, () => userStore.currentUser],
        ([isLoggedIn, currentUser]) => {
            state.twoFactorAuthDialogVisible = false;
            if (isLoggedIn) {
                updateStoredUser(currentUser);
                new Noty({
                    type: 'success',
                    text: `Hello there, <strong>${escapeTag(
                        currentUser.displayName
                    )}</strong>!`
                }).show();
            }
        },
        { flush: 'sync' }
    );

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                initWebsocket();
                AppApi.IPCAnnounceStart();
            }
        },
        { flush: 'sync' }
    );

    async function handleLogoutEvent() {
        if (watchState.isLoggedIn) {
            new Noty({
                type: 'success',
                text: `See you again, <strong>${escapeTag(
                    userStore.currentUser.displayName
                )}</strong>!`
            }).show();
        }
        watchState.isLoggedIn = false;
        watchState.isFriendsLoaded = false;
        notificationStore.notificationInitStatus = false;
        await updateStoredUser(userStore.currentUser);
        webApiService.clearCookies();
        state.loginForm.lastUserLoggedIn = '';
        await configRepository.remove('lastUserLoggedIn');
        // workerTimers.setTimeout(() => location.reload(), 500);
        state.attemptingAutoLogin = false;
        state.autoLoginAttempts.clear();
        closeWebSocket();
    }

    /**
     * Automatically logs in the last user after the app is mounted.
     * @returns {Promise<void>}
     */
    async function autoLoginAfterMounted() {
        if (
            !advancedSettingsStore.enablePrimaryPassword &&
            (await configRepository.getString('lastUserLoggedIn')) !== null
        ) {
            const user =
                state.loginForm.savedCredentials[
                    state.loginForm.lastUserLoggedIn
                ];
            if (user?.loginParmas?.endpoint) {
                AppGlobal.endpointDomain = user.loginParmas.endpoint;
                AppGlobal.websocketDomain = user.loginParmas.websocket;
            }
            // login at startup
            state.loginForm.loading = true;
            authRequest
                .getConfig()
                .catch((err) => {
                    state.loginForm.loading = false;
                    throw err;
                })
                .then(() => {
                    userStore
                        .getCurrentUser()
                        .finally(() => {
                            state.loginForm.loading = false;
                        })
                        .catch((err) => {
                            updateLoopStore.nextCurrentUserRefresh = 60; // 1min
                            console.error(err);
                        });
                });
        }
    }

    async function clearCookiesTryLogin() {
        await webApiService.clearCookies();
        if (state.loginForm.lastUserLoggedIn) {
            const user =
                state.loginForm.savedCredentials[
                    state.loginForm.lastUserLoggedIn
                ];
            if (typeof user !== 'undefined') {
                delete user.cookies;
                await relogin(user);
            }
        }
    }

    async function resendEmail2fa() {
        if (state.loginForm.lastUserLoggedIn) {
            const user =
                state.loginForm.savedCredentials[
                    state.loginForm.lastUserLoggedIn
                ];
            if (typeof user !== 'undefined') {
                await webApiService.clearCookies();
                delete user.cookies;
                relogin(user).then(() => {
                    new Noty({
                        type: 'success',
                        text: 'Email 2FA resent.'
                    }).show();
                });
                return;
            }
        }
        new Noty({
            type: 'error',
            text: 'Cannot send 2FA email without saved credentials. Please login again.'
        }).show();
    }

    function enablePrimaryPasswordChange() {
        advancedSettingsStore.enablePrimaryPassword =
            !advancedSettingsStore.enablePrimaryPassword;

        state.enablePrimaryPasswordDialog.password = '';
        state.enablePrimaryPasswordDialog.rePassword = '';
        if (advancedSettingsStore.enablePrimaryPassword) {
            state.enablePrimaryPasswordDialog.visible = true;
        } else {
            $app.$prompt(
                t('prompt.primary_password.description'),
                t('prompt.primary_password.header'),
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({ value }) => {
                    for (const userId in state.loginForm.savedCredentials) {
                        security
                            .decrypt(
                                state.loginForm.savedCredentials[userId]
                                    .loginParmas.password,
                                value
                            )
                            .then(async (pt) => {
                                state.saveCredentials = {
                                    username:
                                        state.loginForm.savedCredentials[userId]
                                            .loginParmas.username,
                                    password: pt
                                };
                                await updateStoredUser(
                                    state.loginForm.savedCredentials[userId]
                                        .user
                                );
                                await configRepository.setBool(
                                    'enablePrimaryPassword',
                                    false
                                );
                            })
                            .catch(async () => {
                                advancedSettingsStore.enablePrimaryPassword = true;
                                advancedSettingsStore.setEnablePrimaryPasswordConfigRepository(
                                    true
                                );
                            });
                    }
                })
                .catch(async () => {
                    advancedSettingsStore.enablePrimaryPassword = true;
                    advancedSettingsStore.setEnablePrimaryPasswordConfigRepository(
                        true
                    );
                });
        }
    }
    async function setPrimaryPassword() {
        await configRepository.setBool(
            'enablePrimaryPassword',
            advancedSettingsStore.enablePrimaryPassword
        );
        state.enablePrimaryPasswordDialog.visible = false;
        if (advancedSettingsStore.enablePrimaryPassword) {
            const key = state.enablePrimaryPasswordDialog.password;
            for (const userId in state.loginForm.savedCredentials) {
                security
                    .encrypt(
                        state.loginForm.savedCredentials[userId].loginParmas
                            .password,
                        key
                    )
                    .then((ct) => {
                        state.saveCredentials = {
                            username:
                                state.loginForm.savedCredentials[userId]
                                    .loginParmas.username,
                            password: ct
                        };
                        updateStoredUser(
                            state.loginForm.savedCredentials[userId].user
                        );
                    });
            }
        }
    }

    async function updateStoredUser(user) {
        let savedCredentials = {};
        if ((await configRepository.getString('savedCredentials')) !== null) {
            savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
        }
        if (state.saveCredentials) {
            const credentialsToSave = {
                user,
                loginParmas: state.saveCredentials
            };
            savedCredentials[user.id] = credentialsToSave;
            state.saveCredentials = null;
        } else if (typeof savedCredentials[user.id] !== 'undefined') {
            savedCredentials[user.id].user = user;
            savedCredentials[user.id].cookies =
                await webApiService.getCookies();
        }
        state.loginForm.savedCredentials = savedCredentials;
        const jsonCredentialsArray = JSON.stringify(savedCredentials);
        await configRepository.setString(
            'savedCredentials',
            jsonCredentialsArray
        );
        state.loginForm.lastUserLoggedIn = user.id;
        await configRepository.setString('lastUserLoggedIn', user.id);
    }

    async function migrateStoredUsers() {
        let savedCredentials = {};
        if ((await configRepository.getString('savedCredentials')) !== null) {
            savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
        }
        for (const name in savedCredentials) {
            const userId = savedCredentials[name]?.user?.id;
            if (userId && userId !== name) {
                savedCredentials[userId] = savedCredentials[name];
                delete savedCredentials[name];
            }
        }
        await configRepository.setString(
            'savedCredentials',
            JSON.stringify(savedCredentials)
        );
    }

    function checkPrimaryPassword(args) {
        return new Promise((resolve, reject) => {
            if (!advancedSettingsStore.enablePrimaryPassword) {
                resolve(args.password);
            }
            $app.$prompt(
                t('prompt.primary_password.description'),
                t('prompt.primary_password.header'),
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({ value }) => {
                    security
                        .decrypt(args.password, value)
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    async function toggleCustomEndpoint() {
        await configRepository.setBool(
            'VRCX_enableCustomEndpoint',
            state.enableCustomEndpoint
        );
        state.loginForm.endpoint = '';
        state.loginForm.websocket = '';
    }

    function logout() {
        $app.$confirm('Continue? Logout', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    const existingStyle = document.getElementById(
                        'login-container-style'
                    );
                    if (existingStyle) {
                        existingStyle.parentNode.removeChild(existingStyle);
                    }
                    handleLogoutEvent();
                }
            }
        });
    }

    async function relogin(user) {
        const { loginParmas } = user;
        if (user.cookies) {
            await webApiService.setCookies(user.cookies);
        }
        state.loginForm.lastUserLoggedIn = user.user.id; // for resend email 2fa
        if (loginParmas.endpoint) {
            AppGlobal.endpointDomain = loginParmas.endpoint;
            AppGlobal.websocketDomain = loginParmas.websocket;
        } else {
            AppGlobal.endpointDomain = AppGlobal.endpointDomainVrchat;
            AppGlobal.websocketDomain = AppGlobal.websocketDomainVrchat;
        }
        return new Promise((resolve, reject) => {
            state.loginForm.loading = true;
            if (advancedSettingsStore.enablePrimaryPassword) {
                checkPrimaryPassword(loginParmas)
                    .then((pwd) => {
                        return authRequest
                            .getConfig()
                            .catch((err) => {
                                reject(err);
                            })
                            .then(() => {
                                authLogin({
                                    username: loginParmas.username,
                                    password: pwd,
                                    cipher: loginParmas.password,
                                    endpoint: loginParmas.endpoint,
                                    websocket: loginParmas.websocket
                                })
                                    .catch((err2) => {
                                        reject(err2);
                                    })
                                    .then(() => {
                                        resolve();
                                    });
                            });
                    })
                    .catch((_) => {
                        $app.$message({
                            message: 'Incorrect primary password',
                            type: 'error'
                        });
                        reject(_);
                    });
            } else {
                authRequest
                    .getConfig()
                    .catch((err) => {
                        reject(err);
                    })
                    .then(() => {
                        authLogin({
                            username: loginParmas.username,
                            password: loginParmas.password,
                            endpoint: loginParmas.endpoint,
                            websocket: loginParmas.websocket
                        })
                            .catch((err2) => {
                                handleLogoutEvent();
                                reject(err2);
                            })
                            .then(() => {
                                resolve();
                            });
                    });
            }
        }).finally(() => (state.loginForm.loading = false));
    }

    async function deleteSavedLogin(userId) {
        const savedCredentials = JSON.parse(
            await configRepository.getString('savedCredentials')
        );
        delete savedCredentials[userId];
        // Disable primary password when no account is available.
        if (Object.keys(savedCredentials).length === 0) {
            advancedSettingsStore.enablePrimaryPassword = false;
            advancedSettingsStore.setEnablePrimaryPasswordConfigRepository(
                false
            );
        }
        state.loginForm.savedCredentials = savedCredentials;
        const jsonCredentials = JSON.stringify(savedCredentials);
        await configRepository.setString('savedCredentials', jsonCredentials);
        new Noty({
            type: 'success',
            text: 'Account removed.'
        }).show();
    }

    async function login() {
        // TODO: remove/refactor saveCredentials & primaryPassword (security)
        await webApiService.clearCookies();
        if (!state.loginForm.loading) {
            state.loginForm.loading = true;
            if (state.loginForm.endpoint) {
                AppGlobal.endpointDomain = state.loginForm.endpoint;
                AppGlobal.websocketDomain = state.loginForm.websocket;
            } else {
                AppGlobal.endpointDomain = AppGlobal.endpointDomainVrchat;
                AppGlobal.websocketDomain = AppGlobal.websocketDomainVrchat;
            }
            authRequest
                .getConfig()
                .catch((err) => {
                    state.loginForm.loading = false;
                    throw err;
                })
                .then((args) => {
                    if (
                        state.loginForm.saveCredentials &&
                        advancedSettingsStore.enablePrimaryPassword
                    ) {
                        $app.$prompt(
                            t('prompt.primary_password.description'),
                            t('prompt.primary_password.header'),
                            {
                                inputType: 'password',
                                inputPattern: /[\s\S]{1,32}/
                            }
                        )
                            .then(({ value }) => {
                                const saveCredential =
                                    state.loginForm.savedCredentials[
                                        Object.keys(
                                            state.loginForm.savedCredentials
                                        )[0]
                                    ];
                                security
                                    .decrypt(
                                        saveCredential.loginParmas.password,
                                        value
                                    )
                                    .then(() => {
                                        security
                                            .encrypt(
                                                state.loginForm.password,
                                                value
                                            )
                                            .then((pwd) => {
                                                authLogin({
                                                    username:
                                                        state.loginForm
                                                            .username,
                                                    password:
                                                        state.loginForm
                                                            .password,
                                                    endpoint:
                                                        state.loginForm
                                                            .endpoint,
                                                    websocket:
                                                        state.loginForm
                                                            .websocket,
                                                    saveCredentials:
                                                        state.loginForm
                                                            .saveCredentials,
                                                    cipher: pwd
                                                });
                                            });
                                    });
                            })
                            .finally(() => {
                                state.loginForm.loading = false;
                            });
                        return args;
                    }
                    authLogin({
                        username: state.loginForm.username,
                        password: state.loginForm.password,
                        endpoint: state.loginForm.endpoint,
                        websocket: state.loginForm.websocket,
                        saveCredentials: state.loginForm.saveCredentials
                    }).finally(() => {
                        state.loginForm.loading = false;
                    });
                    return args;
                });
        }
    }

    function promptTOTP() {
        if (state.twoFactorAuthDialogVisible) {
            return;
        }
        AppApi.FlashWindow();
        state.twoFactorAuthDialogVisible = true;
        $app.$prompt(t('prompt.totp.description'), t('prompt.totp.header'), {
            distinguishCancelAndClose: true,
            cancelButtonText: t('prompt.totp.use_otp'),
            confirmButtonText: t('prompt.totp.verify'),
            inputPlaceholder: t('prompt.totp.input_placeholder'),
            inputPattern: /^[0-9]{6}$/,
            inputErrorMessage: t('prompt.totp.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm') {
                    authRequest
                        .verifyTOTP({
                            code: instance.inputValue.trim()
                        })
                        .catch((err) => {
                            clearCookiesTryLogin();
                            throw err;
                        })
                        .then((args) => {
                            userStore.getCurrentUser();
                            return args;
                        });
                } else if (action === 'cancel') {
                    promptOTP();
                }
            },
            beforeClose: (action, instance, done) => {
                state.twoFactorAuthDialogVisible = false;
                done();
            }
        });
    }

    function promptOTP() {
        if (state.twoFactorAuthDialogVisible) {
            return;
        }
        state.twoFactorAuthDialogVisible = true;
        $app.$prompt(t('prompt.otp.description'), t('prompt.otp.header'), {
            distinguishCancelAndClose: true,
            cancelButtonText: t('prompt.otp.use_totp'),
            confirmButtonText: t('prompt.otp.verify'),
            inputPlaceholder: t('prompt.otp.input_placeholder'),
            inputPattern: /^[a-z0-9]{4}-[a-z0-9]{4}$/,
            inputErrorMessage: t('prompt.otp.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm') {
                    authRequest
                        .verifyOTP({
                            code: instance.inputValue.trim()
                        })
                        .catch((err) => {
                            clearCookiesTryLogin();
                            throw err;
                        })
                        .then((args) => {
                            userStore.getCurrentUser();
                            return args;
                        });
                } else if (action === 'cancel') {
                    promptTOTP();
                }
            },
            beforeClose: (action, instance, done) => {
                state.twoFactorAuthDialogVisible = false;
                done();
            }
        });
    }

    function promptEmailOTP() {
        if (state.twoFactorAuthDialogVisible) {
            return;
        }
        AppApi.FlashWindow();
        state.twoFactorAuthDialogVisible = true;
        $app.$prompt(
            t('prompt.email_otp.description'),
            t('prompt.email_otp.header'),
            {
                distinguishCancelAndClose: true,
                cancelButtonText: t('prompt.email_otp.resend'),
                confirmButtonText: t('prompt.email_otp.verify'),
                inputPlaceholder: t('prompt.email_otp.input_placeholder'),
                inputPattern: /^[0-9]{6}$/,
                inputErrorMessage: t('prompt.email_otp.input_error'),
                callback: (action, instance) => {
                    if (action === 'confirm') {
                        authRequest
                            .verifyEmailOTP({
                                code: instance.inputValue.trim()
                            })
                            .catch((err) => {
                                promptEmailOTP();
                                throw err;
                            })
                            .then((args) => {
                                userStore.getCurrentUser();
                                return args;
                            });
                    } else if (action === 'cancel') {
                        resendEmail2fa();
                    }
                },
                beforeClose: (action, instance, done) => {
                    state.twoFactorAuthDialogVisible = false;
                    done();
                }
            }
        );
    }

    /**
     * @param {{ username: string, password: string, saveCredentials: any, cipher: string }} params credential to login
     * @returns {Promise<{origin: boolean, json: any}>}
     */
    function authLogin(params) {
        let { username, password, saveCredentials, cipher } = params;
        username = encodeURIComponent(username);
        password = encodeURIComponent(password);
        const auth = btoa(`${username}:${password}`);
        if (saveCredentials) {
            delete params.saveCredentials;
            if (cipher) {
                params.password = cipher;
                delete params.cipher;
            }
            state.saveCredentials = params;
        }
        return request('auth/user', {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`
            }
        }).then((json) => {
            const args = {
                json,
                origin: true
            };
            handleCurrentUserUpdate(json);
            return args;
        });
    }

    function handleCurrentUserUpdate(json) {
        if (
            json.requiresTwoFactorAuth &&
            json.requiresTwoFactorAuth.includes('emailOtp')
        ) {
            promptEmailOTP();
        } else if (json.requiresTwoFactorAuth) {
            promptTOTP();
        } else {
            updateLoopStore.nextCurrentUserRefresh = 420; // 7mins
            userStore.applyCurrentUser(json);
            initWebsocket();
        }
    }

    function handleAutoLogin() {
        if (state.attemptingAutoLogin) {
            return;
        }
        state.attemptingAutoLogin = true;
        const user =
            state.loginForm.savedCredentials[state.loginForm.lastUserLoggedIn];
        if (typeof user === 'undefined') {
            state.attemptingAutoLogin = false;
            return;
        }
        if (advancedSettingsStore.enablePrimaryPassword) {
            console.error(
                'Primary password is enabled, this disables auto login.'
            );
            state.attemptingAutoLogin = false;
            logout();
            return;
        }
        const attemptsInLastHour = Array.from(state.autoLoginAttempts).filter(
            (timestamp) => timestamp > new Date().getTime() - 3600000
        ).length;
        if (attemptsInLastHour >= 3) {
            console.error(
                'More than 3 auto login attempts within the past hour, logging out instead of attempting auto login.'
            );
            state.attemptingAutoLogin = false;
            logout();
            return;
        }
        state.autoLoginAttempts.add(new Date().getTime());
        relogin(user)
            .then(() => {
                if (AppGlobal.errorNoty) {
                    AppGlobal.errorNoty.close();
                }
                AppGlobal.errorNoty = new Noty({
                    type: 'success',
                    text: 'Automatically logged in.'
                }).show();
                console.log('Automatically logged in.');
            })
            .catch((err) => {
                if (AppGlobal.errorNoty) {
                    AppGlobal.errorNoty.close();
                }
                AppGlobal.errorNoty = new Noty({
                    type: 'error',
                    text: 'Failed to login automatically.'
                }).show();
                console.error('Failed to login automatically.', err);
            })
            .finally(() => {
                if (!navigator.onLine) {
                    AppGlobal.errorNoty = new Noty({
                        type: 'error',
                        text: `You're offline.`
                    }).show();
                    console.error(`You're offline.`);
                }
            });
    }

    async function loginComplete() {
        await database.initUserTables(userStore.currentUser.id);
        watchState.isLoggedIn = true;
        AppApi.CheckGameRunning(); // restore state from hot-reload
        vrcxStore.updateDatabaseVersion();
    }

    return {
        state,
        loginForm,
        enablePrimaryPasswordDialog,
        saveCredentials,
        twoFactorAuthDialogVisible,
        cachedConfig,
        enableCustomEndpoint,
        attemptingAutoLogin,

        clearCookiesTryLogin,
        resendEmail2fa,
        enablePrimaryPasswordChange,
        setPrimaryPassword,
        updateStoredUser,
        migrateStoredUsers,
        checkPrimaryPassword,
        autoLoginAfterMounted,
        toggleCustomEndpoint,
        logout,
        relogin,
        deleteSavedLogin,
        login,
        handleAutoLogin,
        handleLogoutEvent,
        handleCurrentUserUpdate,
        loginComplete
    };
});
