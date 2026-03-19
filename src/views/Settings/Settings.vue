<template>
    <div class="x-container flex flex-col overflow-hidden!">
        <div class="shrink-0 p-1.5">
            <span class="text-lg font-semibold text-foreground">{{ t('view.settings.header') }}</span>
        </div>
        <TabsUnderline
            default-value="system"
            :items="settingsTabs"
            :unmount-on-hide="false"
            fill>
            <template #system>
                <SystemTab />
            </template>
            <template #interface>
                <InterfaceTab />
            </template>
            <template #social>
                <SocialTab />
            </template>
            <template #notifications>
                <NotificationsTab />
            </template>
            <template #vr>
                <VrTab />
            </template>
            <template #media>
                <MediaTab />
            </template>
            <template #integrations>
                <IntegrationsTab />
            </template>
            <template #advanced>
                <AdvancedTab />
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import { computed, onBeforeMount } from 'vue';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { useI18n } from 'vue-i18n';

    import AdvancedTab from './components/Tabs/AdvancedTab.vue';
    import InterfaceTab from './components/Tabs/InterfaceTab.vue';
    import IntegrationsTab from './components/Tabs/IntegrationsTab.vue';
    import MediaTab from './components/Tabs/MediaTab.vue';
    import NotificationsTab from './components/Tabs/NotificationsTab.vue';
    import SocialTab from './components/Tabs/SocialTab.vue';
    import SystemTab from './components/Tabs/SystemTab.vue';
    import VrTab from './components/Tabs/VrTab.vue';

    const { t } = useI18n();
    const settingsTabs = computed(() => [
        { value: 'system', label: t('view.settings.category.system') },
        { value: 'interface', label: t('view.settings.category.interface') },
        { value: 'social', label: t('view.settings.category.social') },
        { value: 'notifications', label: t('view.settings.category.notifications') },
        { value: 'vr', label: t('view.settings.category.vr') },
        { value: 'media', label: t('view.settings.category.media') },
        { value: 'integrations', label: t('view.settings.category.integrations') },
        { value: 'advanced', label: t('view.settings.category.advanced') }
    ]);

    onBeforeMount(() => {
        const menuItem = document.querySelector('li[role="menuitem"].is-active');

        if (menuItem) {
            menuItem.classList.remove('is-active');
        }
    });
</script>
