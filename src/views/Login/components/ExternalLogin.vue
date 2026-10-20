<template>
    <div :class="showAuthorization ? 'external-login-pending' : 'mt-4 border-t pt-4 space-y-3'">
        <template v-if="!showAuthorization">
            <p class="text-center text-xs text-muted-foreground">{{ t('view.login.external.title') }}</p>
            <p v-if="enableCustomEndpoint" class="text-xs">{{ t('view.login.external.official_only') }}</p>
            <div class="mx-auto grid w-full grid-cols-6 gap-1.5">
                <Button
                    v-for="provider in externalLoginProviders"
                    :key="provider.id"
                    variant="outline"
                    size="icon"
                    class="aspect-square h-auto w-full rounded-xl p-0 text-foreground"
                    :aria-label="providerLabel(provider)"
                    :title="providerLabel(provider)"
                    :disabled="loginForm.loading || enableCustomEndpoint"
                    :data-provider="provider.id"
                    @click="start(provider.id)">
                    <ProviderLogo :provider="provider.id" />
                </Button>
            </div>
            <p v-if="enablePrimaryPassword && loginForm.saveCredentials" class="text-xs text-muted-foreground">
                {{ t('view.login.external.primary_password_hint') }}
            </p>
        </template>
        <div
            v-if="!['idle', 'completed', 'cancelled'].includes(state.status)"
            role="status"
            aria-live="polite"
            :class="['space-y-3', { 'w-full text-center': showAuthorization }]">
            <div
                v-if="showAuthorization && !(qrImage && state.provider === 'device')"
                class="auth-emblem"
                data-testid="auth-emblem">
                <svg
                    class="auth-orbit"
                    :class="{ 'auth-orbit-moving': isSpinning }"
                    viewBox="0 0 112 112"
                    aria-hidden="true">
                    <circle cx="56" cy="56" r="52" class="auth-orbit-track" />
                    <circle v-if="isSpinning" cx="56" cy="56" r="52" class="auth-orbit-head" />
                </svg>
                <ProviderLogo :provider="state.provider" :size="44" />
            </div>
            <p class="text-sm">{{ t(`view.login.external.status.${state.status}`) }}</p>
            <p v-if="state.error" class="text-xs text-destructive">
                {{ t(`view.login.external.errors.${state.error}`) }}
            </p>
            <p v-if="state.status === 'failed' && state.stage" class="text-xs text-muted-foreground">
                {{ t('view.login.external.stage_prefix') }} {{ t(`view.login.external.stages.${state.stage}`) }}
                <span v-if="state.httpStatus"> · HTTP {{ state.httpStatus }}</span>
            </p>
            <p
                v-if="state.status === 'failed' && state.responseFields.length"
                class="text-xs text-muted-foreground break-words">
                {{ t('view.login.external.response_fields') }} {{ state.responseFields.join(', ') }}
            </p>
            <template v-if="qrImage && state.provider === 'device' && state.status === 'waiting'">
                <img :src="qrImage" :alt="t('view.login.external.qr_alt')" width="184" height="184" class="mx-auto" />
                <p class="text-xs text-center">{{ t('view.login.external.qr_hint') }}</p>
            </template>
            <Button
                v-if="canCancel"
                size="sm"
                variant="outline"
                data-testid="cancel-external-login"
                @click="controller.cancel">
                {{ t('view.login.external.cancel') }}
            </Button>
        </div>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import QRCode from 'qrcode';
    import { Button } from '@/components/ui/button';
    import ProviderLogo from './ProviderLogo.vue';
    import { useAuthStore } from '../../../stores/auth';
    import { useAdvancedSettingsStore } from '../../../stores/settings/advanced';
    import {
        createExternalAuthController,
        externalLoginProviders
    } from '../../../coordinators/externalAuthCoordinator';
    import webApiService from '../../../services/webapi';
    import * as workerTimers from 'worker-timers';

    const { t } = useI18n();
    const emit = defineEmits(['active-change']);
    const authStore = useAuthStore();
    const { loginForm, enableCustomEndpoint } = storeToRefs(authStore);
    const { enablePrimaryPassword } = storeToRefs(useAdvancedSettingsStore());
    const qrImage = ref('');
    const controller = createExternalAuthController({
        api: webApiService,
        prepare: () => authStore.prepareExternalLogin(),
        complete: (user, provider, save) => authStore.completeExternalLogin(user, provider, save),
        busy: (value) => {
            loginForm.value.loading = value;
        }
    });
    const { state } = controller;
    const showAuthorization = computed(() =>
        ['starting', 'waiting', 'validating', 'ready', 'committing', 'cancelling'].includes(state.status)
    );
    const isSpinning = computed(() => showAuthorization.value && state.status !== 'ready');
    const canCancel = computed(() => ['starting', 'waiting', 'validating', 'ready'].includes(state.status));
    let active = true;
    let polling = false;

    function providerLabel(provider) {
        return provider.id === 'device'
            ? t('view.login.external.qr_button')
            : t('view.login.external.provider_label', { provider: provider.label });
    }

    async function start(provider) {
        if (!active || loginForm.value.loading || enableCustomEndpoint.value) return;
        await controller.start(provider, loginForm.value.saveCredentials);
    }

    watch(showAuthorization, (value) => emit('active-change', value), { immediate: true, flush: 'sync' });

    const timer = workerTimers.setInterval(async () => {
        if (polling) return;
        polling = true;
        try {
            await controller.refresh();
        } finally {
            polling = false;
        }
    }, 1000);

    watch(
        () => state.verificationUrl,
        async (url) => {
            qrImage.value = '';
            if (!url) return;
            try {
                const image = await QRCode.toDataURL(url, { width: 184, margin: 2, errorCorrectionLevel: 'M' });
                if (active && state.verificationUrl === url) qrImage.value = image;
            } catch {
                state.error = 'unavailable';
            }
        }
    );
    watch(enableCustomEndpoint, (enabled) => {
        if (enabled && canCancel.value) void controller.cancel();
    });
    onBeforeUnmount(() => {
        active = false;
        workerTimers.clearInterval(timer);
        if (canCancel.value) void controller.cancel();
    });
</script>

<style scoped>
    .external-login-pending {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        padding: 24px 0;
    }
    .auth-emblem {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 112px;
        height: 112px;
        margin: 0 auto 28px;
        color: var(--foreground);
    }
    .auth-orbit {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        fill: none;
        stroke-width: 3;
    }
    .auth-orbit-track {
        stroke: var(--border);
    }
    .auth-orbit-head {
        stroke: var(--foreground);
        stroke-linecap: round;
        stroke-dasharray: 82 327;
    }
    .auth-orbit-moving {
        animation: auth-orbit-spin 1.1s linear infinite;
    }
    @keyframes auth-orbit-spin {
        to {
            transform: rotate(360deg);
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .auth-orbit-moving {
            animation: none;
        }
    }
</style>
