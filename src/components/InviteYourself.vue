<template>
    <div v-if="isVisible" :class="['inline-block']">
        <TooltipWrapper v-if="!canOpenInstanceInGame" side="top" :content="t('dialog.user.info.self_invite_tooltip')">
            <Button
                class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                size="icon-sm"
                variant="outline"
                v-show="isVisible"
                @click="confirmInvite"
                ><Mail class="h-4 w-4" /> ></Button
            >
        </TooltipWrapper>
        <TooltipWrapper v-else side="top" :content="t('dialog.user.info.open_in_vrchat_tooltip')">
            <Button
                class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                size="icon-sm"
                variant="outline"
                v-if="isOpeningInstance">
                <Loader2 class="h-4 w-4 animate-spin" />
            </Button>
            <Button
                class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                size="icon-sm"
                variant="outline"
                v-else
                @click="openInstance"
                ><Mail class="h-4 w-4"
            /></Button>
        </TooltipWrapper>
    </div>
</template>

<script setup>
    import { Loader2, Mail } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { checkCanInviteSelf, parseLocation } from '../shared/utils';
    import { useInviteStore, useLaunchStore } from '../stores';
    import { instanceRequest } from '../api';

    const props = defineProps({
        location: String,
        shortname: String
    });

    const { t } = useI18n();

    const { canOpenInstanceInGame } = storeToRefs(useInviteStore());
    const { tryOpenInstanceInVrc } = useLaunchStore();

    const { isOpeningInstance } = storeToRefs(useLaunchStore());

    const isVisible = computed(() => checkCanInviteSelf(props.location));

    function confirmInvite() {
        const L = parseLocation(props.location);
        if (!L.isRealInstance) {
            return;
        }

        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId,
                shortName: props.shortname
            })
            .then((args) => {
                toast.success('Self invite sent');
                return args;
            });
    }

    function openInstance() {
        const L = parseLocation(props.location);
        if (!L.isRealInstance) {
            return;
        }

        tryOpenInstanceInVrc(L.tag, props.shortname);
    }
</script>

<style scoped>
    .inline-block {
        display: inline-block;
    }
</style>
