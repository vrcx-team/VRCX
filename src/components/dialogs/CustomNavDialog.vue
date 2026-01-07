<template>
    <el-dialog
        :model-value="visible"
        class="custom-nav-dialog"
        :title="t('nav_menu.custom_nav.dialog_title')"
        width="600px"
        @close="handleClose"
        destroy-on-close>
        <div class="custom-nav-dialog__list" v-if="localLayout.length">
            <div
                v-for="(entry, index) in localLayout"
                :key="entry.key || entry.id"
                :class="['custom-nav-entry', `custom-nav-entry--${entry.type}`]">
                <template v-if="entry.type === 'item'">
                    <div class="custom-nav-entry__info">
                        <i :class="definitionsMap.get(entry.key)?.icon"></i>
                        <span>{{ t(definitionsMap.get(entry.key)?.labelKey || entry.key) }}</span>
                    </div>
                    <div class="custom-nav-entry__controls">
                        <div class="custom-nav-entry__move">
                            <el-button circle size="small" :disabled="index === 0" @click="handleMoveEntry(index, -1)">
                                <i class="ri-arrow-up-line"></i>
                            </el-button>
                            <el-button
                                circle
                                size="small"
                                :disabled="index === localLayout.length - 1"
                                @click="handleMoveEntry(index, 1)">
                                <i class="ri-arrow-down-line"></i>
                            </el-button>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="custom-nav-entry__folder-header">
                        <div class="custom-nav-entry__info">
                            <i :class="entry.icon || defaultFolderIcon"></i>
                            <span>{{ entry.name?.trim() || t('nav_menu.custom_nav.folder_name_placeholder') }}</span>
                        </div>
                        <div class="custom-nav-entry__actions">
                            <el-button size="small" plain @click="openFolderEditor(index)">
                                <i class="ri-edit-box-line"></i>
                                {{ t('nav_menu.custom_nav.edit_folder') }}
                            </el-button>
                            <div class="custom-nav-entry__move">
                                <el-button
                                    circle
                                    size="small"
                                    :disabled="index === 0"
                                    @click="handleMoveEntry(index, -1)">
                                    <i class="ri-arrow-up-line"></i>
                                </el-button>
                                <el-button
                                    circle
                                    size="small"
                                    :disabled="index === localLayout.length - 1"
                                    @click="handleMoveEntry(index, 1)">
                                    <i class="ri-arrow-down-line"></i>
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <div class="custom-nav-entry__folder-items">
                        <template v-if="entry.items?.length">
                            <Badge
                                v-for="key in entry.items"
                                :key="`${entry.id}-${key}`"
                                variant="outline"
                                class="custom-nav-entry__folder-tag">
                                {{ t(definitionsMap.get(key)?.labelKey || key) }}
                            </Badge>
                        </template>
                        <span v-else class="custom-nav-entry__folder-empty">
                            {{ t('nav_menu.custom_nav.folder_empty') }}
                        </span>
                    </div>
                </template>
            </div>
        </div>
        <el-alert
            v-if="invalidFolders.length"
            type="warning"
            :closable="false"
            :title="t('nav_menu.custom_nav.invalid_folder')" />
        <template #footer>
            <div class="custom-nav-dialog__footer">
                <div class="custom-nav-dialog__footer-left">
                    <el-button type="primary" plain @click="openFolderEditor()">
                        {{ t('nav_menu.custom_nav.add_folder') }}
                    </el-button>
                    <el-button type="warning" plain @click="handleReset">
                        {{ t('nav_menu.custom_nav.restore_default') }}
                    </el-button>
                </div>
                <div class="custom-nav-dialog__footer-right">
                    <el-button @click="handleClose">
                        {{ t('nav_menu.custom_nav.cancel') }}
                    </el-button>
                    <el-button type="primary" :disabled="isSaveDisabled" @click="handleSave">
                        {{ t('nav_menu.custom_nav.save') }}
                    </el-button>
                </div>
            </div>
        </template>
    </el-dialog>

    <el-dialog
        v-model="folderEditor.visible"
        class="folder-editor-dialog"
        :title="folderEditor.isEditing ? t('nav_menu.custom_nav.edit_folder') : t('nav_menu.custom_nav.add_folder')"
        width="900px"
        destroy-on-close>
        <div class="folder-editor">
            <div class="folder-editor__form">
                <el-input
                    v-model="folderEditor.data.name"
                    :placeholder="t('nav_menu.custom_nav.folder_name_placeholder')" />
                <IconPicker v-model="folderEditor.data.icon" class="folder-editor__icon-picker" />
            </div>
            <div class="folder-editor__lists">
                <div class="folder-editor__column">
                    <div class="folder-editor__column-title">
                        {{ t('nav_menu.custom_nav.folder_available') }}
                    </div>
                    <div v-if="!folderEditorAvailableItems.length" class="folder-editor__empty">
                        {{ t('nav_menu.custom_nav.folder_empty') }}
                    </div>
                    <el-scrollbar v-else always class="folder-editor__scroll">
                        <div v-for="item in folderEditorAvailableItems" :key="item.key" class="folder-editor__option">
                            <el-checkbox
                                :model-value="folderEditor.data.items.includes(item.key)"
                                @change="(val) => toggleFolderItem(item.key, val)">
                                <span class="folder-editor__option-label">
                                    <i :class="item.icon"></i>
                                    {{ t(item.labelKey) }}
                                </span>
                            </el-checkbox>
                        </div>
                    </el-scrollbar>
                </div>
                <div class="folder-editor__column folder-editor__column--selected">
                    <div class="folder-editor__column-title">
                        {{ t('nav_menu.custom_nav.folder_selected') }}
                    </div>
                    <div v-if="!folderEditor.data.items.length" class="folder-editor__empty">
                        {{ t('nav_menu.custom_nav.folder_selected_empty') }}
                    </div>
                    <div
                        v-for="(key, index) in folderEditor.data.items"
                        :key="`selected-${key}`"
                        class="folder-editor__selected-item">
                        <div class="folder-editor__selected-label">
                            <i :class="definitionsMap.get(key)?.icon"></i>
                            <span>{{ t(definitionsMap.get(key)?.labelKey || key) }}</span>
                        </div>
                        <div class="folder-editor__selected-actions">
                            <div class="custom-nav-entry__move">
                                <el-button
                                    circle
                                    size="small"
                                    :disabled="index === 0"
                                    @click="handleFolderItemMove(index, -1)">
                                    <i class="ri-arrow-up-line"></i>
                                </el-button>
                                <el-button
                                    circle
                                    size="small"
                                    :disabled="index === folderEditor.data.items.length - 1"
                                    @click="handleFolderItemMove(index, 1)">
                                    <i class="ri-arrow-down-line"></i>
                                </el-button>
                            </div>
                            <el-button size="small" text @click="toggleFolderItem(key, false)">
                                {{ t('nav_menu.custom_nav.remove_from_folder') }}
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="folder-editor__footer">
                <el-button
                    v-if="folderEditor.isEditing"
                    type="danger"
                    :disabled="!canDeleteFolder"
                    @click="handleFolderEditorDelete">
                    {{ t('nav_menu.custom_nav.delete_folder') }}
                </el-button>
                <div class="folder-editor__footer-spacer"></div>
                <el-button @click="closeFolderEditor">
                    {{ t('nav_menu.custom_nav.cancel') }}
                </el-button>
                <el-button type="primary" :disabled="folderEditorSaveDisabled" @click="handleFolderEditorSave">
                    {{ t('nav_menu.custom_nav.save') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { computed, reactive, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { Badge } from '../ui/badge';
    import { navDefinitions } from '../../shared/constants/ui.js';

    import IconPicker from '../IconPicker.vue';

    const props = defineProps({
        visible: {
            type: Boolean,
            default: false
        },
        layout: {
            type: Array,
            default: () => []
        },
        defaultFolderIcon: {
            type: String,
            default: 'ri-menu-fold-line'
        }
    });

    const emit = defineEmits(['update:visible', 'save', 'reset']);
    const { t } = useI18n();

    const cloneLayout = (source) => {
        if (!Array.isArray(source)) {
            return [];
        }
        return source.map((entry) => {
            if (entry?.type === 'folder') {
                return {
                    type: 'folder',
                    id: entry.id,
                    name: entry.name,
                    icon: entry.icon || props.defaultFolderIcon,
                    items: Array.isArray(entry.items) ? [...entry.items] : []
                };
            }
            return { type: 'item', key: entry.key };
        });
    };

    const localLayout = ref(cloneLayout(props.layout));

    const folderEditor = reactive({
        visible: false,
        isEditing: false,
        index: -1,
        data: {
            id: '',
            name: '',
            icon: '',
            items: []
        }
    });

    watch(
        () => props.visible,
        (visible) => {
            if (visible) {
                localLayout.value = cloneLayout(props.layout);
            }
        }
    );

    const definitionsMap = computed(() => {
        const map = new Map();
        navDefinitions.forEach((definition) => {
            if (definition?.key) {
                map.set(definition.key, definition);
            }
        });
        return map;
    });

    const folderEntries = computed(() => localLayout.value.filter((entry) => entry.type === 'folder'));

    const invalidFolders = computed(() =>
        folderEntries.value.filter((entry) => !entry.name?.trim() || entry.items?.length < 2)
    );

    const isSaveDisabled = computed(() => invalidFolders.value.length > 0);

    const handleMoveEntry = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= localLayout.value.length) {
            return;
        }
        const entries = [...localLayout.value];
        const [entry] = entries.splice(index, 1);
        entries.splice(targetIndex, 0, entry);
        localLayout.value = entries;
    };

    const folderEditorSaveDisabled = computed(() => {
        const nameInvalid = !folderEditor.data.name?.trim();
        const insufficientItems = folderEditor.data.items.length < 2;
        return nameInvalid || insufficientItems;
    });

    const canDeleteFolder = computed(() => {
        return localLayout.value[folderEditor.index]?.type === 'folder';
    });

    const usedKeysExcludingEditor = computed(() => {
        const set = new Set();
        localLayout.value.forEach((entry) => {
            if (entry.type !== 'folder') {
                return;
            }
            if (folderEditor.isEditing && entry.id === folderEditor.data.id) {
                return;
            }
            entry.items?.forEach((key) => set.add(key));
        });
        return set;
    });

    const folderEditorAvailableItems = computed(() =>
        navDefinitions.filter(
            (definition) =>
                !usedKeysExcludingEditor.value.has(definition.key) || folderEditor.data.items.includes(definition.key)
        )
    );

    const openFolderEditor = (index) => {
        const isEditing = index !== undefined && index !== null;
        folderEditor.isEditing = isEditing;
        folderEditor.index = isEditing ? index : -1;
        if (folderEditor.isEditing) {
            const entry = localLayout.value[index];
            folderEditor.data = {
                id: entry.id,
                name: entry.name,
                icon: entry.icon || props.defaultFolderIcon,
                items: Array.isArray(entry.items) ? [...entry.items] : []
            };
        } else {
            folderEditor.data = {
                id: `custom-folder-${dayjs().toISOString()}-${Math.random().toString().slice(2, 7)}`,
                name: '',
                icon: props.defaultFolderIcon,
                items: []
            };
        }
        folderEditor.visible = true;
    };

    const closeFolderEditor = () => {
        folderEditor.visible = false;
    };

    const toggleFolderItem = (key, enabled) => {
        if (enabled) {
            if (!folderEditor.data.items.includes(key)) {
                folderEditor.data.items.push(key);
            }
        } else {
            folderEditor.data.items = folderEditor.data.items.filter((item) => item !== key);
        }
    };

    const handleFolderItemMove = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= folderEditor.data.items.length) {
            return;
        }
        const items = [...folderEditor.data.items];
        const [item] = items.splice(index, 1);
        items.splice(targetIndex, 0, item);
        folderEditor.data.items = items;
    };

    const applyFolderChanges = () => {
        const sanitizedItems = folderEditor.data.items.filter((key) => definitionsMap.value.has(key));
        const entries = [...localLayout.value];

        if (folderEditor.isEditing) {
            const targetIndex = folderEditor.index;
            if (targetIndex < 0) {
                return;
            }
            const existing = entries[targetIndex];
            if (!existing || existing.type !== 'folder') {
                return;
            }
            const removedItems = existing.items.filter((key) => !sanitizedItems.includes(key));
            entries.splice(targetIndex, 1);

            const filteredEntries = entries.filter(
                (entry) => !(entry.type === 'item' && sanitizedItems.includes(entry.key))
            );

            filteredEntries.splice(targetIndex, 0, {
                type: 'folder',
                id: folderEditor.data.id,
                name: folderEditor.data.name.trim(),
                icon: folderEditor.data.icon || props.defaultFolderIcon,
                items: sanitizedItems
            });

            if (removedItems.length) {
                const insertItems = removedItems.map((key) => ({ type: 'item', key }));
                filteredEntries.splice(targetIndex + 1, 0, ...insertItems);
            }

            localLayout.value = filteredEntries;
            return;
        }

        const filteredEntries = entries.filter(
            (entry) => !(entry.type === 'item' && sanitizedItems.includes(entry.key))
        );

        filteredEntries.push({
            type: 'folder',
            id: folderEditor.data.id,
            name: folderEditor.data.name.trim(),
            icon: folderEditor.data.icon || props.defaultFolderIcon,
            items: sanitizedItems
        });

        localLayout.value = filteredEntries;
    };

    const handleFolderEditorSave = () => {
        if (folderEditorSaveDisabled.value) {
            return;
        }
        applyFolderChanges();
        closeFolderEditor();
    };

    const handleFolderEditorDelete = () => {
        if (!folderEditor.isEditing) {
            return;
        }
        const entries = [...localLayout.value];
        const targetIndex = folderEditor.index;
        if (targetIndex < 0) {
            return;
        }
        const folder = entries[targetIndex];
        if (!folder || folder.type !== 'folder') {
            return;
        }
        entries.splice(targetIndex, 1);
        const restoredItems = (folder.items || []).map((key) => ({ type: 'item', key }));
        entries.splice(targetIndex, 0, ...restoredItems);
        localLayout.value = entries;
        closeFolderEditor();
    };

    const handleSave = () => {
        if (isSaveDisabled.value) {
            return;
        }
        emit('save', cloneLayout(localLayout.value));
    };

    const handleReset = () => {
        emit('reset');
    };

    const handleClose = () => {
        emit('update:visible', false);
    };
</script>

<style scoped>
    .custom-nav-dialog__list {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        max-height: 430px;
        overflow-y: auto;
        padding-right: 4px;
    }

    .custom-nav-entry {
        border: 1px solid var(--el-border-color);
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 420px;
        width: 100%;
        margin: 0 auto;
    }

    .custom-nav-entry__info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
    }

    .custom-nav-entry__info i {
        font-size: 16px;
    }

    .custom-nav-entry__controls {
        display: flex;
        justify-content: flex-end;
    }

    .custom-nav-entry__move {
        display: flex;
        gap: 4px;
    }

    .custom-nav-entry__folder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .custom-nav-entry__actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .custom-nav-entry__folder-items {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .custom-nav-entry__folder-tag {
        margin: 0;
    }

    .custom-nav-entry__folder-empty {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    .custom-nav-dialog__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }

    .custom-nav-dialog__footer-left {
        display: flex;
        gap: 8px;
    }

    .custom-nav-dialog__footer-right {
        display: flex;
        gap: 8px;
    }

    .folder-editor__form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        margin-bottom: 12px;
    }

    .folder-editor__icon-picker {
        justify-self: end;
    }

    .folder-editor__lists {
        display: grid;
        grid-template-columns: minmax(220px, 0.9fr) minmax(260px, 1.1fr);
        gap: 12px;
    }

    .folder-editor__column {
        border: 1px solid var(--el-border-color);
        border-radius: 8px;
        padding: 10px;
        min-height: 220px;
        display: flex;
        flex-direction: column;
        background: var(--el-fill-color-blank);
    }

    .folder-editor__column-title {
        font-weight: 600;
        margin-bottom: 8px;
    }

    .folder-editor__empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        text-align: center;
    }

    .folder-editor__scroll {
        max-height: 240px;
    }

    .folder-editor__option {
        padding: 4px 0;
    }

    .folder-editor__option-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .folder-editor__option-label i {
        font-size: 14px;
    }

    .folder-editor__selected-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 0;
        border-bottom: 1px solid var(--el-border-color-light);
    }

    .folder-editor__selected-item:last-child {
        border-bottom: none;
    }

    .folder-editor__selected-label {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
    }

    .folder-editor__selected-label i {
        font-size: 14px;
    }

    .folder-editor__selected-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .folder-editor__column--selected {
        min-height: 260px;
    }

    .folder-editor__footer {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .folder-editor__footer-spacer {
        flex: 1;
    }
</style>
