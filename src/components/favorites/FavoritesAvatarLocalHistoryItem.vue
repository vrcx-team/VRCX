<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <div class="avatar">
                <img v-lazy="favorite.thumbnailImageUrl" />
            </div>
            <div class="detail">
                <span class="name" v-text="favorite.name"></span>
                <span class="extra" v-text="favorite.authorName"></span>
            </div>
            <el-tooltip placement="left" :content="$t('view.favorite.select_avatar_tooltip')" :disabled="hideTooltips">
                <el-button
                    :disabled="API.currentUser.currentAvatar === favorite.id"
                    size="mini"
                    icon="el-icon-check"
                    circle
                    style="margin-left: 5px"
                    @click.stop="selectAvatarWithConfirmation"></el-button>
            </el-tooltip>
            <template v-if="API.cachedFavoritesByObjectId.has(favorite.id)">
                <el-tooltip placement="right" content="Unfavorite" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
            <template v-else>
                <el-tooltip placement="right" content="Favorite" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        icon="el-icon-star-off"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'FavoritesAvatarLocalHistoryItem',
        inject: ['API'],
        props: {
            favorite: {
                type: Object,
                required: true
            },
            hideTooltips: Boolean
        },
        methods: {
            selectAvatarWithConfirmation() {
                this.$emit('select-avatar-with-confirmation', this.favorite.id);
            },
            showFavoriteDialog() {
                this.$emit('show-favorite-dialog', 'avatar', this.favorite.id);
            }
        }
    };
</script>
