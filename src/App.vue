<template>
    <TooltipProvider>
        <el-config-provider
            :locale="/** @type {import('element-plus/es/locale').Language} */ (messages[locale].elementPlus)">
            <MacOSTitleBar></MacOSTitleBar>

            <div
                id="x-app"
                class="x-app"
                :class="{ 'with-macos-titlebar': isMacOS }"
                ondragenter="event.preventDefault()"
                ondragover="event.preventDefault()"
                ondrop="event.preventDefault()">
                <RouterView></RouterView>
                <Toaster position="top-center"></Toaster>

                <VRCXUpdateDialog></VRCXUpdateDialog>
            </div>
        </el-config-provider>
    </TooltipProvider>
</template>

<script setup>
    import { computed, onBeforeMount, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Toaster } from './components/ui/sonner';
    import { TooltipProvider } from './components/ui/tooltip';
    import { createGlobalStores } from './stores';
    import { initNoty } from './plugin/noty';

    import MacOSTitleBar from './components/MacOSTitleBar.vue';
    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';

    import '@/styles/globals.css';
    import '@/app.css';

    console.log(`isLinux: ${LINUX}`);

    const isMacOS = computed(() => navigator.platform.includes('Mac'));

    const { locale, messages } = useI18n();

    initNoty();

    const store = createGlobalStores();

    if (typeof window !== 'undefined') {
        window.$pinia = store;
    }

    onBeforeMount(() => {
        store.updateLoop.updateLoop();
    });

    onMounted(async () => {
        store.gameLog.getGameLogTable();
        await store.auth.migrateStoredUsers();
        store.auth.autoLoginAfterMounted();
        store.vrcx.checkAutoBackupRestoreVrcRegistry();
        store.game.checkVRChatDebugLogging();
    });
</script>

<style scoped>
    /* Add title bar spacing for macOS */
    .x-app.with-macos-titlebar {
        padding-top: 28px;
    }
</style>
