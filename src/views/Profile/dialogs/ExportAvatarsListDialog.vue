<template>
    <safe-dialog :visible.sync="isVisible" :title="t('dialog.export_own_avatars.header')" width="650px">
        <el-input
            v-model="exportAvatarsListCsv"
            v-loading="loading"
            type="textarea"
            size="mini"
            rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click.native="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
    </safe-dialog>
</template>

<script setup>
    import { ref, computed, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { storeToRefs } from 'pinia';
    import { avatarRequest } from '../../../api';
    import { processBulk } from '../../../service/request';
    import { useAvatarStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

    const { cachedAvatars } = storeToRefs(useAvatarStore());
    const { applyAvatar } = useAvatarStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        isExportAvatarsListDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const exportAvatarsListCsv = ref('');
    const loading = ref(false);

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
        for (const ref of cachedAvatars.value.values()) {
            if (ref.authorId === currentUser.value.id) {
                cachedAvatars.value.delete(ref.id);
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
                const avatars = Array.from(map.values());
                if (Array.isArray(avatars) === false) {
                    return;
                }
                const lines = ['AvatarID,AvatarName'];
                const _ = function (str) {
                    if (/[\x00-\x1f,"]/.test(str) === true) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };
                for (const avatar of avatars) {
                    lines.push(`${_(avatar.id)},${_(avatar.name)}`);
                }
                exportAvatarsListCsv.value = lines.join('\n');
                loading.value = false;
            }
        });
    }
</script>
