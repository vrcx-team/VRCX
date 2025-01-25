import Noty from 'noty';
import security from '../security.js';
import configRepository from '../repository/config.js';
import { baseClass, $app, API, $t } from './baseClass.js';
/* eslint-disable no-unused-vars */
let webApiService = {};
/* eslint-enable no-unused-vars */

export default class extends baseClass {
    constructor(_app, _API, _t, _webApiService) {
        super(_app, _API, _t);
        webApiService = _webApiService;
    }

    async init() {
        API.isLoggedIn = false;
        API.attemptingAutoLogin = false;
        API.autoLoginAttempts = new Set();

        /**
         * @param {{ username: string, password: string }} params credential to login
         * @returns {Promise<{origin: boolean, json: any, params}>}
         */
        API.login = function (params) {
            var { username, password, saveCredentials, cipher } = params;
            username = encodeURIComponent(username);
            password = encodeURIComponent(password);
            var auth = btoa(`${username}:${password}`);
            if (saveCredentials) {
                delete params.saveCredentials;
                if (cipher) {
                    params.password = cipher;
                    delete params.cipher;
                }
                $app.saveCredentials = params;
            }
            return this.call('auth/user', {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }).then((json) => {
                var args = {
                    json,
                    params,
                    origin: true
                };
                if (
                    json.requiresTwoFactorAuth &&
                    json.requiresTwoFactorAuth.includes('emailOtp')
                ) {
                    this.$emit('USER:EMAILOTP', args);
                } else if (json.requiresTwoFactorAuth) {
                    this.$emit('USER:2FA', args);
                } else {
                    this.$emit('USER:CURRENT', args);
                }
                return args;
            });
        };

        /**
         * @param {{ code: string }} params One-time password
         * @returns {Promise<{json: any, params}>}
         */
        API.verifyOTP = function (params) {
            return this.call('auth/twofactorauth/otp/verify', {
                method: 'POST',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('OTP', args);
                return args;
            });
        };

        /**
         * @param {{ code: string }} params One-time token
         * @returns {Promise<{json: any, params}>}
         */
        API.verifyTOTP = function (params) {
            return this.call('auth/twofactorauth/totp/verify', {
                method: 'POST',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('TOTP', args);
                return args;
            });
        };

        /**
         * @param {{ code: string }} params One-time token
         * @returns {Promise<{json: any, params}>}
         */
        API.verifyEmailOTP = function (params) {
            return this.call('auth/twofactorauth/emailotp/verify', {
                method: 'POST',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('EMAILOTP', args);
                return args;
            });
        };

        API.$on('AUTOLOGIN', function () {
            if (this.attemptingAutoLogin) {
                return;
            }
            this.attemptingAutoLogin = true;
            var user =
                $app.loginForm.savedCredentials[
                    $app.loginForm.lastUserLoggedIn
                ];
            if (typeof user === 'undefined') {
                this.attemptingAutoLogin = false;
                return;
            }
            if ($app.enablePrimaryPassword) {
                console.error(
                    'Primary password is enabled, this disables auto login.'
                );
                this.attemptingAutoLogin = false;
                this.logout();
                return;
            }
            var attemptsInLastHour = Array.from(this.autoLoginAttempts).filter(
                (timestamp) => timestamp > new Date().getTime() - 3600000
            ).length;
            if (attemptsInLastHour >= 3) {
                console.error(
                    'More than 3 auto login attempts within the past hour, logging out instead of attempting auto login.'
                );
                this.attemptingAutoLogin = false;
                this.logout();
                return;
            }
            this.autoLoginAttempts.add(new Date().getTime());
            $app.relogin(user)
                .then(() => {
                    if (this.errorNoty) {
                        this.errorNoty.close();
                    }
                    this.errorNoty = new Noty({
                        type: 'success',
                        text: 'Automatically logged in.'
                    }).show();
                    console.log('Automatically logged in.');
                })
                .catch((err) => {
                    if (this.errorNoty) {
                        this.errorNoty.close();
                    }
                    this.errorNoty = new Noty({
                        type: 'error',
                        text: 'Failed to login automatically.'
                    }).show();
                    console.error('Failed to login automatically.', err);
                })
                .finally(() => {
                    if (!navigator.onLine) {
                        this.errorNoty = new Noty({
                            type: 'error',
                            text: `You're offline.`
                        }).show();
                        console.error(`You're offline.`);
                    }
                });
        });

        API.$on('USER:CURRENT', function () {
            this.attemptingAutoLogin = false;
        });

        API.$on('LOGOUT', function () {
            this.attemptingAutoLogin = false;
            this.autoLoginAttempts.clear();
        });

        API.logout = function () {
            this.$emit('LOGOUT');
            // return this.call('logout', {
            //     method: 'PUT'
            // }).finally(() => {
            //     this.$emit('LOGOUT');
            // });
        };
    }

    _data = {
        loginForm: {
            loading: true,
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
        }
    };

    _methods = {
        async relogin(user) {
            var { loginParmas } = user;
            if (user.cookies) {
                await webApiService.setCookies(user.cookies);
            }
            this.loginForm.lastUserLoggedIn = user.user.id; // for resend email 2fa
            if (loginParmas.endpoint) {
                API.endpointDomain = loginParmas.endpoint;
                API.websocketDomain = loginParmas.websocket;
            } else {
                API.endpointDomain = API.endpointDomainVrchat;
                API.websocketDomain = API.websocketDomainVrchat;
            }
            return new Promise((resolve, reject) => {
                if (this.enablePrimaryPassword) {
                    this.checkPrimaryPassword(loginParmas)
                        .then((pwd) => {
                            this.loginForm.loading = true;
                            return API.getConfig()
                                .catch((err) => {
                                    this.loginForm.loading = false;
                                    reject(err);
                                })
                                .then(() => {
                                    API.login({
                                        username: loginParmas.username,
                                        password: pwd,
                                        cipher: loginParmas.password,
                                        endpoint: loginParmas.endpoint,
                                        websocket: loginParmas.websocket
                                    })
                                        .catch((err2) => {
                                            this.loginForm.loading = false;
                                            // API.logout();
                                            reject(err2);
                                        })
                                        .then(() => {
                                            this.loginForm.loading = false;
                                            resolve();
                                        });
                                });
                        })
                        .catch((_) => {
                            this.$message({
                                message: 'Incorrect primary password',
                                type: 'error'
                            });
                            reject(_);
                        });
                } else {
                    API.getConfig()
                        .catch((err) => {
                            this.loginForm.loading = false;
                            reject(err);
                        })
                        .then(() => {
                            API.login({
                                username: loginParmas.username,
                                password: loginParmas.password,
                                endpoint: loginParmas.endpoint,
                                websocket: loginParmas.websocket
                            })
                                .catch((err2) => {
                                    this.loginForm.loading = false;
                                    API.logout();
                                    reject(err2);
                                })
                                .then(() => {
                                    this.loginForm.loading = false;
                                    resolve();
                                });
                        });
                }
            });
        },

        async deleteSavedLogin(userId) {
            var savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
            delete savedCredentials[userId];
            // Disable primary password when no account is available.
            if (Object.keys(savedCredentials).length === 0) {
                this.enablePrimaryPassword = false;
                await configRepository.setBool('enablePrimaryPassword', false);
            }
            this.loginForm.savedCredentials = savedCredentials;
            var jsonCredentials = JSON.stringify(savedCredentials);
            await configRepository.setString(
                'savedCredentials',
                jsonCredentials
            );
            new Noty({
                type: 'success',
                text: 'Account removed.'
            }).show();
        },

        async login() {
            await webApiService.clearCookies();
            this.$refs.loginForm.validate((valid) => {
                if (valid && !this.loginForm.loading) {
                    this.loginForm.loading = true;
                    if (this.loginForm.endpoint) {
                        API.endpointDomain = this.loginForm.endpoint;
                        API.websocketDomain = this.loginForm.websocket;
                    } else {
                        API.endpointDomain = API.endpointDomainVrchat;
                        API.websocketDomain = API.websocketDomainVrchat;
                    }
                    API.getConfig()
                        .catch((err) => {
                            this.loginForm.loading = false;
                            throw err;
                        })
                        .then((args) => {
                            if (
                                this.loginForm.saveCredentials &&
                                this.enablePrimaryPassword
                            ) {
                                $app.$prompt(
                                    $t('prompt.primary_password.description'),
                                    $t('prompt.primary_password.header'),
                                    {
                                        inputType: 'password',
                                        inputPattern: /[\s\S]{1,32}/
                                    }
                                )
                                    .then(({ value }) => {
                                        let saveCredential =
                                            this.loginForm.savedCredentials[
                                                Object.keys(
                                                    this.loginForm
                                                        .savedCredentials
                                                )[0]
                                            ];
                                        security
                                            .decrypt(
                                                saveCredential.loginParmas
                                                    .password,
                                                value
                                            )
                                            .then(() => {
                                                security
                                                    .encrypt(
                                                        this.loginForm.password,
                                                        value
                                                    )
                                                    .then((pwd) => {
                                                        API.login({
                                                            username:
                                                                this.loginForm
                                                                    .username,
                                                            password:
                                                                this.loginForm
                                                                    .password,
                                                            endpoint:
                                                                this.loginForm
                                                                    .endpoint,
                                                            websocket:
                                                                this.loginForm
                                                                    .websocket,
                                                            saveCredentials:
                                                                this.loginForm
                                                                    .saveCredentials,
                                                            cipher: pwd
                                                        }).then(() => {
                                                            this.$refs.loginForm.resetFields();
                                                        });
                                                    });
                                            });
                                    })
                                    .finally(() => {
                                        this.loginForm.loading = false;
                                    });
                                return args;
                            }
                            API.login({
                                username: this.loginForm.username,
                                password: this.loginForm.password,
                                endpoint: this.loginForm.endpoint,
                                websocket: this.loginForm.websocket,
                                saveCredentials: this.loginForm.saveCredentials
                            })
                                .then(() => {
                                    this.$refs.loginForm.resetFields();
                                })
                                .finally(() => {
                                    this.loginForm.loading = false;
                                });
                            return args;
                        });
                }
            });
        },

        logout() {
            this.$confirm('Continue? Logout', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: (action) => {
                    if (action === 'confirm') {
                        API.logout();
                    }
                }
            });
        }
    };
}
