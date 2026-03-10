<template>
    <TooltipProvider>
        <MacOSTitleBar></MacOSTitleBar>

        <div
            id="x-app"
            class="flex w-screen h-screen overflow-hidden cursor-default [&>.x-container]:pt-[15px]"
            :class="{ 'pt-7': isMacOS }">
            <RouterView></RouterView>
            <Toaster position="top-center" :theme="theme"></Toaster>

            <AlertDialogModal></AlertDialogModal>
            <PromptDialogModal></PromptDialogModal>
            <OtpDialogModal></OtpDialogModal>

            <VRCXUpdateDialog></VRCXUpdateDialog>
        </div>
        <div id="x-dialog-portal" class="x-dialog-portal"></div>
    </TooltipProvider>
</template>

<script setup>
    import { computed, onBeforeMount, onMounted } from 'vue';

    import { addGameLogEvent, getGameLogTable } from './coordinators/gameLogCoordinator';
    import { runCheckVRChatDebugLoggingFlow, runUpdateIsGameRunningFlow } from './coordinators/gameCoordinator';
    import { Toaster } from './components/ui/sonner';
    import { TooltipProvider } from './components/ui/tooltip';
    import { createGlobalStores } from './stores';
    import { initNoty } from './plugins/noty';

    import AlertDialogModal from './components/ui/alert-dialog/AlertDialogModal.vue';
    import MacOSTitleBar from './components/MacOSTitleBar.vue';
    import OtpDialogModal from './components/ui/dialog/OtpDialogModal.vue';
    import PromptDialogModal from './components/ui/dialog/PromptDialogModal.vue';
    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';

    import '@/styles/globals.css';

    console.log(`isLinux: ${LINUX}`);

    const isMacOS = computed(() => navigator.platform.includes('Mac'));

    const theme = computed(() => {
        return store.appearanceSettings.isDarkMode ? 'dark' : 'light';
    });

    initNoty();

    const store = createGlobalStores();

    if (typeof window !== 'undefined') {
        window.$pinia = store;
        // Bridge: attach coordinator functions to store for C# IPC callbacks
        store.game.updateIsGameRunning = runUpdateIsGameRunningFlow;
        store.gameLog.addGameLogEvent = addGameLogEvent;
    }

    onBeforeMount(() => {
        store.updateLoop.updateLoop();
    });

    onMounted(async () => {
        getGameLogTable();
        await store.auth.migrateStoredUsers();
        store.auth.autoLoginAfterMounted();
        store.vrcx.checkAutoBackupRestoreVrcRegistry();
        runCheckVRChatDebugLoggingFlow();
    });
</script>
