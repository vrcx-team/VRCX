<template>
    <Dialog
        :open="isGroupBansImportDialogVisible"
        @update:open="
            (open) => {
                if (!open) closeDialog();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-162.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.group_member_moderation.import_bans') }}</DialogTitle>
            </DialogHeader>

            <div class="text-xs text-muted-foreground mb-2">
                <p>{{ t('dialog.group_member_moderation.import_bans_description') }}</p>
            </div>

            <Alert variant="warning" class="mb-2">
                <TriangleAlert />
                <AlertDescription>
                    {{ t('dialog.group_member_moderation.import_bans_warning') }}
                </AlertDescription>
            </Alert>

            <InputGroupTextareaField
                v-model="csvInput"
                :rows="10"
                :disabled="importing"
                class="mb-2"
                input-class="resize-none"
                :placeholder="t('dialog.group_member_moderation.import_bans_placeholder')" />

            <div class="flex items-center gap-2">
                <Button size="sm" :disabled="!csvInput.trim() || importing" @click="parseAndImport">
                    {{ t('dialog.group_member_moderation.import_bans_start') }}
                </Button>
                <Button v-if="importing" size="sm" variant="destructive" @click="cancelImport">
                    <Spinner />
                    {{ t('dialog.group_member_moderation.cancel') }}
                </Button>
            </div>

            <div v-if="importing" class="mt-2">
                <div class="flex justify-between text-sm mb-1">
                    <span>{{ t('dialog.group_member_moderation.progress') }}</span>
                    <strong>{{ progressCurrent }} / {{ progressTotal }}</strong>
                </div>
                <Progress :model-value="progressPercent" class="h-3" />
            </div>

            <template v-if="errors">
                <br />
                <Button size="sm" variant="secondary" @click="errors = ''">
                    {{ t('dialog.group_member_moderation.import_bans_clear_errors') }}
                </Button>
                <pre class="mt-1.5 text-xs" style="white-space: pre-wrap" v-text="errors"></pre>
            </template>

            <template v-if="resultMessage">
                <br />
                <span class="text-sm">{{ resultMessage }}</span>
            </template>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Alert, AlertDescription } from '@/components/ui/alert';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Progress } from '@/components/ui/progress';
    import { Spinner } from '@/components/ui/spinner';
    import { TriangleAlert } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { groupRequest } from '../../../api';

    import * as workerTimers from 'worker-timers';

    const { t } = useI18n();

    const props = defineProps({
        isGroupBansImportDialogVisible: {
            type: Boolean,
            default: false
        },
        groupId: {
            type: String,
            default: ''
        }
    });

    const emit = defineEmits(['update:isGroupBansImportDialogVisible', 'imported']);

    const csvInput = ref('');
    const importing = ref(false);
    const cancelled = ref(false);
    const progressCurrent = ref(0);
    const progressTotal = ref(0);
    const errors = ref('');
    const resultMessage = ref('');

    const progressPercent = computed(() =>
        progressTotal.value ? Math.min(100, Math.round((progressCurrent.value / progressTotal.value) * 100)) : 0
    );

    /**
     * Parse CSV input and extract user IDs.
     * Supports:
     * - Raw list of user IDs (one per line)
     * - CSV with header row containing a "userId" column
     * - Any column containing usr_ prefixed IDs
     * @param input
     */
    function extractUserIds(input) {
        const lines = input
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        if (lines.length === 0) return [];

        const userIdRegex = /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;

        // Try CSV with header: check if first line contains "userId"
        const firstLine = lines[0];
        const headers = firstLine.split(',').map((h) => h.trim());
        const userIdColIndex = headers.findIndex((h) => h.toLowerCase() === 'userid');

        if (userIdColIndex !== -1 && lines.length > 1) {
            // CSV mode: extract from specific column
            const ids = new Set();
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length > userIdColIndex) {
                    const val = cols[userIdColIndex].trim().replace(/^"|"$/g, '');
                    if (val.startsWith('usr_')) {
                        ids.add(val);
                    }
                }
            }
            return [...ids];
        }

        // Fallback: extract all usr_ IDs from entire input
        const ids = new Set();
        let match;
        while ((match = userIdRegex.exec(input)) !== null) {
            ids.add(match[0]);
        }
        return [...ids];
    }

    /**
     *
     */
    async function parseAndImport() {
        const userIds = extractUserIds(csvInput.value);
        if (userIds.length === 0) {
            errors.value = 'No valid user IDs found (usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)';
            return;
        }

        importing.value = true;
        cancelled.value = false;
        progressCurrent.value = 0;
        progressTotal.value = userIds.length;
        errors.value = '';
        resultMessage.value = '';
        let successCount = 0;

        for (let i = 0; i < userIds.length; i++) {
            if (cancelled.value) break;

            const userId = userIds[i];
            progressCurrent.value = i + 1;

            try {
                await groupRequest.banGroupMember({
                    groupId: props.groupId,
                    userId
                });
                successCount++;
            } catch (err) {
                errors.value += `${userId}: ${err}\n`;
            }

            // Rate limit delay between requests
            if (i < userIds.length - 1 && !cancelled.value) {
                await new Promise((resolve) => {
                    workerTimers.setTimeout(resolve, 1000);
                });
            }
        }

        resultMessage.value = cancelled.value
            ? `Cancelled. Banned ${successCount}/${progressCurrent.value} users.`
            : `Done. Banned ${successCount}/${userIds.length} users.`;

        importing.value = false;
        progressCurrent.value = 0;
        progressTotal.value = 0;

        if (successCount > 0) {
            emit('imported');
        }
    }

    /**
     *
     */
    function cancelImport() {
        cancelled.value = true;
    }

    /**
     *
     */
    function closeDialog() {
        if (importing.value) {
            cancelImport();
        }
        csvInput.value = '';
        errors.value = '';
        resultMessage.value = '';
        emit('update:isGroupBansImportDialogVisible', false);
    }
</script>
