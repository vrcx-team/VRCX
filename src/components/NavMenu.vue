<template>
    <el-menu
        ref="navRef"
        collapse
        @select="$emit('select', $event)"
        :default-active="menuActiveIndex"
        :collapse-transition="false">
        <el-menu-item index="feed">
            <i class="el-icon-news"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.feed') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="gameLog">
            <i class="el-icon-s-data"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.game_log') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="playerList">
            <i class="el-icon-tickets"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.player_list') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="search">
            <i class="el-icon-search"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.search') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="favorite">
            <i class="el-icon-star-off"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.favorites') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="friendLog">
            <i class="el-icon-notebook-2"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.friend_log') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="moderation">
            <i class="el-icon-finished"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.moderation') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="notification">
            <i class="el-icon-bell"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.notification') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="friendList">
            <i class="el-icon-s-management"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.friend_list') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="charts">
            <i class="el-icon-data-analysis"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.charts') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="profile">
            <i class="el-icon-user"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.profile') }}</span>
            </template>
        </el-menu-item>

        <el-menu-item index="settings">
            <i class="el-icon-s-tools"></i>
            <template slot="title">
                <span>{{ $t('nav_tooltip.settings') }}</span>
            </template>
        </el-menu-item>
    </el-menu>
</template>

<script>
    export default {
        name: 'NavMenu',
        props: {
            menuActiveIndex: {
                type: String,
                default: 'feed'
            }
        }
    };
</script>
