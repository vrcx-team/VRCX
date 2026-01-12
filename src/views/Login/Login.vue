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
                    <form id="login-form" @submit.prevent="onSubmit">
                        <FieldGroup class="gap-3">
                            <VeeField v-slot="{ field, errors }" name="username">
                                <Field :data-invalid="!!errors.length">
                                    <FieldLabel for="login-form-username">
                                        {{ t('view.login.field.username') }}
                                    </FieldLabel>
                                    <FieldContent>
                                        <InputGroupField
                                            id="login-form-username"
                                            :model-value="field.value"
                                            name="username"
                                            :placeholder="t('view.login.field.username')"
                                            :aria-invalid="!!errors.length"
                                            clearable
                                            @update:modelValue="field.onChange"
                                            @blur="field.onBlur" />
                                        <FieldError v-if="errors.length" :errors="errors" />
                                    </FieldContent>
                                </Field>
                            </VeeField>
                            <VeeField v-slot="{ field, errors }" name="password">
                                <Field :data-invalid="!!errors.length">
                                    <FieldLabel for="login-form-password">
                                        {{ t('view.login.field.password') }}
                                    </FieldLabel>
                                    <FieldContent>
                                        <InputGroupField
                                            id="login-form-password"
                                            :model-value="field.value"
                                            type="password"
                                            name="password"
                                            :placeholder="t('view.login.field.password')"
                                            :aria-invalid="!!errors.length"
                                            clearable
                                            show-password
                                            @update:modelValue="field.onChange"
                                            @blur="field.onBlur" />
                                        <FieldError v-if="errors.length" :errors="errors" />
                                    </FieldContent>
                                </Field>
                            </VeeField>
                        </FieldGroup>
                        <label class="inline-flex items-center gap-2 mr-2">
                            <Checkbox v-model="loginForm.saveCredentials" />
                            <span>{{ t('view.login.field.saveCredentials') }}</span>
                        </label>
                        <label class="inline-flex items-center gap-2" style="margin-top: 10px">
                            <Checkbox v-model="enableCustomEndpoint" @update:modelValue="handleCustomEndpointToggle" />
                            <span>{{ t('view.login.field.devEndpoint') }}</span>
                        </label>
                        <FieldGroup v-if="enableCustomEndpoint" class="mt-3 gap-3">
                            <VeeField v-slot="{ field, errors }" name="endpoint">
                                <Field :data-invalid="!!errors.length">
                                    <FieldLabel for="login-form-endpoint">
                                        {{ t('view.login.field.endpoint') }}
                                    </FieldLabel>
                                    <FieldContent>
                                        <InputGroupField
                                            id="login-form-endpoint"
                                            :model-value="field.value"
                                            name="endpoint"
                                            :placeholder="AppDebug.endpointDomainVrchat"
                                            :aria-invalid="!!errors.length"
                                            clearable
                                            @update:modelValue="field.onChange"
                                            @blur="field.onBlur" />
                                        <FieldError v-if="errors.length" :errors="errors" />
                                    </FieldContent>
                                </Field>
                            </VeeField>
                            <VeeField v-slot="{ field, errors }" name="websocket">
                                <Field :data-invalid="!!errors.length">
                                    <FieldLabel for="login-form-websocket">
                                        {{ t('view.login.field.websocket') }}
                                    </FieldLabel>
                                    <FieldContent>
                                        <InputGroupField
                                            id="login-form-websocket"
                                            :model-value="field.value"
                                            name="websocket"
                                            :placeholder="AppDebug.websocketDomainVrchat"
                                            :aria-invalid="!!errors.length"
                                            clearable
                                            @update:modelValue="field.onChange"
                                            @blur="field.onBlur" />
                                        <FieldError v-if="errors.length" :errors="errors" />
                                    </FieldContent>
                                </Field>
                            </VeeField>
                        </FieldGroup>
                        <Field class="mt-2">
                            <Button type="submit" size="lg" style="width: 100%">{{ t('view.login.login') }}</Button>
                        </Field>
                    </form>
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
    import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
    import { CircleArrowDown, Route } from 'lucide-vue-next';
    import { Field as VeeField, useForm } from 'vee-validate';
    import { useRoute, useRouter } from 'vue-router';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toTypedSchema } from '@vee-validate/zod';
    import { useI18n } from 'vue-i18n';
    import { z } from 'zod';

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

    const savedCredentials = ref({});
    const requiredMessage = 'Required';

    const formSchema = toTypedSchema(
        z.object({
            username: z.string().min(1, requiredMessage),
            password: z.string().min(1, requiredMessage),
            endpoint: z.string().optional(),
            websocket: z.string().optional()
        })
    );

    const { handleSubmit, resetForm, setValues, values } = useForm({
        validationSchema: formSchema,
        initialValues: {
            username: loginForm.value.username,
            password: loginForm.value.password,
            endpoint: loginForm.value.endpoint,
            websocket: loginForm.value.websocket
        }
    });

    async function clickDeleteSavedLogin(userId) {
        await deleteSavedLogin(userId);
        await updateSavedCredentials();
    }

    async function clickSavedLogin(user) {
        await relogin(user);
        await updateSavedCredentials();
    }

    const onSubmit = handleSubmit(async (formValues) => {
        loginForm.value.username = formValues.username ?? '';
        loginForm.value.password = formValues.password ?? '';
        loginForm.value.endpoint = formValues.endpoint ?? '';
        loginForm.value.websocket = formValues.websocket ?? '';
        await login();
        await updateSavedCredentials();
    });

    async function handleCustomEndpointToggle() {
        await toggleCustomEndpoint();
        setValues({
            ...values,
            endpoint: loginForm.value.endpoint,
            websocket: loginForm.value.websocket
        });
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
        resetForm({
            values: {
                username: '',
                password: '',
                endpoint: '',
                websocket: ''
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
            loginForm.value.endpoint = formValues.endpoint ?? '';
            loginForm.value.websocket = formValues.websocket ?? '';
        },
        { deep: true }
    );
</script>
