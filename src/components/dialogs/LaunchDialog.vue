<template>
    <safe-dialog ref="launchDialog" :visible.sync="isVisible" :title="$t('dialog.launch.header')" width="450px">
        <el-form :model="launchDialog" label-width="100px">
            <el-form-item :label="$t('dialog.launch.url')">
                <el-input
                    v-model="launchDialog.url"
                    size="mini"
                    style="width: 260px"
                    @click.native="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="$t('dialog.launch.copy_tooltip')" :disabled="hideTooltips">
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
                    <span>{{ $t('dialog.launch.short_url') }}</span>
                    <el-tooltip
                        placement="top"
                        style="margin-left: 5px"
                        :content="$t('dialog.launch.short_url_notice')">
                        <i class="el-icon-warning" />
                    </el-tooltip>
                </template>
                <el-input
                    v-model="launchDialog.shortUrl"
                    size="mini"
                    style="width: 260px"
                    @click.native="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="$t('dialog.launch.copy_tooltip')" :disabled="hideTooltips">
                    <el-button
                        size="mini"
                        icon="el-icon-s-order"
                        style="margin-left: 5px"
                        circle
                        @click="copyInstanceMessage(launchDialog.shortUrl)" />
                </el-tooltip>
            </el-form-item>
            <el-form-item :label="$t('dialog.launch.location')">
                <el-input
                    v-model="launchDialog.location"
                    size="mini"
                    style="width: 260px"
                    @click.native="$event.target.tagName === 'INPUT' && $event.target.select()" />
                <el-tooltip placement="right" :content="$t('dialog.launch.copy_tooltip')" :disabled="hideTooltips">
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
            {{ $t('dialog.launch.start_as_desktop') }}
        </el-checkbox>
        <template slot="footer">
            <el-button size="small" @click="showPreviousInstancesInfoDialog(launchDialog.location)">
                {{ $t('dialog.launch.info') }}
            </el-button>
            <el-button
                size="small"
                :disabled="!checkCanInvite(launchDialog.location)"
                @click="showInviteDialog(launchDialog.location)">
                {{ $t('dialog.launch.invite') }}
            </el-button>
            <el-button
                type="primary"
                size="small"
                :disabled="!launchDialog.secureOrShortName"
                @click="launchGame(launchDialog.location, launchDialog.shortName, launchDialog.desktop)">
                {{ $t('dialog.launch.launch') }}
            </el-button>
        </template>
        <InviteDialog
            :invite-dialog="inviteDialog"
            :vip-friends="vipFriends"
            :online-friends="onlineFriends"
            :active-friends="activeFriends"
            :invite-message-table="inviteMessageTable"
            :upload-image="uploadImage"
            @close-invite-dialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script>
    import { instanceRequest, worldRequest } from '../../api';
    import { isRealInstance, parseLocation } from '../../composables/instance/utils';
    import { getLaunchURL } from '../../composables/shared/utils';
    import configRepository from '../../service/config';
    import InviteDialog from './InviteDialog/InviteDialog.vue';

    export default {
        name: 'LaunchDialog',
        components: { InviteDialog },
        inject: ['showPreviousInstancesInfoDialog', 'adjustDialogZ'],
        props: {
            hideTooltips: Boolean,
            launchDialogData: { type: Object, required: true },
            checkCanInvite: {
                type: Function,
                required: true
            },
            vipFriends: {
                type: Array,
                default: () => []
            },
            onlineFriends: {
                type: Array,
                default: () => []
            },
            activeFriends: {
                type: Array,
                default: () => []
            },
            inviteMessageTable: {
                type: Object,
                default: () => ({})
            },
            uploadImage: {
                type: String,
                default: ''
            },
            lastLocation: {
                type: Object,
                default: () => ({})
            }
        },
        data() {
            return {
                launchDialog: {
                    loading: false,
                    desktop: false,
                    tag: '',
                    location: '',
                    url: '',
                    shortName: '',
                    shortUrl: '',
                    secureOrShortName: ''
                },
                inviteDialog: {
                    visible: false,
                    loading: false,
                    worldId: '',
                    worldName: '',
                    userIds: [],
                    friendsInInstance: []
                }
            };
        },
        computed: {
            isVisible: {
                get() {
                    return this.launchDialogData.visible;
                },
                set(value) {
                    this.$emit('update:launch-dialog-data', { ...this.launchDialogData, visible: value });
                }
            }
        },
        watch: {
            'launchDialogData.loading': {
                handler() {
                    this.getConfig();
                    this.initLaunchDialog();
                }
            }
        },

        created() {
            this.getConfig();
        },
        methods: {
            closeInviteDialog() {
                this.inviteDialog.visible = false;
            },
            showInviteDialog(tag) {
                if (!isRealInstance(tag)) {
                    return;
                }
                const L = parseLocation(tag);
                worldRequest
                    .getCachedWorld({
                        worldId: L.worldId
                    })
                    .then((args) => {
                        const D = this.inviteDialog;
                        D.userIds = [];
                        D.worldId = L.tag;
                        D.worldName = args.ref.name;
                        D.friendsInInstance = [];
                        const friendsInCurrentInstance = this.lastLocation.friendList;
                        for (const friend of friendsInCurrentInstance.values()) {
                            const ctx = this.friends.get(friend.userId);
                            if (typeof ctx.ref === 'undefined') {
                                continue;
                            }
                            D.friendsInInstance.push(ctx);
                        }
                        D.visible = true;
                    });
            },
            launchGame(location, shortName, desktop) {
                this.$emit('launchGame', location, shortName, desktop);
                this.isVisible = false;
            },
            getConfig() {
                configRepository.getBool('launchAsDesktop').then((value) => (this.launchDialog.desktop = value));
            },
            saveLaunchDialog() {
                configRepository.setBool('launchAsDesktop', this.launchDialog.desktop);
            },
            async initLaunchDialog() {
                const { tag, shortName } = this.launchDialogData;
                if (!isRealInstance(tag)) {
                    return;
                }
                this.$nextTick(() => this.adjustDialogZ(this.$refs.launchDialog.$el));
                const D = this.launchDialog;
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
                    // NOTE:
                    // splitting the 'INSTANCE:SHORTNAME' event and put code here
                    if (!res.json) {
                        return;
                    }
                    const resLocation = `${res.instance.worldId}:${res.instance.instanceId}`;
                    if (resLocation === this.launchDialog.tag) {
                        const resShortName = res.json.shortName;
                        const secureOrShortName = res.json.shortName || res.json.secureName;
                        const parsedL = parseLocation(resLocation);
                        parsedL.shortName = resShortName;
                        this.launchDialog.shortName = resShortName;
                        this.launchDialog.secureOrShortName = secureOrShortName;
                        if (resShortName) {
                            this.launchDialog.shortUrl = `https://vrch.at/${resShortName}`;
                        }
                        this.launchDialog.url = getLaunchURL(parsedL);
                    }
                }
            },
            async copyInstanceMessage(input) {
                try {
                    await navigator.clipboard.writeText(input);
                    this.$message({
                        message: 'Instance copied to clipboard',
                        type: 'success'
                    });
                } catch (error) {
                    this.$message({
                        message: 'Instance copied failed',
                        type: 'error'
                    });
                    console.error(error.message);
                }
            }
        }
    };
</script>
