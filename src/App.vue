<template>
    <el-config-provider :locale="currentLocale">
        <MacOSTitleBar></MacOSTitleBar>

        <div
            id="x-app"
            class="x-app"
            :class="{ 'with-macos-titlebar': isMacOS }"
            ondragenter="event.preventDefault()"
            ondragover="event.preventDefault()"
            ondrop="event.preventDefault()">
            <RouterView></RouterView>

            <VRCXUpdateDialog></VRCXUpdateDialog>
        </div>
    </el-config-provider>
</template>

<script setup>
    import { computed, onBeforeMount, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import cs from 'element-plus/es/locale/lang/cs';
    import en from 'element-plus/es/locale/lang/en';
    import es from 'element-plus/es/locale/lang/es';
    import fr from 'element-plus/es/locale/lang/fr';
    import hu from 'element-plus/es/locale/lang/hu';
    import ja from 'element-plus/es/locale/lang/ja';
    import ko from 'element-plus/es/locale/lang/ko';
    import pl from 'element-plus/es/locale/lang/pl';
    import pt from 'element-plus/es/locale/lang/pt';
    import ru from 'element-plus/es/locale/lang/ru';
    import th from 'element-plus/es/locale/lang/th';
    import vi from 'element-plus/es/locale/lang/vi';
    import zhCN from 'element-plus/es/locale/lang/zh-cn';
    import zhTW from 'element-plus/es/locale/lang/zh-tw';

    import { createGlobalStores } from './stores';
    import { initNoty } from './plugin/noty';

    import MacOSTitleBar from './components/MacOSTitleBar.vue';
    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';

    import './app.scss';

    console.log(`isLinux: ${LINUX}`);

    const isMacOS = computed(() => {
        return navigator.platform.indexOf('Mac') > -1;
    });

    const { locale } = useI18n();

    initNoty();

    const langMap = {
        en: en,
        es: es,
        fr: fr,
        hu: hu,
        ja: ja,
        ko: ko,
        pl: pl,
        pt: pt,
        cs: cs,
        ru: ru,
        vi: vi,
        'zh-CN': zhCN,
        'zh-TW': zhTW,
        th: th
    };

    const currentLocale = computed(() => {
        return langMap[locale.value] || en;
    });

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

<style lang="scss" scoped>
    :deep(.el-splitter-bar__dragger) {
        width: 4px !important;
    }

    /* Add title bar spacing for macOS */
    .x-app.with-macos-titlebar {
        padding-top: 28px;
    }
</style>
