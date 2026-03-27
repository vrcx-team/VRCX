<template>
    <component :is="itemComponent" v-if="showViewDetails" @click="$emit('view-details')">
        <ExternalLink class="size-4" />
        {{ t('common.actions.view_details') }}
    </component>
    <component :is="itemComponent" v-if="showShare" @click="$emit('share')">
        <Share2 class="size-4" />
        {{ t('dialog.world.actions.share') }}
    </component>
    <component :is="separatorComponent" v-if="showPrimarySeparator" />
    <component :is="itemComponent" v-if="showNewInstance" @click="$emit('new-instance')">
        <Flag class="size-4" />
        {{ t('dialog.world.actions.new_instance') }}
    </component>
    <component :is="itemComponent" v-if="showSelfInvite" @click="$emit('self-invite')">
        <MessageSquare class="size-4" />
        {{ selfInviteLabel }}
    </component>
    <component :is="separatorComponent" v-if="showSecondarySeparator" />
    <component :is="itemComponent" v-if="showPreviousInstances" @click="$emit('show-previous-instances')">
        <LineChart class="size-4" />
        {{ t('dialog.world.actions.show_previous_instances') }}
    </component>
    <slot name="append" />
</template>

<script setup>
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { ExternalLink, Flag, LineChart, MessageSquare, Share2 } from 'lucide-vue-next';

    import {
        ContextMenuItem,
        ContextMenuSeparator
    } from './ui/context-menu';
    import {
        DropdownMenuItem,
        DropdownMenuSeparator
    } from './ui/dropdown-menu';

    const { t } = useI18n();

    const props = defineProps({
        variant: {
            type: String,
            default: 'context'
        },
        canOpenInstanceInGame: {
            type: Boolean,
            default: false
        },
        showViewDetails: {
            type: Boolean,
            default: true
        },
        showShare: {
            type: Boolean,
            default: false
        },
        showNewInstance: {
            type: Boolean,
            default: true
        },
        showSelfInvite: {
            type: Boolean,
            default: true
        },
        showPreviousInstances: {
            type: Boolean,
            default: false
        }
    });

    defineEmits([
        'view-details',
        'share',
        'new-instance',
        'self-invite',
        'show-previous-instances'
    ]);

    const selfInviteLabel = computed(() =>
        props.canOpenInstanceInGame
            ? t('dialog.world.actions.new_instance_and_open_ingame')
            : t('dialog.world.actions.new_instance_and_self_invite')
    );

    const itemComponent = computed(() =>
        props.variant === 'dropdown' ? DropdownMenuItem : ContextMenuItem
    );

    const separatorComponent = computed(() =>
        props.variant === 'dropdown'
            ? DropdownMenuSeparator
            : ContextMenuSeparator
    );

    const showPrimarySeparator = computed(
        () =>
            (props.showViewDetails || props.showShare) &&
            (props.showNewInstance || props.showSelfInvite)
    );

    const showSecondarySeparator = computed(
        () =>
            props.showPreviousInstances &&
            (props.showViewDetails ||
                props.showShare ||
                props.showNewInstance ||
                props.showSelfInvite)
    );
</script>