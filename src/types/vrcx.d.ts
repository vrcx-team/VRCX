import type {
    CurrentUser,
    Group,
    User
} from 'vrchat';

// cursed line to convert Date and bigint to expected types
export type Json<T> = T extends Date
    ? string
    : T extends bigint
      ? number
      : T extends (infer U)[]
        ? Json<U>[]
        : T extends object
          ? { [K in keyof T]: Json<T[K]> }
          : T;

export interface moderations {
    isBlocked: boolean;
    isMuted: boolean;
    isAvatarInteractionDisabled: boolean;
    isChatBoxMuted: boolean;
}

export interface VrcxUser extends Json<User> {
    $location: {};
    $location_at: number;
    $online_for: number;
    $travelingToTime: number;
    $offline_for: number;
    $active_for: number;
    $isVRCPlus: boolean;
    $isModerator: boolean;
    $isTroll: boolean;
    $isProbableTroll: boolean;
    $trustLevel: string;
    $trustClass: string;
    $userColour: string;
    $trustSortNum: number;
    $languages: string[];
    $joinCount: number;
    $timeSpent: number;
    $lastSeen: string;
    $mutualCount: number;
    $mutualOptedOut: boolean;
    $nickName: string;
    $previousLocation: string;
    $customTag: string;
    $customTagColour: string;
    $friendNumber: number;
    $lastFetch: number;
    $moderations: moderations;
    $memo: string;
}

export interface VrcxCurrentUser extends Json<CurrentUser> {
    $online_for?: number;
    $offline_for?: number | null;
    $location_at?: number;
    $travelingToTime?: number;
    $previousAvatarSwapTime?: number | null;
    $homeLocation?: {};
    $isVRCPlus?: boolean;
    $isModerator?: boolean;
    $isTroll?: boolean;
    $isProbableTroll?: boolean;
    $trustLevel?: string;
    $trustClass?: string;
    $userColour?: string;
    $trustSortNum?: number;
    $languages?: string[];
    $locationTag?: string;
    $travelingToLocation?: string;
}

export interface VrcxGroup extends Json<Group> {
    initialRoleIds: string[];
    $memberId: string;
    groupId: string;
    isRepresenting: boolean;
    memberVisibility: string | boolean;
    mutualGroup: boolean;
    $languages: { key: string; value: string }[];
}

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
    params?: any;
    customMsg?: string;
    inviteId?: string;
    uploadImage?: boolean;
    uploadImageLegacy?: boolean;
    uploadImagePrint?: boolean;
    uploadFilePUT?: boolean;
    imageData?: string;
    postData?: string;
    matchingDimensions?: boolean;
    cropWhiteBorder?: boolean;
    fileData?: string;
    fileMIME?: string;
    fileMD5?: string;
}

export interface WebApiOptions extends RequestOptions {
    url: string;
}

export interface TableFilter {
    prop: string | string[];
    value: any;
    filterFn?: (row: any, filter: TableFilter) => boolean;
}
