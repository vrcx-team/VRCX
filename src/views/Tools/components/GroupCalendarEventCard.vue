<template>
    <el-card :body-style="{ padding: '0px' }" class="event-card" :class="cardClass">
        <img :src="bannerUrl" class="banner" />
        <div class="event-content">
            <div class="event-title">
                <div v-if="showGroupName" class="event-group-name" @click="onGroupClick">
                    {{ groupName }}
                </div>
                <el-popover placement="right" width="500" trigger="hover">
                    <el-descriptions :title="event.title" size="small" :column="2" class="event-title-popover">
                        <template #extra>
                            <div>
                                {{ formatTimeRange(event.startsAt, event.endsAt) }}
                            </div>
                        </template>

                        <el-descriptions-item label="Category">{{
                            capitalizeFirst(event.category)
                        }}</el-descriptions-item>
                        <el-descriptions-item label="Interested User">
                            {{ event.interestedUserCount }}
                        </el-descriptions-item>
                        <el-descriptions-item label="Close Instance After End">
                            {{ event.closeInstanceAfterEndMinutes + ' min' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="Created Date">{{
                            dayjs(event.createdAt).format('YYYY-MM-DD HH:mm')
                        }}</el-descriptions-item>
                        <el-descriptions-item label="Description">{{ event.description }}</el-descriptions-item>
                    </el-descriptions>
                    <div class="event-title-content" slot="reference" @click="onGroupClick">
                        {{ event.title }}
                    </div>
                </el-popover>
            </div>
            <div class="event-info">
                <div :class="timeClass">
                    {{ formattedTime }}
                </div>
                <div>
                    {{ capitalizeFirst(event.accessType) }}
                </div>
            </div>
        </div>
        <div v-if="isFollowing" class="following-badge">
            <i class="el-icon-check"></i>
        </div>
    </el-card>
</template>

<script setup>
    import { computed } from 'vue';
    import dayjs from 'dayjs';
    import { storeToRefs } from 'pinia';
    import { useGroupStore } from '../../../stores';

    const { cachedGroups } = storeToRefs(useGroupStore());
    const { showGroupDialog } = useGroupStore();

    const props = defineProps({
        event: {
            type: Object,
            required: true
        },
        mode: {
            type: String,
            required: true,
            // @ts-ignore
            validator: (value) => ['timeline', 'grid'].includes(value)
        },
        isFollowing: {
            type: Boolean,
            default: false
        },
        cardClass: {
            type: [String, Object, Array],
            default: ''
        }
    });

    const showGroupName = computed(() => props.mode === 'timeline');

    const timeClass = computed(() => (props.mode === 'grid' ? 'event-time' : ''));

    const bannerUrl = computed(() => {
        if (!props.event) return '';
        if (props.event.imageUrl) {
            return props.event.imageUrl;
        } else {
            return cachedGroups.value.get(props.event.ownerId)?.bannerUrl || '';
        }
    });

    const groupName = computed(() => {
        if (!props.event) return '';
        return cachedGroups.value.get(props.event.ownerId)?.name || '';
    });

    const formattedTime = computed(() => {
        if (props.mode === 'timeline') {
            return formatTimeRange(props.event.startsAt, props.event.endsAt);
        } else {
            return `${dayjs(props.event.startsAt).format('MM-DD ddd HH:mm')} - ${dayjs(props.event.endsAt).format('HH:mm')}`;
        }
    });

    const formatTimeRange = (startsAt, endsAt) =>
        `${dayjs(startsAt).format('HH:mm')} - ${dayjs(endsAt).format('HH:mm')}`;

    const capitalizeFirst = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

    const onGroupClick = () => {
        showGroupDialog(props.event.ownerId);
    };
</script>

<style lang="scss" scoped>
    .event-card {
        transition: all 0.3s ease;
        position: relative;
        overflow: visible;
        border-radius: 8px;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        &.grouped-card {
            margin-bottom: 0;
        }
        &.grid-card {
            flex: 0 0 280px;
            max-width: 280px;
        }
        ::v-deep .el-card__body {
            overflow: visible;
        }
        .banner {
            width: 100%;
            object-fit: cover;
            border-radius: 8px 8px 0 0;
            .timeline-view & {
                height: 125px;
            }
            .grid-view & {
                height: 100px;
            }
        }
        .following-badge {
            position: absolute;
            top: -8px;
            right: -9px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: var(--group-calendar-badge-following, #67c23a);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 10;
        }
        .event-content {
            font-size: 12px;
            .timeline-view & {
                padding: 4px 12px 12px 12px;
            }
            .grid-view & {
                padding: 8px 12px 12px 12px;
            }
            .event-title {
                display: flex;
                flex-direction: column;
                .grid-view & {
                    margin-bottom: 8px;
                }

                .event-group-name {
                    cursor: pointer;
                    .grid-view & {
                        display: none;
                    }
                }
                .event-title-content {
                    font-size: 14px;
                    font-weight: bold;
                    line-height: 1.2;
                    cursor: pointer;
                    .timeline-view & {
                        margin-bottom: 2px;
                    }
                    &:hover {
                        color: var(--el-color-primary);
                    }
                }
            }
            .event-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                .timeline-view & > :first-child {
                    font-size: 14px;
                }
                .grid-view & {
                    font-size: 11px;
                    color: var(--el-text-color-regular);
                }
                .event-time {
                    font-weight: 500;
                    color: var(--el-color-primary);
                }
            }
        }
    }
    ::v-deep .el-card {
        border-radius: 8px;
        width: 100%;
        overflow: visible;
    }
</style>
