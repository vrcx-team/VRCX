<template>
    <div
        class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-41.75 hover:rounded-[25px_5px_5px_25px]"
        @click="handleViewDetails">
        <div class="relative inline-block flex-none size-9 mr-2.5">
            <Avatar class="size-9">
                <AvatarImage :src="group.iconUrl" class="object-cover" />
                <AvatarFallback>
                    <Users class="size-4 text-muted-foreground" />
                </AvatarFallback>
            </Avatar>
        </div>
        <div class="flex-1 overflow-hidden">
            <span class="block truncate font-medium leading-4.5" v-text="group.name"></span>
            <span class="truncate text-xs inline-flex! items-center">
                <TooltipWrapper
                    v-if="group.isRepresenting"
                    side="top"
                    :content="t('dialog.group.members.representing')">
                    <Tag style="margin-right: 6px" />
                </TooltipWrapper>
                <TooltipWrapper v-if="memberVisibility !== 'visible'" side="top">
                    <template #content>
                        <span>{{ t('dialog.group.members.visibility') }} {{ memberVisibility }}</span>
                    </template>
                    <Eye style="margin-right: 6px" />
                </TooltipWrapper>
                <span>({{ group.memberCount }})</span>
            </span>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button class="rounded-full ml-1 shrink-0" size="icon-sm" variant="ghost" @click.stop>
                    <MoreHorizontal class="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-52">
                <DropdownMenuItem @click="handleViewDetails">
                    <ExternalLink class="size-4" />
                    {{ t('common.actions.view_details') }}
                </DropdownMenuItem>
                <template v-if="canManage && canManageVisibility">
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Eye class="size-4" />
                            {{ t('dialog.group.members.visibility') }}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent side="right" align="start" class="w-52">
                                <DropdownMenuItem @click="setVisibility('visible')">
                                    <Eye class="size-4" />
                                    <Check v-if="memberVisibility === 'visible'" class="size-4" />
                                    {{ t('dialog.group.actions.visibility_everyone') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="setVisibility('friends')">
                                    <Eye class="size-4" />
                                    <Check v-if="memberVisibility === 'friends'" class="size-4" />
                                    {{ t('dialog.group.actions.visibility_friends') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="setVisibility('hidden')">
                                    <Eye class="size-4" />
                                    <Check v-if="memberVisibility === 'hidden'" class="size-4" />
                                    {{ t('dialog.group.actions.visibility_hidden') }}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </template>
                <template v-if="canManage">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" @click="handleLeaveGroup">
                        <Trash2 class="size-4" />
                        {{ t('dialog.group.actions.leave') }}
                    </DropdownMenuItem>
                </template>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>

<script setup>
    import {
        Check,
        ExternalLink,
        Eye,
        MoreHorizontal,
        Tag,
        Trash2,
        Users
    } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuPortal,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';

    import { leaveGroupPrompt, setGroupVisibility, showGroupDialog } from '../../../coordinators/groupCoordinator';

    const { t } = useI18n();

    const props = defineProps({
        group: {
            type: Object,
            required: true
        },
        canManage: {
            type: Boolean,
            default: false
        }
    });

    const memberVisibility = computed(
        () => props.group?.memberVisibility || props.group?.myMember?.visibility || 'visible'
    );

    const canManageVisibility = computed(
        () => props.group?.privacy === 'default'
    );

    function handleViewDetails() {
        showGroupDialog(props.group.id);
    }

    function setVisibility(value) {
        setGroupVisibility(props.group.id, value);
    }

    function handleLeaveGroup() {
        leaveGroupPrompt(props.group.id);
    }
</script>