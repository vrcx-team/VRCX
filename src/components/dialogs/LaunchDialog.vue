<template>
    <el-dialog :z-index="launchDialogIndex" v-model="isVisible" :title="t('dialog.launch.header')" width="450px">
        <FieldGroup class="gap-4">
            <Field>
                <FieldLabel>{{ t('dialog.launch.url') }}</FieldLabel>
                <FieldContent class="flex-row items-center gap-2">
                    <InputGroupField
                        v-model="launchDialog.url"
                        size="sm"
                        @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                    <TooltipWrapper side="right" :content="t('dialog.launch.copy_tooltip')">
                        <Button
                            class="rounded-full"
                            size="icon-sm"
                            variant="ghost"
                            @click="copyInstanceMessage(launchDialog.url)"
                            ><Copy
                        /></Button>
                    </TooltipWrapper>
                </FieldContent>
            </Field>
            <Field v-if="launchDialog.shortUrl">
                <FieldLabel>
                    <span class="flex items-center gap-1">
                        <span>{{ t('dialog.launch.short_url') }}</span>
                        <TooltipWrapper side="top" :content="t('dialog.launch.short_url_notice')">
                            <AlertTriangle />
                        </TooltipWrapper>
                    </span>
                </FieldLabel>
                <FieldContent class="flex-row items-center gap-2">
                    <InputGroupField
                        v-model="launchDialog.shortUrl"
                        size="sm"
                        @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                    <TooltipWrapper side="right" :content="t('dialog.launch.copy_tooltip')">
                        <Button
                            class="rounded-full"
                            size="icon-sm"
                            variant="ghost"
                            @click="copyInstanceMessage(launchDialog.shortUrl)"
                            ><Copy
                        /></Button>
                    </TooltipWrapper>
                </FieldContent>
            </Field>
            <Field>
                <FieldLabel>{{ t('dialog.launch.location') }}</FieldLabel>
                <FieldContent class="flex-row items-center gap-2">
                    <InputGroupField
                        v-model="launchDialog.location"
                        size="sm"
                        @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                    <TooltipWrapper side="right" :content="t('dialog.launch.copy_tooltip')">
                        <Button
                            class="rounded-full"
                            size="icon-sm"
                            variant="ghost"
                            @click="copyInstanceMessage(launchDialog.location)"
                            ><Copy
                        /></Button>
                    </TooltipWrapper>
                </FieldContent>
            </Field>
        </FieldGroup>
        <template #footer>
            <div class="flex justify-end">
                <Button
                    class="mr-1.5"
                    variant="outline"
                    :disabled="!checkCanInvite(launchDialog.location)"
                    @click="showInviteDialog(launchDialog.location)">
                    {{ t('dialog.launch.invite') }}
                </Button>
                <Button
                    v-if="canOpenInstanceInGame"
                    variant="outline"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="handleAttachGame(launchDialog.location, launchDialog.shortName)">
                    {{ t('dialog.launch.open_ingame') }}
                </Button>
                <Button
                    v-else
                    variant="outline"
                    class="mr-1.25"
                    :disabled="!launchDialog.secureOrShortName"
                    @click="selfInvite(launchDialog.location, launchDialog.shortName)">
                    {{ t('dialog.launch.self_invite') }}
                </Button>
                <ButtonGroup>
                    <Button
                        :disabled="!launchDialog.secureOrShortName"
                        @click="handleLaunchDefault(launchDialog.location, launchDialog.shortName)">
                        {{ launchModeLabel }}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button size="icon" :disabled="!launchDialog.secureOrShortName" aria-label="More options">
                                <MoreHorizontal class="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="w-52">
                            <DropdownMenuItem
                                @click="
                                    handleLaunchCommand(
                                        launchDialog.desktop ? 'vr' : 'desktop',
                                        launchDialog.location,
                                        launchDialog.shortName
                                    )
                                ">
                                {{
                                    launchDialog.desktop
                                        ? t('dialog.launch.launch')
                                        : t('dialog.launch.start_as_desktop')
                                }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ButtonGroup>
            </div>
        </template>
        <InviteDialog :invite-dialog="inviteDialog" @closeInviteDialog="closeInviteDialog" />
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { AlertTriangle, Copy, MoreHorizontal } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { ButtonGroup } from '@/components/ui/button-group';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useFriendStore,
        useGameStore,
        useInviteStore,
        useLaunchStore,
        useLocationStore,
        useModalStore
    } from '../../stores';
    import { checkCanInvite, getLaunchURL, isRealInstance, parseLocation } from '../../shared/utils';
    import { instanceRequest, worldRequest } from '../../api';
    import { getNextDialogIndex } from '../../shared/utils/base/ui';

    import InviteDialog from './InviteDialog/InviteDialog.vue';
    import configRepository from '../../service/config';

    const { t } = useI18n();

    const modalStore = useModalStore();

    const { friends } = storeToRefs(useFriendStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { launchGame, tryOpenInstanceInVrc } = useLaunchStore();
    const { launchDialogData } = storeToRefs(useLaunchStore());

    const { canOpenInstanceInGame } = storeToRefs(useInviteStore());
    const { isGameRunning } = storeToRefs(useGameStore());

    const launchModeLabel = computed(() =>
        launchDialog.value.desktop ? t('dialog.launch.start_as_desktop') : t('dialog.launch.launch')
    );

    const launchDialogIndex = ref(2000);

    let launchAsDesktopTimeoutId;

    onBeforeUnmount(() => {
        clearTimeout(launchAsDesktopTimeoutId);
    });

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
                    if (typeof ctx?.ref === 'undefined') {
                        continue;
                    }
                    D.friendsInInstance.push(ctx);
                }
                D.visible = true;
            });
    }
    function handleLaunchGame(location, shortName, desktop) {
        if (isGameRunning.value) {
            modalStore
                .confirm({
                    description: t('dialog.launch.game_running_warning'),
                    title: t('dialog.launch.header'),
                    confirmText: t('dialog.launch.confirm_yes'),
                    cancelText: t('dialog.launch.confirm_no')
                })
                .then(({ ok }) => {
                    if (!ok) return;
                    launchGame(location, shortName, desktop);
                    isVisible.value = false;
                })
                .catch(() => {});
            return;
        }
        launchGame(location, shortName, desktop);
        isVisible.value = false;
    }

    function handleLaunchDefault(location, shortName) {
        handleLaunchGame(location, shortName, launchDialog.value.desktop);
    }

    function handleLaunchCommand(command, location, shortName) {
        const desktop = command === 'desktop';
        configRepository.setBool('launchAsDesktop', desktop);
        handleLaunchGame(location, shortName, desktop);
        clearTimeout(launchAsDesktopTimeoutId);
        launchAsDesktopTimeoutId = setTimeout(() => {
            launchDialog.value.desktop = desktop;
        }, 500);
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
                toast.success('Self invite sent');
                return args;
            });
    }

    function getConfig() {
        configRepository.getBool('launchAsDesktop').then((value) => (launchDialog.value.desktop = value));
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
            toast.success('Instance copied to clipboard');
        } catch (error) {
            toast.error('Instance copied failed');
            console.error(error.message);
        }
    }
</script>
