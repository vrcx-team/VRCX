<template>
    <safe-dialog ref="launchDialogRef" :visible.sync="isVisible" :title="t('dialog.launch.header')" width="450px">
        <el-form :model="launchDialog" label-width="100px">
            <el-form-item :label="t('dialog.launch.url')">
                <el-input
                    v-model="launchDialog.url"
                    size="mini"
                    style="width: 260px"
                    @click.native="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="t('dialog.launch.copy_tooltip')" :disabled="hideTooltips">
                    <el-button
                        size="mini"
                        icon="el-icon-s-order"
                        style="margin-left: 5px"
                        circle
                        @click="copyInstanceMessage(launchDialog.url)" />
                </el-tooltip>
            </el-form-item>
            <el-form-item v-if="launchDialog.shortUrl">
                <template slot="label">
                    <span>{{ t('dialog.launch.short_url') }}</span>
                    <el-tooltip placement="top" style="margin-left: 5px" :content="t('dialog.launch.short_url_notice')">
                        <i class="el-icon-warning" />
                    </el-tooltip>
                </template>
                <el-input
                    v-model="launchDialog.shortUrl"
                    size="mini"
                    style="width: 260px"
                    @click.native="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="t('dialog.launch.copy_tooltip')" :disabled="hideTooltips">
                    <el-button
                        size="mini"
                        icon="el-icon-s-order"
                        style="margin-left: 5px"
                        circle
                        @click="copyInstanceMessage(launchDialog.shortUrl)" />
                </el-tooltip>
            </el-form-item>
            <el-form-item :label="t('dialog.launch.location')">
                <el-input
                    v-model="launchDialog.location"
                    size="mini"
                    style="width: 260px"
                    @click.native="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="t('dialog.launch.copy_tooltip')" :disabled="hideTooltips">
                    <el-button
                        size="mini"
                        icon="el-icon-s-order"
                        style="margin-left: 5px"
                        circle
                        @click="copyInstanceMessage(launchDialog.location)" />
                </el-tooltip>
            </el-form-item>
        </el-form>
        <el-checkbox v-model="launchDialog.desktop" style="float: left; margin-top: 5px" @change="saveLaunchDialog">
            {{ t('dialog.launch.start_as_desktop') }}
        </el-checkbox>
        <template slot="footer">
            <el-button size="small" @click="showPreviousInstancesInfoDialog(launchDialog.location)">
                {{ t('dialog.launch.info') }}
            </el-button>
            <el-button
                size="small"
                :disabled="!checkCanInvite(launchDialog.location)"
                @click="showInviteDialog(launchDialog.location)">
                {{ t('dialog.launch.invite') }}
            </el-button>
            <template v-if="canOpenInstanceInGame()">
                <el-button
                    type="default"
                    size="small"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="handleLaunchGame(launchDialog.location, launchDialog.shortName, launchDialog.desktop)">
                    {{ t('dialog.launch.launch') }}
                </el-button>
                <el-button
                    type="primary"
                    size="small"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="handleAttachGame(launchDialog.location, launchDialog.shortName)">
                    {{ t('dialog.launch.open_ingame') }}
                </el-button>
            </template>
            <template v-else>
                <el-button
                    type="default"
                    size="small"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="selfInvite(launchDialog.location, launchDialog.shortName)">
                    {{ t('dialog.launch.self_invite') }}
                </el-button>
                <el-button
                    type="primary"
                    size="small"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="handleLaunchGame(launchDialog.location, launchDialog.shortName, launchDialog.desktop)">
                    {{ t('dialog.launch.launch') }}
                </el-button>
            </template>
        </template>
        <InviteDialog :invite-dialog="inviteDialog" @closeInviteDialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script setup>
    import { ref, computed, nextTick, watch, getCurrentInstance } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import { instanceRequest, worldRequest } from '../../api';
    import configRepository from '../../service/config';
    import { adjustDialogZ, checkCanInvite, getLaunchURL, isRealInstance, parseLocation } from '../../shared/utils';
    import {
        useAppearanceSettingsStore,
        useFriendStore,
        useInviteStore,
        useInstanceStore,
        useLaunchStore,
        useLocationStore,
        useGameStore
    } from '../../stores';
    import InviteDialog from './InviteDialog/InviteDialog.vue';

    const { proxy } = getCurrentInstance();
    const { t } = useI18n();

    const { friends } = storeToRefs(useFriendStore());
    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { launchGame, tryOpenInstanceInVrc } = useLaunchStore();
    const { launchDialogData } = storeToRefs(useLaunchStore());
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { canOpenInstanceInGame } = useInviteStore();
    const { isGameRunning } = storeToRefs(useGameStore());

    const launchDialogRef = ref(null);

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
            proxy.$confirm(t('dialog.launch.game_running_warning'), t('dialog.launch.header'), {
                confirmButtonText: t('dialog.launch.confirm_yes'),
                cancelButtonText: t('dialog.launch.confirm_no'),
                type: 'warning',
                callback: (action) => {
                    if (action === 'confirm') {
                        launchGame(location, shortName, desktop);
                        isVisible.value = false;
                    }
                }
            });
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
                proxy.$message({
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
        nextTick(() => adjustDialogZ(launchDialogRef.value.$el));
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
            proxy.$message({
                message: 'Instance copied to clipboard',
                type: 'success'
            });
        } catch (error) {
            proxy.$message({
                message: 'Instance copied failed',
                type: 'error'
            });
            console.error(error.message);
        }
    }
</script>
