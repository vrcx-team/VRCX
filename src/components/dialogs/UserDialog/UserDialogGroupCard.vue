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
    </div>
</template>

<script setup>
    import { Eye, Tag, Users } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

    import { showGroupDialog } from '../../../coordinators/groupCoordinator';

    const { t } = useI18n();

    const props = defineProps({
        group: {
            type: Object,
            required: true
        }
    });

    const memberVisibility = computed(
        () => props.group?.memberVisibility || props.group?.myMember?.visibility || 'visible'
    );

    function handleViewDetails() {
        showGroupDialog(props.group.id);
    }
</script>