<template>
    <div @click="confirm" class="avatar-info">
        <span style="margin-right: 5px">{{ avatarName }}</span>
        <span v-if="avatarType" :class="color" style="margin-right: 5px"><i :class="avatarTypeIcons" /></span>
        <span v-if="avatarTags" style="color: #909399; font-family: monospace; font-size: 12px">{{ avatarTags }}</span>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';

    import { useAvatarStore } from '../stores';

    const avatarStore = useAvatarStore();

    const props = defineProps({
        imageurl: String,
        userid: String,
        hintownerid: String,
        hintavatarname: String,
        avatartags: Array
    });

    const avatarName = ref('');
    const avatarType = ref('');
    const avatarTags = ref('');
    const color = ref('');
    let ownerId = '';

    const avatarTypeIcons = computed(() => {
        return avatarType.value === '(own)'
            ? 'ri-lock-line'
            : avatarType.value === '(public)'
              ? 'ri-lock-unlock-line'
              : '';
    });

    const parse = async () => {
        ownerId = '';
        avatarName.value = '';
        avatarType.value = '';
        color.value = '';
        avatarTags.value = '';

        if (!props.imageurl) {
            avatarName.value = '';
        } else if (props.hintownerid) {
            avatarName.value = props.hintavatarname;
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
            color.value = '';
            avatarType.value = '';
        } else if (ownerId === props.userid) {
            color.value = 'avatar-info-own';
            avatarType.value = '(own)';
        } else {
            color.value = 'avatar-info-public';
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
