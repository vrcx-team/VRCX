<template>
    <div style="float: left; margin: 5px; z-index: 3000">
        <TooltipWrapper v-if="!noUpdater" side="top" :content="t('view.login.updater')">
            <Button class="rounded-full mr-2 text-xs" size="icon-sm" variant="ghost" @click="showVRCXUpdateDialog"
                ><CircleArrowDown
            /></Button>
        </TooltipWrapper>
        <TooltipWrapper side="top" :content="t('view.login.proxy_settings')">
            <Button class="rounded-full text-xs" size="icon-sm" variant="ghost" @click="promptProxySettings"
                ><Route
            /></Button>
        </TooltipWrapper>
    </div>
    <div v-loading="loginForm.loading" class="x-login-container">
        <div class="x-login">
            <div class="x-login-form-container">
                <div>
                    <h2 style="font-weight: bold; text-align: center; margin: 0">{{ t('view.login.login') }}</h2>
                    <el-form
                        ref="loginFormRef"
                        :model="loginForm"
                        :rules="loginForm.rules"
                        @submit.prevent="handleLogin()">
                        <el-form-item
                            :label="t('view.login.field.username')"
                            prop="username"
                            required
                            style="display: block">
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
                            style="display: block; margin-top: 10px">
                            <el-input
                                v-model="loginForm.password"
                                type="password"
                                name="password"
                                :placeholder="t('view.login.field.password')"
                                clearable
                                show-password></el-input>
                        </el-form-item>
                        <label class="inline-flex items-center gap-2 mr-2">
                            <Checkbox v-model="loginForm.saveCredentials" />
                            <span>{{ t('view.login.field.saveCredentials') }}</span>
                        </label>
                        <label class="inline-flex items-center gap-2" style="margin-top: 10px">
                            <Checkbox v-model="enableCustomEndpoint" @update:modelValue="toggleCustomEndpoint" />
                            <span>{{ t('view.login.field.devEndpoint') }}</span>
                        </label>
                        <el-form-item
                            v-if="enableCustomEndpoint"
                            :label="t('view.login.field.endpoint')"
                            prop="endpoint"
                            style="margin-top: 10px">
                            <el-input
                                v-model="loginForm.endpoint"
                                name="endpoint"
                                :placeholder="AppDebug.endpointDomainVrchat"
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
                                :placeholder="AppDebug.websocketDomainVrchat"
                                clearable></el-input>
                        </el-form-item>
                        <el-form-item>
                            <Button class="mt-2" type="submit" size="lg" style="width: 100%">{{
                                t('view.login.login')
                            }}</Button>
                        </el-form-item>
                    </el-form>
                    <Button
                        variant="Secondary"
                        size="lg"
                        style="width: 100%"
                        @click="openExternalLink('https://vrchat.com/register')"
                        >{{ t('view.login.register') }}</Button
                    >
                </div>

                <hr v-if="Object.keys(savedCredentials).length !== 0" class="x-vertical-divider" />

                <div v-if="Object.keys(savedCredentials).length !== 0">
                    <h2 style="font-weight: bold; text-align: center; margin: 0">
                        {{ t('view.login.savedAccounts') }}
                    </h2>
                    <div class="x-scroll-wrapper" style="margin-top: 10px">
                        <div class="x-saved-account-list">
                            <div
                                v-for="user in savedCredentials"
                                :key="user.user.id"
                                class="x-friend-item"
                                @click="clickSavedLogin(user)">
                                <div class="avatar">
                                    <img :src="userImage(user.user)" loading="lazy" />
                                </div>
                                <div class="detail">
                                    <span class="name" v-text="user.user.displayName"></span>
                                    <span class="extra" v-text="user.user.username"></span>
                                    <span class="extra" v-text="user.loginParams.endpoint"></span>
                                </div>
                                <Button
                                    class="rounded-full"
                                    size="icon-sm"
                                    variant="ghost"
                                    style="margin-left: 10px"
                                    @click.stop="clickDeleteSavedLogin(user.user.id)"
                                    ><i class="ri-delete-bin-line h-3 w-3"></i
                                ></Button>
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
                        &copy; 2019-2026
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
    import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
    import { CircleArrowDown, Route } from 'lucide-vue-next';
    import { useRoute, useRouter } from 'vue-router';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAuthStore, useGeneralSettingsStore, useVRCXUpdaterStore } from '../../stores';
    import { openExternalLink, userImage } from '../../shared/utils';
    import { AppDebug } from '../../service/appConfig';
    import { watchState } from '../../service/watchState';

    const { showVRCXUpdateDialog } = useVRCXUpdaterStore();
    const router = useRouter();
    const route = useRoute();
    const { loginForm, enableCustomEndpoint } = storeToRefs(useAuthStore());
    const { toggleCustomEndpoint, relogin, deleteSavedLogin, login, getAllSavedCredentials } = useAuthStore();
    const { promptProxySettings } = useGeneralSettingsStore();
    const { noUpdater } = storeToRefs(useVRCXUpdaterStore());

    const { t } = useI18n();

    const loginFormRef = ref(null);
    const savedCredentials = ref({});

    async function clickDeleteSavedLogin(userId) {
        await deleteSavedLogin(userId);
        await updateSavedCredentials();
    }

    async function clickSavedLogin(user) {
        await relogin(user);
        await updateSavedCredentials();
    }

    function handleLogin() {
        if (loginFormRef.value) {
            loginFormRef.value.validate(async (valid) => {
                if (valid) {
                    await login();
                    await updateSavedCredentials();
                }
            });
        }
    }

    async function updateSavedCredentials() {
        if (watchState.isLoggedIn) {
            return;
        }
        savedCredentials.value = await getAllSavedCredentials();
    }

    function postLoginRedirect() {
        const redirect = route.query.redirect;
        if (typeof redirect === 'string' && redirect.startsWith('/') && redirect !== '/login') {
            return redirect;
        }
        return '/feed';
    }

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (isLoggedIn) {
                router.replace(postLoginRedirect());
            }
        }
    );

    onBeforeMount(async () => {
        updateSavedCredentials();
    });

    onBeforeUnmount(() => {
        if (loginFormRef.value) {
            loginFormRef.value.resetFields();
        }
        savedCredentials.value = {};
    });
</script>
