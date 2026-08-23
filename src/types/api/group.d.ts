// API functions
export type GetGroup = (params: {
    groupId: string;
    includeRoles?: boolean;
}) => Promise<{
    json: GetGroupResponse;
    params: { groupId: string; includeRoles?: boolean };
}>;

export type CheckTransferGroup = (params: {
    groupId: string;
    transferTargetId: string;
}) => Promise<{
    json: CheckTransferGroupResponse;
    params: { groupId: string; transferTargetId: string };
}>;

export type GetCalendars = (params: {
    date: string;
}) => Promise<CalendarResponse>;

export type GetFollowingCalendars = (params: {
    date: string;
}) => Promise<CalendarResponse>;

export type GetFeaturedCalendars = (params: {
    date: string;
}) => Promise<CalendarResponse>;

// API response types
interface GetGroupResponse {
    badges: any[];
    bannerId: string;
    bannerUrl: string;
    createdAt: string;
    description: string;
    discriminator: string;
    galleries: any[];
    iconId: string;
    iconUrl: string;
    id: string;
    isVerified: boolean;
    joinState: string;
    languages: string[];
    links: any[];
    memberCount: number;
    memberCountSyncedAt: string;
    membershipStatus: string;
    name: string;
    onlineMemberCount: number;
    // groupId
    ownerId: string;
    privacy: string;
    rules: string;
    shortCode: string;
    tags: string[];
}

interface CheckTransferGroupResponse {
    requirements: {
        groupNotMonetized: boolean;
        hasVRCPlus: boolean;
        hasVerifiedEmail: boolean;
        targetCanOwnMoreGroups: boolean;
        targetIsGroupMember: boolean;
    };
}

// Exported interfaces

/**
 * Group calendar event object
 */
export interface GroupCalendarEvent {
    accessType: 'public' | 'group' | string;
    category: 'hangout' | 'education' | 'roleplaying' | string;
    closeInstanceAfterEndMinutes: number;
    createdAt: string;
    deletedAt: string | null;
    description: string;
    durationInMs: number;
    endsAt: string;
    featured: boolean;
    guestEarlyJoinMinutes: number;
    hostEarlyJoinMinutes: number;
    id: string;
    imageId: string | null;
    imageUrl?: string;
    interestedUserCount: number;
    isDraft: boolean;
    languages: string[];
    occurrenceKind: 'occurrence' | 'single' | string;
    ownerId: string;
    platforms: string[];
    recurrence: string | null;
    roleIds: string[] | null;
    seriesId: string | null;
    startsAt: string;
    tags: string[];
    title: string;
    type: 'event' | string;
    updatedAt: string;
    userInterest?: GroupCalendarUserInterest;
    usesInstanceOverflow: boolean;
}

// Internal response types
interface CalendarResponse {
    hasNext: boolean;
    results: GroupCalendarEvent[];
    totalCount: number;
}
