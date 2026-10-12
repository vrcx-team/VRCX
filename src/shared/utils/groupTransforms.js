/**
 * Create a default group ref object.
 *
 * @param {Partial<import('@/types/vrcx').VrcxGroup>} json - API response to merge
 * @returns {import('@/types/vrcx').VrcxGroup}
 */
export function createDefaultGroupRef(json) {
    return /** @type {import('@/types/vrcx').VrcxGroup} */ ({
        id: '',
        name: '',
        shortCode: '',
        description: '',
        bannerId: '',
        bannerUrl: '',
        createdAt: '',
        discriminator: '',
        galleries: [],
        iconId: '',
        iconUrl: '',
        isVerified: false,
        joinState: '',
        languages: [],
        links: [],
        memberCount: 0,
        memberCountSyncedAt: '',
        membershipStatus: '',
        onlineMemberCount: 0,
        ownerId: '',
        privacy: '',
        rules: null,
        tags: [],
        ageVerificationBetaCode: '',
        ageVerificationBetaSlots: 0,
        ageVerificationSlotsAvailable: false,
        allowGroupJoinPrompt: false,
        badges: [],
        lastPostCreatedAt: '',
        nameplateId: null,
        nameplateUrl: null,
        storeId: '',
        transferTargetId: '',
        // in group
        initialRoleIds: [],
        myMember: {
            bannedAt: null,
            groupId: '',
            has2FA: false,
            id: '',
            isRepresenting: false,
            isSubscribedToAnnouncements: false,
            isSubscribedToEventAnnouncements: false,
            joinedAt: '',
            managerNotes: '',
            membershipStatus: '',
            permissions: [],
            roleIds: [],
            userId: '',
            visibility: '',
            _created_at: '',
            _id: '',
            _updated_at: ''
        },
        updatedAt: '',
        // includeRoles: true
        roles: [],
        // group list
        $memberId: '',
        groupId: '',
        isRepresenting: false,
        memberVisibility: false,
        mutualGroup: false,
        // VRCX
        $languages: [],
        ...json
    });
}
