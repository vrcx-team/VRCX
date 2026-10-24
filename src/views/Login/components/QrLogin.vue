<template>
    <Button v-if="!qrImage" variant="secondary" size="lg" class="mt-2 w-full" @click="start">
        <QrCode />
        {{ t('view.login.qr.button') }}
    </Button>
    <div v-else class="mt-2 flex flex-col items-center gap-2 text-center">
        <img :src="qrImage" width="184" height="184" />
        <p class="text-xs text-muted-foreground">{{ t('view.login.qr.hint') }}</p>
        <Button size="sm" variant="outline" @click="stop">{{ t('view.login.qr.cancel') }}</Button>
    </div>
</template>

<script setup>
    import { onBeforeUnmount, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { QrCode } from 'lucide-vue-next';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import QRCode from 'qrcode';

    import { AppDebug } from '../../../services/appConfig';
    import { authRequest } from '../../../api';
    import { getCurrentUser } from '../../../coordinators/userCoordinator';

    import webApiService from '../../../services/webapi';
    import * as workerTimers from 'worker-timers';

    const { t } = useI18n();
    const qrImage = ref('');
    let session = 0;

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
