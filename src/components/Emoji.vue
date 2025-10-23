<template>
    <div style="overflow: hidden" :style="{ width: size + 'px', height: size + 'px' }">
        <div
            v-if="image.frames"
            class="avatar"
            :style="generateEmojiStyle(imageUrl, image.framesOverTime, image.frames, image.loopStyle, size)"></div>
        <img v-else :src="imageUrl" class="avatar" :style="{ width: size + 'px', height: size + 'px' }" />
    </div>
</template>

<script setup>
    import { onMounted, ref, watch } from 'vue';

    import { extractFileId, generateEmojiStyle } from '../shared/utils';
    import { useGalleryStore } from '../stores';

    const { getCachedEmoji } = useGalleryStore();
    const { emojiTable } = useGalleryStore();

    const props = defineProps({
        imageUrl: { type: String, default: '' },
        size: { type: Number, default: 100 }
    });

    const image = ref({
        frames: null,
        framesOverTime: null,
        loopStyle: null,
        versions: []
    });

    async function update() {
        const fileId = extractFileId(props.imageUrl);
        for (const emoji of emojiTable) {
            if (emoji.id === fileId) {
                image.value = emoji;
                return;
            }
        }
        image.value = await getCachedEmoji(fileId);
    }

    watch(() => props.imageUrl, update);

    onMounted(() => {
        update();
    });
</script>
