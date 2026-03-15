<template>
    <Button
        class="rounded-full"
        variant="ghost"
        size="icon-sm"
        :disabled="isGroupGalleryLoading"
        @click="getGroupGalleries">
        <Spinner v-if="isGroupGalleryLoading" />
        <RefreshCw v-else />
    </Button>
    <TabsUnderline
        v-model="groupDialogGalleryCurrentName"
        :items="groupGalleryTabs"
        :unmount-on-hide="false"
        class="mt-2.5">
        <template
            v-for="(gallery, index) in groupDialog.ref.galleries"
            :key="`label-${index}`"
            v-slot:[`label-${index}`]>
            <span class="text-base font-bold" v-text="gallery.name" />
            <i class="x-status-icon" style="margin-left: 6px" :class="groupGalleryStatus(gallery)" />
            <span class="text-muted-foreground text-xs ml-1.5">{{
                groupDialog.galleries[gallery.id] ? groupDialog.galleries[gallery.id].length : 0
            }}</span>
        </template>
        <template
            v-for="(gallery, index) in groupDialog.ref.galleries"
            :key="`content-${index}`"
            v-slot:[String(index)]>
            <span class="text-muted-foreground" style="padding: 8px" v-text="gallery.description" />
            <div
                style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                    margin-top: 8px;
                    max-height: 600px;
                    overflow-y: auto;
                ">
                <Card
                    v-for="image in groupDialog.galleries[gallery.id]"
                    :key="image.id"
                    class="p-0 overflow-hidden transition-shadow hover:shadow-md">
                    <div class="cursor-pointer" @click="showFullscreenImageDialog(image.imageUrl)">
                        <img
                            :src="image.imageUrl"
                            :class="['max-w-full', 'max-h-full']"
                            @error="
                                $event.target.style.display = 'none';
                                $event.target.nextElementSibling.style.display = 'flex';
                            "
                            loading="lazy" />
                        <div
                            class="hidden h-[200px] w-full items-center justify-center bg-muted"
                            style="display: none">
                            <Image class="size-8 text-muted-foreground" />
                        </div>
                    </div>
                </Card>
            </div>
        </template>
    </TabsUnderline>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { Card } from '@/components/ui/card';
    import { Image, RefreshCw } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';

    import { useGalleryStore, useGroupStore } from '../../../stores';
    import { useGroupGalleries } from './useGroupGalleries';

    const { groupDialog } = storeToRefs(useGroupStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    const {
        isGroupGalleryLoading,
        groupDialogGalleryCurrentName,
        groupGalleryTabs,
        groupGalleryStatus,
        getGroupGalleries
    } = useGroupGalleries(groupDialog);

    defineExpose({
        getGroupGalleries
    });
</script>
