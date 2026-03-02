<script setup>
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { useModalStore } from '@/stores';

    const modalStore = useModalStore();

    const { otpOpen, otpTitle, otpDescription, otpOkText, otpCancelText, otpDismissible, otpMode } =
        storeToRefs(modalStore);

    const otpValue = ref('');

    function onComplete(value) {
        modalStore.handleOtpOk(value);
    }

    function onSubmit() {
        if (!otpValue.value) return;
        modalStore.handleOtpOk(otpValue.value);
    }

    function onEscapeKeyDown(event) {
        if (!otpDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handleOtpDismiss(otpValue.value);
    }

    function onPointerDownOutside(event) {
        if (!otpDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handleOtpDismiss(otpValue.value);
    }

    function onInteractOutside(event) {
        if (!otpDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handleOtpDismiss(otpValue.value);
    }

    function handleCancel() {
        modalStore.handleOtpCancel(otpValue.value);
    }

    function stripNonAlphanumeric(value) {
        return value.replace(/[^a-z0-9]/gi, '');
    }

    watch(otpOpen, (open) => {
        if (open) {
            otpValue.value = '';
        }
    });
</script>

<template>
    <Dialog :open="otpOpen" @update:open="modalStore.setOtpOpen">
        <DialogContent
            :show-close-button="false"
            @escapeKeyDown="onEscapeKeyDown"
            @pointerDownOutside="onPointerDownOutside"
            @interactOutside="onInteractOutside">
            <form @submit.prevent="onSubmit">
                <DialogHeader class="mb-5">
                    <DialogTitle>{{ otpTitle }}</DialogTitle>
                    <DialogDescription>{{ otpDescription }}</DialogDescription>
                </DialogHeader>

                <div class="flex justify-center">
                    <!-- TOTP / EmailOTP: 6 numeric digits -->
                    <InputOTP
                        v-if="otpMode === 'totp' || otpMode === 'emailOtp'"
                        v-model="otpValue"
                        :maxlength="6"
                        autofocus
                        inputmode="numeric"
                        @complete="onComplete">
                        <InputOTPGroup>
                            <InputOTPSlot v-for="i in 6" :key="i - 1" :index="i - 1" />
                        </InputOTPGroup>
                    </InputOTP>

                    <!-- OTP (recovery code): 4+4 alphanumeric with separator -->
                    <InputOTP
                        v-if="otpMode === 'otp'"
                        v-model="otpValue"
                        :maxlength="8"
                        autofocus
                        inputmode="text"
                        :paste-transformer="stripNonAlphanumeric"
                        @complete="onComplete">
                        <InputOTPGroup>
                            <InputOTPSlot v-for="i in 4" :key="i - 1" :index="i - 1" />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                            <InputOTPSlot v-for="i in 4" :key="i + 3" :index="i + 3" />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <DialogFooter class="mt-5">
                    <Button type="button" variant="outline" @click="handleCancel">
                        {{ otpCancelText }}
                    </Button>
                    <Button type="submit">
                        {{ otpOkText }}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>
