<template>
    <div v-loading="loginForm.loading" class="x-login-container">
        <div class="x-login">
            <div style="position: fixed; top: 0; left: 0; margin: 5px">
                <el-tooltip placement="top" :content="t('view.login.updater')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-download"
                        circle
                        @click="showVRCXUpdateDialog"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.login.proxy_settings')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-connection"
                        style="margin-left: 5px"
                        circle
                        @click="promptProxySettings"></el-button>
                </el-tooltip>
            </div>

            <div class="x-login-form-container">
                <div>
                    <h2 style="font-weight: bold; text-align: center; margin: 0">{{ t('view.login.login') }}</h2>
                    <el-form
                        ref="loginFormRef"
                        :model="loginForm"
                        :rules="loginForm.rules"
                        @submit.native.prevent="handleLogin()">
                        <el-form-item :label="t('view.login.field.username')" prop="username" required>
                            <el-input
                                v-model="loginForm.username"
                                name="username"
                                :placeholder="t('view.login.field.username')"
                                clearable></el-input>
                        </el-form-item>
                        <el-form-item
                            :label="t('view.login.field.password')"
                            prop="password"
                            required
                            style="margin-top: 10px">
                            <el-input
                                v-model="loginForm.password"
                                type="password"
                                name="password"
                                :placeholder="t('view.login.field.password')"
                                clearable
                                show-password></el-input>
                        </el-form-item>
                        <el-checkbox v-model="loginForm.saveCredentials" style="margin-top: 15px">{{
                            t('view.login.field.saveCredentials')
                        }}</el-checkbox>
                        <el-checkbox
                            v-model="enableCustomEndpoint"
                            style="margin-top: 10px"
                            @change="toggleCustomEndpoint"
                            >{{ t('view.login.field.devEndpoint') }}</el-checkbox
                        >
                        <el-form-item
                            v-if="enableCustomEndpoint"
                            :label="t('view.login.field.endpoint')"
                            prop="endpoint"
                            style="margin-top: 10px">
                            <el-input
                                v-model="loginForm.endpoint"
                                name="endpoint"
                                :placeholder="AppGlobal.endpointDomainVrchat"
                                clearable></el-input>
                        </el-form-item>
                        <el-form-item
                            v-if="enableCustomEndpoint"
                            :label="t('view.login.field.websocket')"
                            prop="websocket"
                            style="margin-top: 10px">
                            <el-input
                                v-model="loginForm.websocket"
                                name="websocket"
                                :placeholder="AppGlobal.websocketDomainVrchat"
                                clearable></el-input>
                        </el-form-item>
                        <el-form-item style="margin-top: 15px">
                            <el-button native-type="submit" type="primary" style="width: 100%">{{
                                t('view.login.login')
                            }}</el-button>
                        </el-form-item>
                    </el-form>
                    <el-button
                        type="primary"
                        style="width: 100%"
                        @click="openExternalLink('https://vrchat.com/register')"
                        >{{ t('view.login.register') }}</el-button
                    >
                </div>

                <hr v-if="Object.keys(loginForm.savedCredentials).length !== 0" class="x-vertical-divider" />

                <div v-if="Object.keys(loginForm.savedCredentials).length !== 0">
                    <h2 style="font-weight: bold; text-align: center; margin: 0">
                        {{ t('view.login.savedAccounts') }}
                    </h2>
                    <div class="x-scroll-wrapper" style="margin-top: 10px">
                        <div class="x-saved-account-list">
                            <div
                                v-for="user in loginForm.savedCredentials"
                                :key="user.user.id"
                                class="x-friend-item"
                                @click="relogin(user)">
                                <div class="avatar">
                                    <img v-lazy="userImage(user.user)" />
                                </div>
                                <div class="detail">
                                    <span class="name" v-text="user.user.displayName"></span>
                                    <span class="extra" v-text="user.user.username"></span>
                                    <span class="extra" v-text="user.loginParmas.endpoint"></span>
                                </div>
                                <el-button
                                    type="default"
                                    size="mini"
                                    icon="el-icon-delete"
                                    style="margin-left: 10px"
                                    circle
                                    @click.stop="deleteSavedLogin(user.user.id)"></el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="x-legal-notice-container">
                <div style="text-align: center; font-size: 12px">
                    <p>
                        <a class="x-link" @click="openExternalLink('https://vrchat.com/home/password')">{{
                            t('view.login.forgotPassword')
                        }}</a>
                    </p>
                    <p>
                        &copy; 2019-2025
                        <a class="x-link" @click="openExternalLink('https://github.com/pypy-vrc')">pypy</a> &amp;
                        <a class="x-link" @click="openExternalLink('https://github.com/Natsumi-sama')">Natsumi</a>
                    </p>
                    <p>{{ t('view.settings.general.legal_notice.info') }}</p>
                    <p>{{ t('view.settings.general.legal_notice.disclaimer1') }}</p>
                    <p>{{ t('view.settings.general.legal_notice.disclaimer2') }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { onBeforeUnmount, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import {
        useAppearanceSettingsStore,
        useAuthStore,
        useGeneralSettingsStore,
        useVRCXUpdaterStore
    } from '../../stores';
    import { openExternalLink, userImage } from '../../shared/utils';
    import { AppGlobal } from '../../service/appConfig';

    const { showVRCXUpdateDialog } = useVRCXUpdaterStore();
    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { loginForm, enableCustomEndpoint } = storeToRefs(useAuthStore());
    const { toggleCustomEndpoint, relogin, deleteSavedLogin, login } = useAuthStore();
    const { promptProxySettings } = useGeneralSettingsStore();

    const { t } = useI18n();

    const loginFormRef = ref(null);

    function handleLogin() {
        if (loginFormRef.value) {
            loginFormRef.value.validate((valid) => {
                valid && login();
            });
        }
    }

    onBeforeUnmount(() => {
        if (loginFormRef.value) {
            loginFormRef.value.resetFields();
        }
    });
</script>
