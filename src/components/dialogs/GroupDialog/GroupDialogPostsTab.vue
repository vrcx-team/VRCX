<template>
    <template v-if="groupDialog.visible">
        <span style="margin-right: 8px; vertical-align: top"
            >{{ t('dialog.group.posts.posts_count') }} {{ groupDialog.posts.length }}</span
        >
        <InputGroupField
            v-model="groupDialog.postsSearch"
            clearable
            size="sm"
            :placeholder="t('dialog.group.posts.search_placeholder')"
            style="width: 89%; margin-bottom: 8px"
            @input="updateGroupPostSearch" />
        <div class="flex flex-wrap items-start">
            <div
                v-for="post in groupDialog.postsFiltered"
                :key="post.id"
                class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                <div class="flex-1 overflow-hidden">
                    <span style="display: block" v-text="post.title" />
                    <div v-if="post.imageUrl" style="display: inline-block; margin-right: 6px">
                        <div
                            class="cursor-pointer"
                            style="flex: none; width: 60px; height: 60px"
                            @click="showFullscreenImageDialog(post.imageUrl)">
                            <img
                                :src="post.imageUrl"
                                style="
                                    width: 60px;
                                    height: 60px;
                                    border-radius: var(--radius-md);
                                    object-fit: cover;
                                "
                                @error="
                                    $event.target.style.display = 'none';
                                    $event.target.nextElementSibling.style.display = 'flex';
                                "
                                loading="lazy" />
                            <div
                                class="items-center justify-center bg-muted"
                                style="width: 60px; height: 60px; border-radius: var(--radius-md); display: none">
                                <Image class="size-5 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                    <pre
                        class="text-xs font-[inherit]"
                        style="display: inline-block; vertical-align: top; white-space: pre-wrap; margin: 0"
                        >{{ post.text || '-' }}</pre
                    >
                    <br />
                    <div v-if="post.authorId" class="text-xs" style="float: right; margin-left: 6px">
                        <TooltipWrapper v-if="post.roleIds.length" side="top">
                            <template #content>
                                <span>{{ t('dialog.group.posts.visibility') }}</span>
                                <br />
                                <template v-for="roleId in post.roleIds" :key="roleId">
                                    <template v-for="role in groupDialog.ref.roles" :key="role.id + roleId"
                                        ><span v-if="role.id === roleId" v-text="role.name" />
                                    </template>
                                    <template v-if="post.roleIds.indexOf(roleId) < post.roleIds.length - 1"
                                        ><span>,&nbsp;</span></template
                                    >
                                </template>
                            </template>
                            <Eye style="margin-right: 6px" />
                        </TooltipWrapper>
                        <DisplayName :userid="post.authorId" style="margin-right: 6px" />
                        <span v-if="post.editorId" style="margin-right: 6px"
                            >({{ t('dialog.group.posts.edited_by') }} <DisplayName :userid="post.editorId" />)</span
                        >
                        <TooltipWrapper side="bottom">
                            <template #content>
                                <span
                                    >{{ t('dialog.group.posts.created_at') }}
                                    {{ formatDateFilter(post.createdAt, 'long') }}</span
                                >
                                <template v-if="post.updatedAt !== post.createdAt">
                                    <br />
                                    <span
                                        >{{ t('dialog.group.posts.edited_at') }}
                                        {{ formatDateFilter(post.updatedAt, 'long') }}</span
                                    >
                                </template>
                            </template>
                            <Timer :epoch="Date.parse(post.updatedAt)" />
                        </TooltipWrapper>
                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                            <TooltipWrapper side="top" :content="t('dialog.group.posts.edit_tooltip')">
                                <Button
                                    size="icon-sm"
                                    class="h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                                    variant="ghost"
                                    @click="showGroupPostEditDialog(groupDialog.id, post)"
                                    ><Pencil class="h-4 w-4" />
                                </Button>
                            </TooltipWrapper>
                            <TooltipWrapper side="top" :content="t('dialog.group.posts.delete_tooltip')">
                                <Button
                                    size="icon-sm"
                                    class="h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                                    variant="ghost"
                                    @click="confirmDeleteGroupPost(post)"
                                    ><Trash2 class="h-4 w-4" />
                                </Button>
                            </TooltipWrapper>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </template>
</template>

<script setup>
    import { Eye, Image, Pencil, Trash2 } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { formatDateFilter, hasGroupPermission } from '../../../shared/utils';
    import { useGalleryStore, useGroupStore } from '../../../stores';

    defineProps({
        showGroupPostEditDialog: {
            type: Function,
            required: true
        },
        confirmDeleteGroupPost: {
            type: Function,
            required: true
        }
    });

    const { t } = useI18n();

    const { groupDialog } = storeToRefs(useGroupStore());
    const { updateGroupPostSearch } = useGroupStore();
    const { showFullscreenImageDialog } = useGalleryStore();
</script>
