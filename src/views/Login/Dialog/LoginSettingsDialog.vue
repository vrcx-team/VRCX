<template>
    <Dialog v-model:open="open">
        <DialogTrigger as-child>
            <TooltipWrapper side="top" :content="t('view.login.settings')">
                <Button class="rounded-full mr-2 text-xs" size="icon-sm" variant="ghost"><Settings /></Button>
            </TooltipWrapper>
        </DialogTrigger>
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>{{ t('view.login.settings') }}</DialogTitle>
            </DialogHeader>
            <FieldGroup class="gap-3">
                <Field>
                    <FieldLabel for="login-settings-proxy">{{ t('view.login.proxy_settings') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupField
                            id="login-settings-proxy"
                            v-model="proxyServerLocal"
                            autocomplete="off"
                            name="proxy"
                            :placeholder="t('prompt.proxy_settings.description')"
                            clearable />
                    </FieldContent>
                </Field>
                <label class="inline-flex items-center gap-2 text-sm">
                    <Checkbox v-model="enableCustomEndpoint" @update:modelValue="handleCustomEndpointToggle" />
                    <span>{{ t('view.login.field.devEndpoint') }}</span>
                </label>
                <template v-if="enableCustomEndpoint">
                    <Field>
                        <FieldLabel for="login-settings-endpoint">{{ t('view.login.field.endpoint') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                id="login-settings-endpoint"
                                v-model="loginForm.endpoint"
                                autocomplete="off"
                                name="endpoint"
                                :placeholder="AppDebug.endpointDomainVrchat"
                                clearable />
                        </FieldContent>
                    </Field>
                    <Field>
                        <FieldLabel for="login-settings-websocket">{{ t('view.login.field.websocket') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                id="login-settings-websocket"
                                v-model="loginForm.websocket"
                                autocomplete="off"
                                name="websocket"
                                :placeholder="AppDebug.websocketDomainVrchat"
                                clearable />
                        </FieldContent>
                    </Field>
                </template>
            </FieldGroup>
            <DialogFooter>
                <Button variant="outline" @click="saveAndRestart">{{ t('prompt.proxy_settings.restart') }}</Button>
                <Button @click="saveAndClose">{{ t('prompt.proxy_settings.close') }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import {
        Dialog,
        DialogContent,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger
    } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupField } from '@/components/ui/input-group';
    import { Settings } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAuthStore, useVRCXUpdaterStore, useVrcxStore } from '../../../stores';
    import { AppDebug } from '../../../service/appConfig';

    const { loginForm, enableCustomEndpoint } = storeToRefs(useAuthStore());
    const { toggleCustomEndpoint } = useAuthStore();
    const vrcxStore = useVrcxStore();

    const { t } = useI18n();

    const open = ref(false);
    const proxyServerLocal = ref('');

    watch(open, (isOpen) => {
        if (isOpen) {
            proxyServerLocal.value = vrcxStore.proxyServer || '';
        }
    });

    async function handleCustomEndpointToggle() {
        await toggleCustomEndpoint();
    }

    async function saveProxy() {
        vrcxStore.proxyServer = proxyServerLocal.value;
        await VRCXStorage.Set('VRCX_ProxyServer', vrcxStore.proxyServer);
        await VRCXStorage.Save();
    }

    async function saveAndRestart() {
        await saveProxy();
        open.value = false;
        const { restartVRCX } = useVRCXUpdaterStore();
        restartVRCX(false);
    }

    async function saveAndClose() {
        await saveProxy();
        open.value = false;
    }
</script>
