<template>
    <Dialog v-model:open="enablePrimaryPasswordDialog.visible">
        <DialogContent @interact-outside.prevent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.primary_password.header') }}</DialogTitle>
            </DialogHeader>
            <InputGroupField
                v-model="enablePrimaryPasswordDialog.password"
                :placeholder="t('dialog.primary_password.password_placeholder')"
                type="password"
                size="sm"
                :maxlength="32"
                autofocus />
            <InputGroupField
                v-model="enablePrimaryPasswordDialog.rePassword"
                :placeholder="t('dialog.primary_password.re_input_placeholder')"
                type="password"
                style="margin-top: 5px"
                size="sm"
                :maxlength="32" />
            <DialogFooter>
                <Button
                    :disabled="
                        enablePrimaryPasswordDialog.password.length === 0 ||
                        enablePrimaryPasswordDialog.password !== enablePrimaryPasswordDialog.rePassword
                    "
                    @click="handleSetPrimaryPassword()">
                    {{ t('dialog.primary_password.ok') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAuthStore } from '../../../stores';

    const { t } = useI18n();

    const authStore = useAuthStore();
    const { enablePrimaryPasswordDialog } = storeToRefs(authStore);
    const { setPrimaryPassword } = authStore;

    function handleSetPrimaryPassword() {
        setPrimaryPassword(enablePrimaryPasswordDialog.value.password);
        enablePrimaryPasswordDialog.value.visible = false;
    }
</script>
