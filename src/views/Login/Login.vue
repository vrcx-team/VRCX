<template>
    <div class="absolute inset-0 flex flex-col items-center overflow-y-auto px-4 pt-12">
        <div class="absolute top-0 left-0 m-1.5">
            <LoginSettingsDialog />
            <TooltipWrapper v-if="!noUpdater" side="top" :content="t('view.login.updater')">
                <Button class="rounded-full mr-2 text-xs" size="icon-sm" variant="ghost" @click="showVRCXUpdateDialog">
                    <span class="relative inline-flex items-center justify-center">
                        <ArrowBigDownDash />
                        <span
                            v-if="pendingVRCXUpdate"
                            class="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    </span>
                </Button>
            </TooltipWrapper>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <TooltipWrapper side="top" :content="t('view.login.language')">
                        <Button class="rounded-full text-xs" size="icon-sm" variant="ghost">
                            <Languages />
                        </Button>
                    </TooltipWrapper>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="max-h-80 overflow-y-auto text-xs">
                    <DropdownMenuCheckboxItem
                        v-for="language in languageCodes"
                        :key="language"
                        :model-value="appLanguage === language"
                        @select="changeAppLanguage(language)">
                        {{ getLanguageName(language) }}
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div class="my-auto flex w-full max-w-sm flex-col" :class="{ 'sm:max-w-3xl': hasSavedCredentials }">
            <Alert
                v-if="vrcStatusStore.hasIssue"
                :variant="vrcStatusStore.isMajor ? 'destructive' : 'warning'"
                class="cursor-pointer mb-3 hover:opacity-80 transition-opacity"
                @click="vrcStatusStore.openStatusPage()">
                <TriangleAlert class="size-4" />
                <AlertTitle class="truncate">{{ t('status_bar.servers_issue') }}</AlertTitle>
                <AlertDescription class="truncate">
                    {{ vrcStatusStore.statusText }}
                </AlertDescription>
            </Alert>
            <div class="flex flex-col gap-2 sm:flex-row">
                <div class="flex min-w-0 flex-col p-4 sm:flex-1">
                    <h2 class="mb-4 text-center text-lg font-semibold">{{ t('view.login.login') }}</h2>
                    <QrLogin v-model:active="qrActive">
                        <form id="login-form" @submit.prevent="onSubmit">
                            <FieldGroup v-show="!qrActive" class="gap-3">
                                <VeeField v-slot="{ field, errors }" name="username">
                                    <Field :data-invalid="!!errors.length">
                                        <FieldLabel for="login-form-username" class="text-foreground">
                                            {{ t('view.login.field.username') }}
                                        </FieldLabel>
                                        <FieldContent>
                                            <InputGroupField
                                                id="login-form-username"
                                                input-class="text-sm"
                                                :model-value="field.value"
                                                autocomplete="off"
                                                name="username"
                                                :placeholder="t('view.login.field.username')"
                                                :aria-invalid="!!errors.length"
                                                @update:modelValue="field.onChange"
                                                @blur="field.onBlur" />
                                            <FieldError v-if="errors.length" :errors="errors" />
                                        </FieldContent>
                                    </Field>
                                </VeeField>
                                <VeeField v-slot="{ field, errors, handleChange }" name="password">
                                    <Field :data-invalid="!!errors.length">
                                        <FieldLabel for="login-form-password" class="text-foreground">
                                            {{ t('view.login.field.password') }}
                                        </FieldLabel>
                                        <FieldContent>
                                            <InputGroupField
                                                id="login-form-password"
                                                input-class="text-sm"
                                                :model-value="field.value"
                                                type="password"
                                                autocomplete="off"
                                                name="password"
                                                :placeholder="t('view.login.field.password')"
                                                :aria-invalid="!!errors.length"
                                                show-password
                                                @keydown.delete="handleChange('', false)"
                                                @update:modelValue="field.onChange"
                                                @blur="field.onBlur" />
                                            <FieldError v-if="errors.length" :errors="errors" />
                                        </FieldContent>
                                    </Field>
                                </VeeField>
                            </FieldGroup>
                            <div class="mt-3 flex items-center justify-between gap-2 text-sm">
                                <label class="flex w-fit items-center gap-2">
                                    <Checkbox v-model="loginForm.saveCredentials" />
                                    <span>{{ t('view.login.field.saveCredentials') }}</span>
                                </label>
                                <ResetPasswordDialog />
                            </div>

                            <Button v-show="!qrActive" type="submit" size="lg" class="mt-4 w-full">{{
                                t('view.login.login')
                            }}</Button>
                        </form>
                    </QrLogin>
                    <Button
                        variant="outline"
                        size="lg"
                        class="mt-2 w-full"
                        @click="openExternalLink('https://vrchat.com/home/register')"
                        >{{ t('view.login.register') }}</Button
                    >
                </div>

                <div v-if="hasSavedCredentials" class="shrink-0 border-t sm:border-t-0 sm:border-l" />

                <div v-if="hasSavedCredentials" class="flex min-w-0 flex-col p-4 sm:flex-1">
                    <h2 class="mb-4 text-center text-lg font-semibold">
                        {{ t('view.login.savedAccounts') }}
                    </h2>
                    <div class="flex flex-col overflow-y-auto sm:h-0 sm:grow">
                        <Item
                            v-for="user in savedCredentials"
                            :key="user.user.id"
                            class="cursor-pointer hover:bg-muted p-2 border-0"
                            @click="clickSavedLogin(user)">
                            <ItemMedia class="relative size-10">
                                <Avatar class="size-full rounded-full">
                                    <AvatarImage :src="userImage(user.user)" />
                                    <AvatarFallback>
                                        <User class="size-5 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <IconFrame :icon-frame="user.user.iconFrame" />
                            </ItemMedia>
                            <ItemContent class="min-w-0">
                                <ItemTitle class="truncate max-w-full">{{ user.user.displayName }}</ItemTitle>
                                <ItemDescription class="truncate text-xs!">
                                    {{ user.user.username }}
                                </ItemDescription>
                                <ItemDescription v-if="user.loginParams.endpoint" class="truncate text-xs!">
                                    {{ user.loginParams.endpoint }}
                                </ItemDescription>
                            </ItemContent>
                            <ItemActions @click.stop>
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    class="cursor-pointer rounded-full"
                                    @click="clickDeleteSavedLogin(user.user.id)"
                                    ><Trash2 class="text-sm"
                                /></Button>
                            </ItemActions>
                        </Item>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex max-w-3xl flex-col gap-1 pt-12 pb-8 text-center text-xs text-muted-foreground">
            <p>
                &copy; 2019-2026
                <a
                    class="cursor-pointer text-foreground hover:underline"
                    @click="openExternalLink('https://github.com/pypy-vrc')"
                    >pypy</a
                >
                &amp;
                <a
                    class="cursor-pointer text-foreground hover:underline"
                    @click="openExternalLink('https://github.com/Natsumi-sama')"
                    >Natsumi</a
                >
                &amp;
                <a
                    class="cursor-pointer text-foreground hover:underline"
                    @click="openExternalLink('https://github.com/Map1en')"
                    >Map1en</a
                >
            </p>
            <p>{{ t('view.settings.general.legal_notice.info') }}</p>
            <p>{{ t('view.settings.general.legal_notice.disclaimer1') }}</p>
            <p>{{ t('view.settings.general.legal_notice.disclaimer2') }}</p>
        </div>
    </div>
</template>

<script setup>
    import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
    import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
    import {
        DropdownMenu,
        DropdownMenuCheckboxItem,
        DropdownMenuContent,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import IconFrame from '@/components/IconFrame.vue';
    import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
    import { ArrowBigDownDash, Languages, Trash2, TriangleAlert, User } from 'lucide-vue-next';
    import { Field as VeeField, useForm } from 'vee-validate';
    import { useRoute, useRouter } from 'vue-router';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toTypedSchema } from '@vee-validate/zod';
    import { useI18n } from 'vue-i18n';
    import { z } from 'zod';

    import {
        useAppearanceSettingsStore,
        useAuthStore,
        useModalStore,
        useVrcStatusStore,
        useVRCXUpdaterStore
    } from '../../stores';
    import { getLanguageName, languageCodes, resolveSystemLanguage } from '../../localization';
    import { tForLocale } from '../../plugins';
    import { openExternalLink } from '../../shared/utils';

    import configRepository from '../../services/config';
    import { useUserDisplay } from '../../composables/useUserDisplay';
    import { watchState } from '../../services/watchState';

    import LoginSettingsDialog from './Dialog/LoginSettingsDialog.vue';
    import ResetPasswordDialog from './Dialog/ResetPasswordDialog.vue';
    import QrLogin from './components/QrLogin.vue';

    const { userImage } = useUserDisplay();
    const { showVRCXUpdateDialog } = useVRCXUpdaterStore();
    const router = useRouter();
    const route = useRoute();
    const { loginForm } = storeToRefs(useAuthStore());
    const { relogin, deleteSavedLogin, login, getAllSavedCredentials } = useAuthStore();
    const { noUpdater, pendingVRCXUpdate } = storeToRefs(useVRCXUpdaterStore());

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { appLanguage } = storeToRefs(appearanceSettingsStore);
    const { changeAppLanguage } = appearanceSettingsStore;
    const modalStore = useModalStore();

    const vrcStatusStore = useVrcStatusStore();

    const { t } = useI18n();

    /** @type {import('vue').Ref<Record<string, any>>} */
    const savedCredentials = ref({});
    const hasSavedCredentials = computed(() => Object.keys(savedCredentials.value).length !== 0);
    const qrActive = ref(false);
    const requiredMessage = 'Required';

    const formSchema = toTypedSchema(
        z.object({
            username: z.string().min(1, requiredMessage),
            password: z.string().min(1, requiredMessage)
        })
    );

    const { handleSubmit, resetForm, values } = useForm({
        validationSchema: formSchema,
        initialValues: {
            username: loginForm.value.username,
            password: loginForm.value.password
        }
    });

    watch(qrActive, (active) => {
        if (active) {
            resetForm({ values: { username: '', password: '' } });
        }
    });

    /**
     * @param userId
     */
    async function clickDeleteSavedLogin(userId) {
        await deleteSavedLogin(userId);
        await updateSavedCredentials();
    }

    /**
     * @param user
     */
    async function clickSavedLogin(user) {
        try {
            await relogin(user);
        } catch {
            // relogin already handles user-facing error display (toast)
        }
        await updateSavedCredentials();
    }

    const onSubmit = handleSubmit(async (formValues) => {
        loginForm.value.username = formValues.username ?? '';
        loginForm.value.password = formValues.password ?? '';
        await login();
        await updateSavedCredentials();
    });

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

    watch(
        () => loginForm.value.loading,
        (loading) => {
            if (!loading) {
                updateSavedCredentials();
            }
        }
    );
    let isActive = true;
    let isLanguagePromptOpen = false;

    async function detectAndPromptLanguage() {
        try {
            const savedLanguage = await configRepository.getString('VRCX_appLanguage');
            if (savedLanguage || !isActive) return;

            const systemLanguage = await AppApi.CurrentLanguage();
            if (!systemLanguage || !isActive) return;

            const matchedCode = resolveSystemLanguage(systemLanguage, languageCodes);

            if (!matchedCode || matchedCode === 'en') {
                if (isActive) await changeAppLanguage('en');
                return;
            }

            const languageName = getLanguageName(matchedCode);
            const [promptTitle, promptDescription, promptConfirmText, promptCancelText] = await Promise.all([
                tForLocale(matchedCode, 'view.login.language_detect.title'),
                tForLocale(matchedCode, 'view.login.language_detect.description', {
                    language: languageName
                }),
                tForLocale(matchedCode, 'dialog.alertdialog.confirm'),
                tForLocale(matchedCode, 'dialog.alertdialog.cancel')
            ]);

            isLanguagePromptOpen = true;
            const { ok } = await modalStore.confirm({
                title: promptTitle,
                description: promptDescription,
                confirmText: promptConfirmText,
                cancelText: promptCancelText
            });
            isLanguagePromptOpen = false;

            if (!isActive) return;

            // Re-check: user may have manually switched language while the dialog was open
            const currentLanguage = await configRepository.getString('VRCX_appLanguage');
            if (currentLanguage || !isActive) return;

            if (ok) {
                await changeAppLanguage(matchedCode);
            } else {
                await changeAppLanguage('en');
            }
        } catch (error) {
            isLanguagePromptOpen = false;
            console.error('Language detection failed:', error);
        }
    }

    onBeforeMount(async () => {
        updateSavedCredentials();
        detectAndPromptLanguage();
    });

    onBeforeUnmount(() => {
        isActive = false;
        if (isLanguagePromptOpen) {
            modalStore.handleCancel();
            isLanguagePromptOpen = false;
        }
        resetForm({
            values: {
                username: '',
                password: ''
            }
        });
        loginForm.value.username = '';
        loginForm.value.password = '';
        loginForm.value.endpoint = '';
        loginForm.value.websocket = '';
        savedCredentials.value = {};
    });

    watch(
        values,
        (formValues) => {
            loginForm.value.username = formValues.username ?? '';
            loginForm.value.password = formValues.password ?? '';
        },
        { deep: true }
    );
</script>
