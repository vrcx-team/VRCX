<template>
    <Dialog v-model:open="isVisible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.export_own_avatars.header') }}</DialogTitle>
            </DialogHeader>
            <div class="mt-4 flex items-center justify-between text-xs">
                <span class="name mr-6">{{ t('dialog.export_own_avatars.public_only') }}</span>
                <Switch v-model="publicOnly" />
            </div>
            <InputGroupTextareaField
                :model-value="exportAvatarsListCsv"
                :rows="15"
                readonly
                input-class="resize-none mt-2"
                @click="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAvatarStore, useUserStore } from '../../../stores';
    import { applyAvatar, removeAvatarFromCache } from '../../../coordinators/avatarCoordinator';
    import { avatarRequest } from '../../../api';
    import { processBulk } from '../../../services/request';
    import { Switch } from '../../../components/ui/switch';

    const { t } = useI18n();

    const { cachedAvatars } = useAvatarStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        isExportAvatarsListDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const avatars = ref([]);
    const publicOnly = ref(false);
    const loading = ref(false);

    function escapeCsv(str) {
        // oxlint-disable-next-line no-control-regex
        if (/[\x00-\x1f,"]/.test(str) === true) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    const exportAvatarsListCsv = computed(() => {
        const lines = ['AvatarID,AvatarName'];
        for (const avatar of avatars.value) {
            if (publicOnly.value && avatar.releaseStatus !== 'public') {
                continue;
            }
            lines.push(`${escapeCsv(avatar.id)},${escapeCsv(avatar.name)}`);
        }
        return lines.join('\n');
    });

    const isVisible = computed({
        get() {
            return props.isExportAvatarsListDialogVisible;
        },
        set(value) {
            emit('update:isExportAvatarsListDialogVisible', value);
        }
    });

    const emit = defineEmits(['update:isExportAvatarsListDialogVisible']);

    watch(
        () => props.isExportAvatarsListDialogVisible,
        (value) => {
            if (value) {
                initExportAvatarsListDialog();
            }
        }
    );

    function initExportAvatarsListDialog() {
        loading.value = true;
        for (const ref of cachedAvatars.values()) {
            if (ref.authorId === currentUser.value.id) {
                removeAvatarFromCache(ref.id);
            }
        }
        const params = {
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            releaseStatus: 'all',
            user: 'me'
        };
        const map = new Map();
        processBulk({
            fn: avatarRequest.getAvatars,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    const ref = applyAvatar(json);
                    map.set(ref.id, ref);
                }
            },
            done: () => {
                avatars.value = Array.from(map.values());
                loading.value = false;
            }
        });
    }
</script>
