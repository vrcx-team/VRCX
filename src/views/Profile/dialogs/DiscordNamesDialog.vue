<template>
    <safe-dialog
        class="x-dialog"
        :visible="discordNamesDialogVisible"
        :title="t('dialog.discord_names.header')"
        width="650px"
        @close="closeDialog">
        <div style="font-size: 12px">
            {{ t('dialog.discord_names.description') }}
        </div>
        <el-input
            v-model="discordNamesContent"
            type="textarea"
            size="mini"
            rows="15"
            resize="none"
            readonly
            style="margin-top: 15px" />
    </safe-dialog>
</template>

<script setup>
    import { ref, watch, inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';

    const API = inject('API');

    const { t } = useI18n();

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
        const { friends } = API.currentUser;
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
            const { ref } = props.friends.get(userId);
            let discord = '';
            if (typeof ref === 'undefined') {
                continue;
            }
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
