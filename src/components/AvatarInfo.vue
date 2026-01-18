<template>
    <div @click="confirm" class="cursor-pointer w-fit align-top flex items-center">
        <span class="flex items-center"
            >{{ avatarName }} <Lock v-if="avatarType && avatarType === '(own)'" class="h-4 w-4 mx-1"
        /></span>
        <span v-if="avatarTags" style="font-size: 12px">{{ avatarTags }}</span>
    </div>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { Lock } from 'lucide-vue-next';

    import { useAvatarStore } from '../stores';

    const avatarStore = useAvatarStore();

    const props = defineProps({
        imageurl: String,
        userid: String,
        hintownerid: String,
        hintavatarname: [String, Object],
        avatartags: Array
    });

    const avatarName = ref('');
    const avatarType = ref('');
    const avatarTags = ref('');
    let ownerId = '';

    const parse = async () => {
        ownerId = '';
        avatarName.value = '';
        avatarType.value = '';
        avatarTags.value = '';

        if (!props.imageurl) {
            avatarName.value = '';
        } else if (props.hintownerid) {
            if (typeof props.hintavatarname === 'string') {
                avatarName.value = props.hintavatarname;
            }
            ownerId = props.hintownerid;
        } else {
            try {
                const info = await avatarStore.getAvatarName(props.imageurl);
                avatarName.value = info.avatarName;
                ownerId = info.ownerId;
            } catch {
                console.error('Failed to fetch avatar name');
            }
        }

        if (typeof props.userid === 'undefined' || !ownerId) {
            avatarType.value = '';
        } else if (ownerId === props.userid) {
            avatarType.value = '(own)';
        } else {
            avatarType.value = '(public)';
        }

        if (Array.isArray(props.avatartags)) {
            avatarTags.value = props.avatartags.map((tag) => String(tag).replace('content_', '')).join(', ');
        }
    };

    const confirm = () => {
        if (!props.imageurl) return;
        avatarStore.showAvatarAuthorDialog(props.userid, ownerId, props.imageurl);
    };

    watch([() => props.imageurl, () => props.userid, () => props.avatartags], parse, { immediate: true });
</script>
