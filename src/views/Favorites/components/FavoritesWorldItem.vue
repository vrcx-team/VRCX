<template>
    <div @click="$emit('click')" :style="{ display: 'inline-block', width: '300px', marginRight: '15px' }">
        <div class="x-friend-item">
            <template v-if="isLocalFavorite ? favorite.name : favorite.ref">
                <div class="avatar">
                    <img v-lazy="smallThumbnail" />
                </div>
                <div class="detail">
                    <span class="name" v-once>{{ localFavFakeRef.name }}</span>
                    <span v-if="localFavFakeRef.occupants" class="extra" v-once
                        >{{ localFavFakeRef.authorName }} ({{ localFavFakeRef.occupants }})</span
                    >
                    <span v-else class="extra" v-once>{{ localFavFakeRef.authorName }}</span>
                </div>
                <template v-if="editFavoritesMode">
                    <el-dropdown trigger="click" size="mini" style="margin-left: 5px" @click.native.stop>
                        <el-tooltip
                            placement="left"
                            :content="$t(localFavFakeRef ? 'view.favorite.copy_tooltip' : 'view.favorite.move_tooltip')"
                            :disabled="hideTooltips">
                            <el-button type="default" icon="el-icon-back" size="mini" circle></el-button>
                        </el-tooltip>
                        <el-dropdown-menu slot="dropdown">
                            <template v-for="groupAPI in favoriteWorldGroups">
                                <el-dropdown-item
                                    v-if="isLocalFavorite || groupAPI.name !== group.name"
                                    :key="groupAPI.name"
                                    style="display: block; margin: 10px 0"
                                    :disabled="groupAPI.count >= groupAPI.capacity"
                                    @click.native="handleDropdownItemClick(groupAPI)">
                                    {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                                </el-dropdown-item>
                            </template>
                        </el-dropdown-menu>

                        <el-button v-if="!isLocalFavorite" type="text" size="mini" @click.stop style="margin-left: 5px">
                            <el-checkbox v-model="isSelected"></el-checkbox>
                        </el-button>
                    </el-dropdown>
                </template>
                <template v-else>
                    <el-tooltip
                        v-if="!isLocalFavorite && favorite.deleted"
                        placement="left"
                        :content="$t('view.favorite.unavailable_tooltip')">
                        <i class="el-icon-warning" style="color: #f56c6c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip
                        v-if="!isLocalFavorite && favorite.ref.releaseStatus === 'private'"
                        placement="left"
                        :content="$t('view.favorite.private')">
                        <i class="el-icon-warning" style="color: #e6a23c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip placement="left" :disabled="hideTooltips">
                        <template #content>
                            {{
                                canOpenInstanceInGame()
                                    ? $t('dialog.world.actions.new_instance_and_open_ingame')
                                    : $t('dialog.world.actions.new_instance_and_self_invite')
                            }}
                        </template>
                        <el-button
                            size="mini"
                            icon="el-icon-message"
                            style="margin-left: 5px"
                            @click.stop="newInstanceSelfInvite(favorite.id)"
                            circle></el-button>
                    </el-tooltip>
                    <el-tooltip
                        v-if="!isLocalFavorite"
                        placement="right"
                        :content="$t('view.favorite.unfavorite_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            v-if="shiftHeld"
                            size="mini"
                            icon="el-icon-close"
                            circle
                            style="color: #f56c6c; margin-left: 5px"
                            @click.stop="deleteFavorite(favorite.id)"></el-button>
                        <el-button
                            v-else
                            icon="el-icon-star-on"
                            size="mini"
                            circle
                            style="margin-left: 5px"
                            type="default"
                            @click.stop="showFavoriteDialog('world', favorite.id)"></el-button>
                    </el-tooltip>
                </template>
                <el-tooltip
                    v-if="isLocalFavorite"
                    placement="right"
                    :content="$t('view.favorite.unfavorite_tooltip')"
                    :disabled="hideTooltips">
                    <el-button
                        v-if="shiftHeld"
                        size="mini"
                        icon="el-icon-close"
                        circle
                        style="color: #f56c6c; margin-left: 5px"
                        @click.stop="$emit('remove-local-world-favorite', favorite.id, group)"></el-button>
                    <el-button
                        v-else
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        type="default"
                        @click.stop="showFavoriteDialog('world', favorite.id)"></el-button>
                </el-tooltip>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail">
                    <span v-once>{{ favorite.name || favorite.id }}</span>
                    <el-tooltip
                        v-if="!isLocalFavorite && favorite.deleted"
                        placement="left"
                        :content="$t('view.favorite.unavailable_tooltip')">
                        <i class="el-icon-warning" style="color: #f56c6c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-button
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        style="margin-left: 5px"
                        @click.stop="handleDeleteFavorite"></el-button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed, getCurrentInstance } from 'vue';
    import { favoriteRequest } from '../../../api';
    import {
        useAppearanceSettingsStore,
        useFavoriteStore,
        useInviteStore,
        useUiStore,
        useGameStore
    } from '../../../stores';

    const props = defineProps({
        group: [Object, String],
        favorite: Object,
        editFavoritesMode: Boolean,
        isLocalFavorite: { type: Boolean, default: false }
    });

    const emit = defineEmits(['handle-select', 'remove-local-world-favorite', 'click']);
    const { proxy } = getCurrentInstance();

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { favoriteWorldGroups } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { newInstanceSelfInvite } = useInviteStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { canOpenInstanceInGame } = useInviteStore();

    const isSelected = computed({
        get: () => props.favorite.$selected,
        set: (value) => emit('handle-select', value)
    });

    const localFavFakeRef = computed(() => (props.isLocalFavorite ? props.favorite : props.favorite.ref));

    const smallThumbnail = computed(() => {
        const url = localFavFakeRef.value.thumbnailImageUrl.replace('256', '128');
        return url || localFavFakeRef.value.thumbnailImageUrl;
    });

    function handleDropdownItemClick(groupAPI) {
        if (props.isLocalFavorite) {
            addFavoriteWorld(localFavFakeRef.value, groupAPI, true);
        } else {
            moveFavorite(localFavFakeRef.value, groupAPI, 'world');
        }
    }

    function handleDeleteFavorite() {
        if (props.isLocalFavorite) {
            emit('remove-local-world-favorite', props.favorite.id, props.group);
        } else {
            deleteFavorite(props.favorite.id);
        }
    }

    function moveFavorite(refObj, group, type) {
        favoriteRequest.deleteFavorite({ objectId: refObj.id }).then(() => {
            favoriteRequest.addFavorite({
                type,
                favoriteId: refObj.id,
                tags: group.name
            });
        });
    }

    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }

    function addFavoriteWorld(refObj, group, message) {
        return favoriteRequest
            .addFavorite({
                type: 'world',
                favoriteId: refObj.id,
                tags: group.name
            })
            .then((args) => {
                if (message) {
                    proxy.$message({ message: 'World added to favorites', type: 'success' });
                }
                return args;
            });
    }
</script>
