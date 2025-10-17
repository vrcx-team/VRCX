import { reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import Noty from 'noty';

import { closeWebSocket, initWebsocket } from '../service/websocket';
import { AppDebug } from '../service/appConfig';
import { authRequest } from '../api';
import { database } from '../service/database';
import { escapeTag } from '../shared/utils';
import { request } from '../service/request';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useNotificationStore } from './notification';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVrcxStore } from './vrcx';
import { watchState } from '../service/watchState';

import configRepository from '../service/config';
import security from '../service/security';
import webApiService from '../service/webapi';

export const useAuthStore = defineStore('Auth', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const notificationStore = useNotificationStore();
    const userStore = useUserStore();
    const updateLoopStore = useUpdateLoopStore();
    const vrcxStore = useVrcxStore();

    const { t } = useI18n();
    const state = reactive({
        autoLoginAttempts: new Set(),
        enableCustomEndpoint: false,
        cachedConfig: {}
    });

    const loginForm = ref({
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
    });

    const enablePrimaryPasswordDialog = ref({
        visible: false,
        password: '',
        rePassword: '',
        beforeClose(done) {
            // $app._data.enablePrimaryPassword = false;
            done();
        }
    });

    const credentialsToSave = ref(null);

    const twoFactorAuthDialogVisible = ref(false);

    const cachedConfig = ref({});

    const enableCustomEndpoint = ref(false);

    const attemptingAutoLogin = ref(false);

    watch(
        [() => watchState.isLoggedIn, () => userStore.currentUser],
        ([isLoggedIn, currentUser]) => {
            twoFactorAuthDialogVisible.value = false;
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

    async function init() {
        const [savedCredentials, lastUserLoggedIn, enableCustomEndpoint] =
            await Promise.all([
                configRepository.getString('savedCredentials', '{}'),
                configRepository.getString('lastUserLoggedIn', ''),
                configRepository.getBool('VRCX_enableCustomEndpoint', false)
            ]);
        loginForm.value.lastUserLoggedIn = lastUserLoggedIn;
        try {
            const credentials = JSON.parse(savedCredentials || '{}');
            // fix goofy typo
            let edited = false;
            for (const userId in credentials) {
                if (credentials[userId].loginParmas) {
                    credentials[userId].loginParams =
                        credentials[userId].loginParmas;
                    delete credentials[userId].loginParmas;
                    edited = true;
                }
            }
            if (edited) {
                await configRepository.setString(
                    'savedCredentials',
                    JSON.stringify(credentials)
                );
            }
            loginForm.value.savedCredentials = credentials;
        } catch (error) {
            console.error('Failed to parse savedCredentials:', error);
            loginForm.value.savedCredentials = {};
        }
        state.enableCustomEndpoint = enableCustomEndpoint;
    }

    init();

    async function handleLogoutEvent() {
        if (watchState.isLoggedIn) {
            new Noty({
                type: 'success',
                text: `See you again, <strong>${escapeTag(
                    userStore.currentUser.displayName
                )}</strong>!`
            }).show();
        }
        userStore.userDialog.visible = false;
        watchState.isLoggedIn = false;
        watchState.isFriendsLoaded = false;
        watchState.isFavoritesLoaded = false;
        notificationStore.notificationInitStatus = false;
        await updateStoredUser(userStore.currentUser);
        webApiService.clearCookies();
        loginForm.value.lastUserLoggedIn = '';
        await configRepository.remove('lastUserLoggedIn');
        // workerTimers.setTimeout(() => location.reload(), 500);
        attemptingAutoLogin.value = false;
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
                loginForm.value.savedCredentials[
                    loginForm.value.lastUserLoggedIn
                ];
            if (user?.loginParams?.endpoint) {
                AppDebug.endpointDomain = user.loginParams.endpoint;
                AppDebug.websocketDomain = user.loginParams.websocket;
            }
            // login at startup
            loginForm.value.loading = true;
            authRequest
                .getConfig()
                .catch((err) => {
                    loginForm.value.loading = false;
                    throw err;
                })
                .then(() => {
                    userStore
                        .getCurrentUser()
                        .finally(() => {
                            loginForm.value.loading = false;
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
        if (loginForm.value.lastUserLoggedIn) {
            const user =
                loginForm.value.savedCredentials[
                    loginForm.value.lastUserLoggedIn
                ];
            if (typeof user !== 'undefined') {
                delete user.cookies;
                await relogin(user);
            }
        }
    }

    async function resendEmail2fa() {
        if (loginForm.value.lastUserLoggedIn) {
            const user =
                loginForm.value.savedCredentials[
                    loginForm.value.lastUserLoggedIn
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

        enablePrimaryPasswordDialog.value.password = '';
        enablePrimaryPasswordDialog.value.rePassword = '';
        if (advancedSettingsStore.enablePrimaryPassword) {
            enablePrimaryPasswordDialog.value.visible = true;
        } else {
            ElMessageBox.prompt(
                t('prompt.primary_password.description'),
                t('prompt.primary_password.header'),
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({ value }) => {
                    for (const userId in loginForm.value.savedCredentials) {
                        security
                            .decrypt(
                                loginForm.value.savedCredentials[userId]
                                    .loginParams.password,
                                value
                            )
                            .then(async (pt) => {
                                credentialsToSave.value = {
                                    username:
                                        loginForm.value.savedCredentials[userId]
                                            .loginParams.username,
                                    password: pt
                                };
                                await updateStoredUser(
                                    loginForm.value.savedCredentials[userId]
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
        enablePrimaryPasswordDialog.value.visible = false;
        if (advancedSettingsStore.enablePrimaryPassword) {
            const key = enablePrimaryPasswordDialog.value.password;
            for (const userId in loginForm.value.savedCredentials) {
                security
                    .encrypt(
                        loginForm.value.savedCredentials[userId].loginParams
                            .password,
                        key
                    )
                    .then((ct) => {
                        credentialsToSave.value = {
                            username:
                                loginForm.value.savedCredentials[userId]
                                    .loginParams.username,
                            password: ct
                        };
                        updateStoredUser(
                            loginForm.value.savedCredentials[userId].user
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
        if (credentialsToSave.value) {
            savedCredentials[user.id] = {
                user,
                loginParams: {
                    username: '',
                    password: '',
                    endpoint: '',
                    websocket: '',
                    ...credentialsToSave.value
                }
            };
            credentialsToSave.value = null;
        } else if (typeof savedCredentials[user.id] !== 'undefined') {
            savedCredentials[user.id].user = user;
            savedCredentials[user.id].cookies =
                await webApiService.getCookies();
        }
        loginForm.value.savedCredentials = savedCredentials;
        const jsonCredentialsArray = JSON.stringify(savedCredentials);
        await configRepository.setString(
            'savedCredentials',
            jsonCredentialsArray
        );
        loginForm.value.lastUserLoggedIn = user.id;
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
            ElMessageBox.prompt(
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
        loginForm.value.endpoint = '';
        loginForm.value.websocket = '';
    }

    function logout() {
        ElMessageBox.confirm('Continue? Logout', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    const existingStyle = document.getElementById(
                        'login-container-style'
                    );
                    if (existingStyle) {
                        existingStyle.parentNode.removeChild(existingStyle);
                    }
                    handleLogoutEvent();
                }
            })
            .catch(() => {});
    }

    async function relogin(user) {
        const { loginParams } = user;
        if (user.cookies) {
            await webApiService.setCookies(user.cookies);
        }
        loginForm.value.lastUserLoggedIn = user.user.id; // for resend email 2fa
        if (loginParams.endpoint) {
            AppDebug.endpointDomain = loginParams.endpoint;
            AppDebug.websocketDomain = loginParams.websocket;
        } else {
            AppDebug.endpointDomain = AppDebug.endpointDomainVrchat;
            AppDebug.websocketDomain = AppDebug.websocketDomainVrchat;
        }
        return new Promise((resolve, reject) => {
            loginForm.value.loading = true;
            if (advancedSettingsStore.enablePrimaryPassword) {
                checkPrimaryPassword(loginParams)
                    .then((pwd) => {
                        return authRequest
                            .getConfig()
                            .catch((err) => {
                                reject(err);
                            })
                            .then(() => {
                                authLogin({
                                    username: loginParams.username,
                                    password: pwd,
                                    cipher: loginParams.password,
                                    endpoint: loginParams.endpoint,
                                    websocket: loginParams.websocket
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
                        ElMessage({
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
                            username: loginParams.username,
                            password: loginParams.password,
                            endpoint: loginParams.endpoint,
                            websocket: loginParams.websocket
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
        }).finally(() => (loginForm.value.loading = false));
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
        loginForm.value.savedCredentials = savedCredentials;
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
        if (!loginForm.value.loading) {
            loginForm.value.loading = true;
            if (loginForm.value.endpoint) {
                AppDebug.endpointDomain = loginForm.value.endpoint;
                AppDebug.websocketDomain = loginForm.value.websocket;
            } else {
                AppDebug.endpointDomain = AppDebug.endpointDomainVrchat;
                AppDebug.websocketDomain = AppDebug.websocketDomainVrchat;
            }
            authRequest
                .getConfig()
                .catch((err) => {
                    loginForm.value.loading = false;
                    throw err;
                })
                .then((args) => {
                    if (
                        loginForm.value.saveCredentials &&
                        advancedSettingsStore.enablePrimaryPassword
                    ) {
                        ElMessageBox.prompt(
                            t('prompt.primary_password.description'),
                            t('prompt.primary_password.header'),
                            {
                                inputType: 'password',
                                inputPattern: /[\s\S]{1,32}/
                            }
                        )
                            .then(({ value }) => {
                                const saveCredential =
                                    loginForm.value.savedCredentials[
                                        Object.keys(
                                            loginForm.value.savedCredentials
                                        )[0]
                                    ];
                                security
                                    .decrypt(
                                        saveCredential.loginParams.password,
                                        value
                                    )
                                    .then(() => {
                                        security
                                            .encrypt(
                                                loginForm.value.password,
                                                value
                                            )
                                            .then((pwd) => {
                                                authLogin({
                                                    username:
                                                        loginForm.value
                                                            .username,
                                                    password:
                                                        loginForm.value
                                                            .password,
                                                    endpoint:
                                                        loginForm.value
                                                            .endpoint,
                                                    websocket:
                                                        loginForm.value
                                                            .websocket,
                                                    saveCredentials:
                                                        loginForm.value
                                                            .saveCredentials,
                                                    cipher: pwd
                                                });
                                            });
                                    });
                            })
                            .finally(() => {
                                loginForm.value.loading = false;
                            })
                            .catch(() => {});
                        return args;
                    }
                    authLogin({
                        username: loginForm.value.username,
                        password: loginForm.value.password,
                        endpoint: loginForm.value.endpoint,
                        websocket: loginForm.value.websocket,
                        saveCredentials: loginForm.value.saveCredentials
                    }).finally(() => {
                        loginForm.value.loading = false;
                    });
                    return args;
                });
        }
    }

    function promptTOTP() {
        if (twoFactorAuthDialogVisible.value) {
            return;
        }
        AppApi.FlashWindow();
        twoFactorAuthDialogVisible.value = true;
        ElMessageBox.prompt(
            t('prompt.totp.description'),
            t('prompt.totp.header'),
            {
                distinguishCancelAndClose: true,
                cancelButtonText: t('prompt.totp.use_otp'),
                confirmButtonText: t('prompt.totp.verify'),
                inputPlaceholder: t('prompt.totp.input_placeholder'),
                inputPattern: /^[0-9]{6}$/,
                inputErrorMessage: t('prompt.totp.input_error'),
                beforeClose: (action, instance, done) => {
                    twoFactorAuthDialogVisible.value = false;
                    if (action === 'cancel') {
                        promptOTP();
                    }
                    done();
                }
            }
        )
            .then(({ value, action }) => {
                if (action === 'confirm') {
                    authRequest
                        .verifyTOTP({
                            code: value.trim()
                        })
                        .catch((err) => {
                            console.error(err);
                            clearCookiesTryLogin();
                        })
                        .then(() => {
                            userStore.getCurrentUser();
                        });
                }
            })
            .catch(() => {});
    }

    function promptOTP() {
        if (twoFactorAuthDialogVisible.value) {
            return;
        }
        twoFactorAuthDialogVisible.value = true;
        ElMessageBox.prompt(
            t('prompt.otp.description'),
            t('prompt.otp.header'),
            {
                distinguishCancelAndClose: true,
                cancelButtonText: t('prompt.otp.use_totp'),
                confirmButtonText: t('prompt.otp.verify'),
                inputPlaceholder: t('prompt.otp.input_placeholder'),
                inputPattern: /^[a-z0-9]{4}-[a-z0-9]{4}$/,
                inputErrorMessage: t('prompt.otp.input_error'),
                beforeClose: (action, instance, done) => {
                    twoFactorAuthDialogVisible.value = false;
                    if (action === 'cancel') {
                        promptTOTP();
                    }
                    done();
                }
            }
        )
            .then(({ value, action }) => {
                if (action === 'confirm') {
                    authRequest
                        .verifyOTP({
                            code: value.trim()
                        })
                        .catch((err) => {
                            console.error(err);
                            clearCookiesTryLogin();
                        })
                        .then(() => {
                            userStore.getCurrentUser();
                        });
                }
            })
            .catch(() => {});
    }

    function promptEmailOTP() {
        if (twoFactorAuthDialogVisible.value) {
            return;
        }
        AppApi.FlashWindow();
        twoFactorAuthDialogVisible.value = true;
        ElMessageBox.prompt(
            t('prompt.email_otp.description'),
            t('prompt.email_otp.header'),
            {
                distinguishCancelAndClose: true,
                cancelButtonText: t('prompt.email_otp.resend'),
                confirmButtonText: t('prompt.email_otp.verify'),
                inputPlaceholder: t('prompt.email_otp.input_placeholder'),
                inputPattern: /^[0-9]{6}$/,
                inputErrorMessage: t('prompt.email_otp.input_error'),
                beforeClose: (action, instance, done) => {
                    twoFactorAuthDialogVisible.value = false;
                    if (action === 'cancel') {
                        resendEmail2fa();
                        return;
                    }
                    done();
                }
            }
        )
            .then(({ value, action }) => {
                if (action === 'confirm') {
                    authRequest
                        .verifyEmailOTP({
                            code: value.trim()
                        })
                        .catch((err) => {
                            console.error(err);
                            promptEmailOTP();
                        })
                        .then(() => {
                            userStore.getCurrentUser();
                        });
                }
            })
            .catch(() => {});
    }

    /**
     * @param {{ username: string, password: string, endpoint: string, websocket: string, saveCredentials?: any, cipher?: string }} params credential to login
     * @returns {Promise<{origin: boolean, json: any}>}
     */
    function authLogin(params) {
        let {
            username,
            password,
            endpoint,
            websocket,
            saveCredentials,
            cipher
        } = params;
        const auth = btoa(
            `${encodeURIComponent(username)}:${encodeURIComponent(password)}`
        );
        if (saveCredentials) {
            params.saveCredentials = false;
            if (cipher) {
                password = cipher;
            }
            credentialsToSave.value = {
                username,
                password,
                endpoint,
                websocket
            };
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
        if (attemptingAutoLogin.value) {
            return;
        }
        attemptingAutoLogin.value = true;
        const user =
            loginForm.value.savedCredentials[loginForm.value.lastUserLoggedIn];
        if (typeof user === 'undefined') {
            attemptingAutoLogin.value = false;
            return;
        }
        if (advancedSettingsStore.enablePrimaryPassword) {
            console.error(
                'Primary password is enabled, this disables auto login.'
            );
            attemptingAutoLogin.value = false;
            handleLogoutEvent();
            return;
        }
        const attemptsInLastHour = Array.from(state.autoLoginAttempts).filter(
            (timestamp) => timestamp > new Date().getTime() - 3600000
        ).length;
        if (attemptsInLastHour >= 3) {
            console.error(
                'More than 3 auto login attempts within the past hour, logging out instead of attempting auto login.'
            );
            attemptingAutoLogin.value = false;
            handleLogoutEvent();
            return;
        }
        state.autoLoginAttempts.add(new Date().getTime());
        relogin(user)
            .then(() => {
                if (AppDebug.errorNoty) {
                    AppDebug.errorNoty.close();
                }
                AppDebug.errorNoty = new Noty({
                    type: 'success',
                    text: 'Automatically logged in.'
                }).show();
                console.log('Automatically logged in.');
            })
            .catch((err) => {
                if (AppDebug.errorNoty) {
                    AppDebug.errorNoty.close();
                }
                AppDebug.errorNoty = new Noty({
                    type: 'error',
                    text: 'Failed to login automatically.'
                }).show();
                console.error('Failed to login automatically.', err);
            })
            .finally(() => {
                if (!navigator.onLine) {
                    AppDebug.errorNoty = new Noty({
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
        credentialsToSave,
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
