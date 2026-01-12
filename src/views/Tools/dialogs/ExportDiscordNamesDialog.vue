<template>
    <el-dialog
        class="x-dialog"
        :model-value="discordNamesDialogVisible"
        :title="t('dialog.discord_names.header')"
        width="650px"
        @close="closeDialog">
        <div style="font-size: 12px">
            {{ t('dialog.discord_names.description') }}
        </div>
        <InputGroupTextareaField
            v-model="discordNamesContent"
            :rows="15"
            readonly
            style="margin-top: 15px"
            input-class="resize-none" />
    </el-dialog>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { useI18n } from 'vue-i18n';

    import { useUserStore } from '../../../stores';

    const { t } = useI18n();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        discordNamesDialogVisible: {
            type: Boolean,
            default: false
        },
        friends: {
            type: Map,
            default: () => new Map()
        }
    });

    watch(
        () => props.discordNamesDialogVisible,
        (newVal) => {
            if (newVal) {
                showDiscordNamesContent();
            }
        }
    );

    const emit = defineEmits(['update:discordNamesDialogVisible']);

    const discordNamesContent = ref('');

    function showDiscordNamesContent() {
        const { friends } = currentUser.value;
        if (Array.isArray(friends) === false) {
            return;
        }
        const lines = ['DisplayName,DiscordName'];
        const _ = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        for (const userId of friends) {
            let discord = '';
            const friend = props.friends.get(userId);
            if (typeof friend?.ref === 'undefined') {
                continue;
            }
            const ref = friend.ref;
            const name = ref.displayName;
            if (ref.statusDescription) {
                const statusRegex = /(?:discord|dc|dis)(?: |=|:|˸|;)(.*)/gi.exec(ref.statusDescription);
                if (statusRegex) {
                    discord = statusRegex[1];
                }
            }
            if (!discord && ref.bio) {
                const bioRegex = /(?:discord|dc|dis)(?: |=|:|˸|;)(.*)/gi.exec(ref.bio);
                if (bioRegex) {
                    discord = bioRegex[1];
                }
            }
            if (!discord) {
                continue;
            }
            discord = discord.trim();
            lines.push(`${_(name)},${_(discord)}`);
        }
        discordNamesContent.value = lines.join('\n');
    }

    function closeDialog() {
        emit('update:discordNamesDialogVisible', false);
    }
</script>

<style scoped></style>
