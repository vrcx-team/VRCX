import { computed } from 'vue';
import {
    commaNumber,
    compareUnityVersion,
    formatDateFilter,
    timeToText
} from '../../../shared/utils';
import { database } from '../../../services/database';

/**
 * Composable for WorldDialogInfoTab computed properties and actions.
 * @param {import('vue').Ref} worldDialog - reactive ref to the world dialog state
 * @param {object} deps - external dependencies
 * @param {Function} deps.t - i18n translation function
 * @param {Function} deps.toast - toast notification function
 * @param deps.sdkUnityVersion
 * @returns {object} info composable API
 */
export function useWorldDialogInfo(worldDialog, { t, toast, sdkUnityVersion }) {
    const memo = computed({
        get() {
            return worldDialog.value.memo;
        },
        set(value) {
            worldDialog.value.memo = value;
        }
    });

    const isTimeInLabVisible = computed(() => {
        return (
            worldDialog.value.ref.publicationDate &&
            worldDialog.value.ref.publicationDate !== 'none' &&
            worldDialog.value.ref.labsPublicationDate &&
            worldDialog.value.ref.labsPublicationDate !== 'none'
        );
    });

    const timeInLab = computed(() => {
        return timeToText(
            new Date(worldDialog.value.ref.publicationDate).getTime() -
                new Date(worldDialog.value.ref.labsPublicationDate).getTime()
        );
    });

    const favoriteRate = computed(() => {
        return (
            Math.round(
                (((worldDialog.value.ref?.favorites -
                    worldDialog.value.ref?.visits) /
                    worldDialog.value.ref?.visits) *
                    100 +
                    100) *
                    100
            ) / 100
        );
    });

    const worldTags = computed(() => {
        return worldDialog.value.ref?.tags
            .filter((tag) => tag.startsWith('author_tag'))
            .map((tag) => tag.replace('author_tag_', ''))
            .join(', ');
    });

    const timeSpent = computed(() => {
        return timeToText(worldDialog.value.timeSpent);
    });

    const worldDialogPlatform = computed(() => {
        const { ref } = worldDialog.value;
        const platforms = [];
        if (ref.unityPackages) {
            for (const unityPackage of ref.unityPackages) {
                if (
                    !compareUnityVersion(
                        unityPackage.unitySortNumber,
                        sdkUnityVersion
                    )
                ) {
                    continue;
                }
                let platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Android';
                } else if (unityPackage.platform) {
                    platform = unityPackage.platform;
                }
                platforms.unshift(`${platform}/${unityPackage.unityVersion}`);
            }
        }
        return platforms.join(', ');
    });

    const worldDialogPlatformCreatedAt = computed(() => {
        const { ref } = worldDialog.value;
        if (!ref.unityPackages) {
            return null;
        }
        let newest = {};
        for (const unityPackage of ref.unityPackages) {
            if (
                unityPackage.variant &&
                unityPackage.variant !== 'standard' &&
                unityPackage.variant !== 'security'
            ) {
                continue;
            }
            const platform = unityPackage.platform;
            const createdAt = unityPackage.created_at;
            if (
                !newest[platform] ||
                new Date(createdAt) > new Date(newest[platform])
            ) {
                newest[platform] = createdAt;
            }
        }
        return newest;
    });

    /**
     *
     */
    function onWorldMemoChange() {
        const worldId = worldDialog.value.id;
        const memo = worldDialog.value.memo;
        if (memo) {
            database.setWorldMemo({
                worldId,
                editedAt: new Date().toJSON(),
                memo
            });
        } else {
            database.deleteWorldMemo(worldId);
        }
    }

    /**
     *
     */
    function copyWorldId() {
        navigator.clipboard
            .writeText(worldDialog.value.id)
            .then(() => {
                toast.success(t('message.world.id_copied'));
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error(t('message.copy_failed'));
            });
    }

    /**
     *
     */
    function copyWorldUrl() {
        navigator.clipboard
            .writeText(`https://vrchat.com/home/world/${worldDialog.value.id}`)
            .then(() => {
                toast.success(t('message.world.url_copied'));
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error(t('message.copy_failed'));
            });
    }

    /**
     *
     */
    function copyWorldName() {
        navigator.clipboard
            .writeText(worldDialog.value.ref.name)
            .then(() => {
                toast.success(t('message.world.name_copied'));
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error(t('message.copy_failed'));
            });
    }

    return {
        memo,
        isTimeInLabVisible,
        timeInLab,
        favoriteRate,
        worldTags,
        timeSpent,
        worldDialogPlatform,
        worldDialogPlatformCreatedAt,
        onWorldMemoChange,
        copyWorldId,
        copyWorldUrl,
        copyWorldName,
        commaNumber,
        formatDateFilter
    };
}
