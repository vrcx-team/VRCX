/**
 * API requests
 * Export all API requests from here
 */

import { request } from '../service/request';

import authRequest from './auth';
import avatarModerationRequest from './avatarModeration';
import avatarRequest from './avatar';
import favoriteRequest from './favorite';
import friendRequest from './friend';
import groupRequest from './group';
import imageRequest from './image';
import instanceRequest from './instance';
import inventoryRequest from './inventory';
import inviteMessagesRequest from './inviteMessages';
import miscRequest from './misc';
import notificationRequest from './notification';
import playerModerationRequest from './playerModeration';
import propRequest from './prop';
import userRequest from './user';
import vrcPlusIconRequest from './vrcPlusIcon';
import vrcPlusImageRequest from './vrcPlusImage';
import worldRequest from './world';

window.request = {
    request,
    userRequest,
    worldRequest,
    instanceRequest,
    friendRequest,
    avatarRequest,
    notificationRequest,
    playerModerationRequest,
    avatarModerationRequest,
    favoriteRequest,
    vrcPlusIconRequest,
    vrcPlusImageRequest,
    inviteMessagesRequest,
    miscRequest,
    authRequest,
    groupRequest,
    inventoryRequest,
    propRequest,
    imageRequest
};

export {
    request,
    userRequest,
    worldRequest,
    instanceRequest,
    friendRequest,
    avatarRequest,
    notificationRequest,
    playerModerationRequest,
    avatarModerationRequest,
    favoriteRequest,
    vrcPlusIconRequest,
    vrcPlusImageRequest,
    inviteMessagesRequest,
    miscRequest,
    authRequest,
    groupRequest,
    inventoryRequest,
    propRequest,
    imageRequest
};
