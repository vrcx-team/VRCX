<template>
    <Dialog v-model:open="open">
        <DialogTrigger as-child>
            <a class="cursor-pointer text-muted-foreground hover:text-foreground hover:underline">{{
                t('view.login.forgotPassword')
            }}</a>
        </DialogTrigger>
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>{{ t('view.login.reset_password.title') }}</DialogTitle>
                <DialogDescription>{{ t('view.login.reset_password.description') }}</DialogDescription>
            </DialogHeader>
            <form id="reset-password-form" @submit.prevent="submit">
                <Field>
                    <FieldLabel for="reset-password-email">{{ t('view.login.reset_password.email') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupField
                            id="reset-password-email"
                            v-model="email"
                            type="email"
                            autocomplete="email"
                            name="email"
                            :placeholder="t('view.login.reset_password.email')" />
                    </FieldContent>
                </Field>
            </form>
            <DialogFooter>
                <Button variant="outline" @click="open = false">{{ t('dialog.alertdialog.cancel') }}</Button>
                <Button type="submit" form="reset-password-form" :disabled="!email.trim() || loading">
                    {{ t('view.login.reset_password.send') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger
    } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { AppDebug } from '../../../services/appConfig';
    import { authRequest } from '../../../api';
    import { useAuthStore } from '../../../stores';

    const { t } = useI18n();
    const { loginForm } = storeToRefs(useAuthStore());

    const open = ref(false);
    const email = ref('');
    const loading = ref(false);

    watch(open, (isOpen) => {
        if (isOpen) {
            email.value = loginForm.value.username.includes('@') ? loginForm.value.username : '';
        }
    });

    async function submit() {
        if (!email.value.trim() || loading.value) return;
        loading.value = true;
        try {
            AppDebug.endpointDomain = loginForm.value.endpoint || AppDebug.endpointDomainVrchat;
            await authRequest.resetPassword({ email: email.value.trim() });
            open.value = false;
        } catch {
            // request already shows an error toast
        } finally {
            loading.value = false;
        }
    }
</script>
