<script setup>
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { storeToRefs } from 'pinia';
    import { useForm } from 'vee-validate';
    import { useModalStore } from '@/stores';
    import { watch } from 'vue';

    const modalStore = useModalStore();

    const {
        promptOpen,
        promptTitle,
        promptDescription,
        promptOkText,
        promptCancelText,
        promptDismissible,
        promptInputValue,
        promptPattern,
        promptErrorMessage
    } = storeToRefs(modalStore);

    const { handleSubmit, resetForm, values } = useForm({
        initialValues: {
            value: ''
        }
    });

    const validateValue = (value) => {
        const pattern = promptPattern.value;
        if (!pattern) return true;
        let regex = pattern;
        if (typeof regex === 'string') {
            try {
                regex = new RegExp(regex);
            } catch {
                return promptErrorMessage.value;
            }
        }
        if (!(regex instanceof RegExp)) {
            return true;
        }
        return regex.test(value ?? '') || promptErrorMessage.value;
    };

    const onSubmit = handleSubmit((formValues) => {
        modalStore.handlePromptOk(formValues.value ?? '');
    });

    function onEscapeKeyDown(event) {
        if (!promptDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handlePromptDismiss(values.value ?? '');
    }

    function onPointerDownOutside(event) {
        if (!promptDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handlePromptDismiss(values.value ?? '');
    }

    function onInteractOutside(event) {
        if (!promptDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handlePromptDismiss(values.value ?? '');
    }

    function handleCancel() {
        modalStore.handlePromptCancel(values.value ?? '');
    }

    watch(
        [promptOpen, promptInputValue],
        ([open, inputValue]) => {
            if (open) {
                resetForm({
                    values: {
                        value: inputValue ?? ''
                    }
                });
                return;
            }

            resetForm({
                values: {
                    value: ''
                }
            });
        },
        { immediate: true }
    );
</script>

<template>
    <Dialog :open="promptOpen" @update:open="modalStore.setPromptOpen">
        <DialogContent
            :show-close-button="false"
            @escapeKeyDown="onEscapeKeyDown"
            @pointerDownOutside="onPointerDownOutside"
            @interactOutside="onInteractOutside">
            <form @submit="onSubmit">
                <DialogHeader class="mb-5">
                    <DialogTitle>{{ promptTitle }}</DialogTitle>
                    <DialogDescription>{{ promptDescription }}</DialogDescription>
                </DialogHeader>

                <FormField
                    name="value"
                    :rules="validateValue"
                    :validate-on-blur="false"
                    :validate-on-change="false"
                    :validate-on-input="false"
                    :validate-on-model-update="false"
                    v-slot="{ componentField }">
                    <FormItem>
                        <FormLabel class="sr-only">Input</FormLabel>
                        <FormControl>
                            <Input v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <DialogFooter class="mt-5">
                    <Button type="button" variant="outline" @click="handleCancel">
                        {{ promptCancelText }}
                    </Button>
                    <Button type="submit">
                        {{ promptOkText }}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>
