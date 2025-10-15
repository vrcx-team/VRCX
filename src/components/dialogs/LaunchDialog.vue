<template>
    <el-dialog :z-index="launchDialogIndex" v-model="isVisible" :title="t('dialog.launch.header')" width="450px">
        <el-form :model="launchDialog" label-width="100px">
            <el-form-item :label="t('dialog.launch.url')">
                <el-input
                    v-model="launchDialog.url"
                    size="small"
                    style="width: 230px"
                    @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="t('dialog.launch.copy_tooltip')">
                    <el-button
                        size="small"
                        :icon="CopyDocument"
                        style="margin-left: 5px"
                        circle
                        @click="copyInstanceMessage(launchDialog.url)" />
                </el-tooltip>
            </el-form-item>
            <el-form-item v-if="launchDialog.shortUrl">
                <template #label>
                    <span>{{ t('dialog.launch.short_url') }}</span>
                    <el-tooltip placement="top" :content="t('dialog.launch.short_url_notice')">
                        <el-icon style="display: inline-block; margin-left: 5px"><Warning /></el-icon>
                    </el-tooltip>
                </template>
                <el-input
                    v-model="launchDialog.shortUrl"
                    size="small"
                    style="width: 230px"
                    @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="t('dialog.launch.copy_tooltip')">
                    <el-button
                        size="small"
                        :icon="CopyDocument"
                        style="display: inline-block; margin-left: 5px"
                        circle
                        @click="copyInstanceMessage(launchDialog.shortUrl)" />
                </el-tooltip>
            </el-form-item>
            <el-form-item :label="t('dialog.launch.location')">
                <el-input
                    v-model="launchDialog.location"
                    size="small"
                    style="width: 230px"
                    @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="t('dialog.launch.copy_tooltip')">
                    <el-button
                        size="small"
                        :icon="CopyDocument"
                        style="display: inline-block; margin-left: 5px"
                        circle
                        @click="copyInstanceMessage(launchDialog.location)" />
                </el-tooltip>
            </el-form-item>
        </el-form>
        <el-checkbox
            v-model="launchDialog.desktop"
            style="display: inline-flex; align-items: center; margin-top: 5px"
            @change="saveLaunchDialog">
            {{ t('dialog.launch.start_as_desktop') }}
        </el-checkbox>
        <template #footer>
            <el-button
                :disabled="!checkCanInvite(launchDialog.location)"
                @click="showInviteDialog(launchDialog.location)">
                {{ t('dialog.launch.invite') }}
            </el-button>
            <template v-if="canOpenInstanceInGame()">
                <el-button
                    :disabled="!launchDialog.secureOrShortName"
                    @click="handleLaunchGame(launchDialog.location, launchDialog.shortName, launchDialog.desktop)">
                    {{ t('dialog.launch.launch') }}
                </el-button>
                <el-button
                    type="primary"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="handleAttachGame(launchDialog.location, launchDialog.shortName)">
                    {{ t('dialog.launch.open_ingame') }}
                </el-button>
            </template>
            <template v-else>
                <el-button
                    :disabled="!launchDialog.secureOrShortName"
                    @click="selfInvite(launchDialog.location, launchDialog.shortName)">
                    {{ t('dialog.launch.self_invite') }}
                </el-button>
                <el-button
                    type="primary"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="handleLaunchGame(launchDialog.location, launchDialog.shortName, launchDialog.desktop)">
                    {{ t('dialog.launch.launch') }}
                </el-button>
            </template>
        </template>
        <InviteDialog :invite-dialog="inviteDialog" @closeInviteDialog="closeInviteDialog" />
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { CopyDocument, Warning } from '@element-plus/icons-vue';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFriendStore, useGameStore, useInviteStore, useLaunchStore, useLocationStore } from '../../stores';
    import { checkCanInvite, getLaunchURL, isRealInstance, parseLocation } from '../../shared/utils';
    import { instanceRequest, worldRequest } from '../../api';
    import { getNextDialogIndex } from '../../shared/utils/base/ui';

    import InviteDialog from './InviteDialog/InviteDialog.vue';
    import configRepository from '../../service/config';

    const { t } = useI18n();

    const { friends } = storeToRefs(useFriendStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { launchGame, tryOpenInstanceInVrc } = useLaunchStore();
    const { launchDialogData } = storeToRefs(useLaunchStore());

    const { canOpenInstanceInGame } = useInviteStore();
    const { isGameRunning } = storeToRefs(useGameStore());

    const launchDialogIndex = ref(2000);

    const launchDialog = ref({
        loading: false,
        desktop: false,
        tag: '',
        location: '',
        url: '',
        shortName: '',
        shortUrl: '',
        secureOrShortName: ''
    });

    const inviteDialog = ref({
        visible: false,
        loading: false,
        worldId: '',
        worldName: '',
        userIds: [],
        friendsInInstance: []
    });

    const isVisible = computed({
        get() {
            return launchDialogData.value.visible;
        },
        set(value) {
            launchDialogData.value.visible = value;
        }
    });

    watch(
        () => launchDialogData.value.loading,
        (loading) => {
            if (loading) {
                getConfig();
                initLaunchDialog();
            }
        }
    );

    getConfig();

    function closeInviteDialog() {
        inviteDialog.value.visible = false;
    }
    function showInviteDialog(tag) {
        if (!isRealInstance(tag)) {
            return;
        }
        const L = parseLocation(tag);
        worldRequest
            .getCachedWorld({
                worldId: L.worldId
            })
            .then((args) => {
                const D = inviteDialog.value;
                D.userIds = [];
                D.worldId = L.tag;
                D.worldName = args.ref.name;
                D.friendsInInstance = [];
                const friendsInCurrentInstance = lastLocation.value.friendList;
                for (const friend of friendsInCurrentInstance.values()) {
                    const ctx = friends.value.get(friend.userId);
                    if (typeof ctx.ref === 'undefined') {
                        continue;
                    }
                    D.friendsInInstance.push(ctx);
                }
                D.visible = true;
            });
    }
    function handleLaunchGame(location, shortName, desktop) {
        if (isGameRunning.value) {
            ElMessageBox.confirm(t('dialog.launch.game_running_warning'), t('dialog.launch.header'), {
                confirmButtonText: t('dialog.launch.confirm_yes'),
                cancelButtonText: t('dialog.launch.confirm_no'),
                type: 'warning'
            })
                .then((action) => {
                    if (action === 'confirm') {
                        launchGame(location, shortName, desktop);
                        isVisible.value = false;
                    }
                })
                .catch(() => {});
            return;
        }
        launchGame(location, shortName, desktop);
        isVisible.value = false;
    }
    function handleAttachGame(location, shortName) {
        tryOpenInstanceInVrc(location, shortName);
        isVisible.value = false;
    }
    function selfInvite(location, shortName) {
        const L = parseLocation(location);
        if (!L.isRealInstance) {
            return;
        }
        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId,
                shortName
            })
            .then((args) => {
                ElMessage({
                    message: 'Self invite sent',
                    type: 'success'
                });
                return args;
            });
    }
    function getConfig() {
        configRepository.getBool('launchAsDesktop').then((value) => (launchDialog.value.desktop = value));
    }
    function saveLaunchDialog() {
        configRepository.setBool('launchAsDesktop', launchDialog.value.desktop);
    }
    async function initLaunchDialog() {
        const { tag, shortName } = launchDialogData.value;
        if (!isRealInstance(tag)) {
            return;
        }
        nextTick(() => {
            launchDialogIndex.value = getNextDialogIndex();
        });
        const D = launchDialog.value;
        D.tag = tag;
        D.secureOrShortName = shortName;
        D.shortUrl = '';
        D.shortName = shortName;
        const L = parseLocation(tag);
        L.shortName = shortName;
        if (shortName) {
            D.shortUrl = `https://vrch.at/${shortName}`;
        }
        if (L.instanceId) {
            D.location = `${L.worldId}:${L.instanceId}`;
        } else {
            D.location = L.worldId;
        }
        D.url = getLaunchURL(L);
        if (!shortName) {
            const res = await instanceRequest.getInstanceShortName({
                worldId: L.worldId,
                instanceId: L.instanceId
            });
            if (!res.json) {
                return;
            }
            const resLocation = `${res.instance.worldId}:${res.instance.instanceId}`;
            if (resLocation === launchDialog.value.tag) {
                const resShortName = res.json.shortName;
                const secureOrShortName = res.json.shortName || res.json.secureName;
                const parsedL = parseLocation(resLocation);
                parsedL.shortName = resShortName;
                launchDialog.value.shortName = resShortName;
                launchDialog.value.secureOrShortName = secureOrShortName;
                if (resShortName) {
                    launchDialog.value.shortUrl = `https://vrch.at/${resShortName}`;
                }
                launchDialog.value.url = getLaunchURL(parsedL);
            }
        }
    }
    async function copyInstanceMessage(input) {
        try {
            await navigator.clipboard.writeText(input);
            ElMessage({
                message: 'Instance copied to clipboard',
                type: 'success'
            });
        } catch (error) {
            ElMessage({
                message: 'Instance copied failed',
                type: 'error'
            });
            console.error(error.message);
        }
    }
</script>
