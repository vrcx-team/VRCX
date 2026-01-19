<template>
    <TooltipProvider>
        <MacOSTitleBar></MacOSTitleBar>

        <div
            id="x-app"
            class="x-app"
            :class="{ 'with-macos-titlebar': isMacOS }"
            ondragenter="event.preventDefault()"
            ondragover="event.preventDefault()"
            ondrop="event.preventDefault()">
            <RouterView></RouterView>
            <Toaster position="top" :theme="sonnerTheme" :data-theme="themeMode"></Toaster>

            <AlertDialogModal></AlertDialogModal>
            <PromptDialogModal></PromptDialogModal>

            <VRCXUpdateDialog></VRCXUpdateDialog>
        </div>
        <div id="x-dialog-portal" class="x-dialog-portal"></div>
    </TooltipProvider>
</template>

<script setup>
    import { computed, onBeforeMount, onMounted } from 'vue';
    import { storeToRefs } from 'pinia';

    import { Toaster } from './components/ui/sonner';
    import { TooltipProvider } from './components/ui/tooltip';
    import { createGlobalStores } from './stores';
    import { initNoty } from './plugin/noty';

    import AlertDialogModal from './components/ui/alert-dialog/AlertDialogModal.vue';
    import MacOSTitleBar from './components/MacOSTitleBar.vue';
    import PromptDialogModal from './components/ui/dialog/PromptDialogModal.vue';
    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';

    import '@/styles/globals.css';
    import '@/app.css';

    console.log(`isLinux: ${LINUX}`);

    const isMacOS = computed(() => navigator.platform.includes('Mac'));

    initNoty();

    const store = createGlobalStores();
    const { isDarkMode, themeMode } = storeToRefs(store.appearanceSettings);
    const sonnerTheme = computed(() => (isDarkMode.value ? 'dark' : 'light'));

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
