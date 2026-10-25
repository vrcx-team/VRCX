<template>
    <div v-if="qrImage" class="flex flex-col items-center gap-2 text-center">
        <img :src="qrImage" width="184" height="184" />
        <p class="text-xs text-muted-foreground">{{ t('view.login.qr.hint') }}</p>
    </div>
    <slot />
    <Button v-if="!qrImage" variant="secondary" size="lg" class="mt-2 w-full" @click="start">
        <QrCode />
        {{ t('view.login.qr.button') }}
    </Button>
    <Button v-else size="lg" variant="outline" class="mt-4 w-full" @click="stop">{{
        t('view.login.qr.cancel')
    }}</Button>
</template>

<script setup>
    import { onBeforeUnmount, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { QrCode } from 'lucide-vue-next';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import QRCode from 'qrcode';

    import { AppDebug } from '../../../services/appConfig';
    import { authRequest } from '../../../api';
    import { getCurrentUser } from '../../../coordinators/userCoordinator';
    import { useAuthStore } from '../../../stores';

    import webApiService from '../../../services/webapi';
    import * as workerTimers from 'worker-timers';

    const { t } = useI18n();
    const authStore = useAuthStore();
    const active = defineModel('active', { type: Boolean, default: false });
    const qrImage = ref('');
    let session = 0;

    watch(qrImage, (image) => {
        active.value = !!image;
    });

    async function start() {
        const current = ++session;
        try {
            await webApiService.clearCookies();
            AppDebug.endpointDomain = AppDebug.endpointDomainVrchat;
            AppDebug.websocketDomain = AppDebug.websocketDomainVrchat;
            await authRequest.getConfig();

            const { json: device } = await authRequest.getDeviceCode();
            qrImage.value = await QRCode.toDataURL(device.verificationUrlComplete, { width: 184 });

            while (current === session) {
                await new Promise((resolve) => workerTimers.setTimeout(resolve, (device.interval || 5) * 1000));
                if (current !== session) return;
                try {
                    const { json } = await authRequest.getDeviceStatus({ deviceCode: device.deviceCode });
                    if (json?.user) {
                        stop();
                        authStore.queueSaveCredentials();
                        await getCurrentUser();
                        return;
                    }
                } catch (err) {
                    if (!/authorization_pending|slow_down/.test(err.message)) throw err;
                }
            }
        } catch {
            if (current !== session) return;
            stop();
            toast.error(t('view.login.qr.failed'));
        }
    }

    function stop() {
        session++;
        qrImage.value = '';
    }

    onBeforeUnmount(stop);
</script>
