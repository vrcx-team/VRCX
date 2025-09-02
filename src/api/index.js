/**
 * API requests
 * Export all API requests from here
 */

import { request } from '../service/request';
import userRequest from './user';
import worldRequest from './world';
import instanceRequest from './instance';
import friendRequest from './friend';
import avatarRequest from './avatar';
import notificationRequest from './notification';
import playerModerationRequest from './playerModeration';
import avatarModerationRequest from './avatarModeration';
import favoriteRequest from './favorite';
import vrcPlusIconRequest from './vrcPlusIcon';
import vrcPlusImageRequest from './vrcPlusImage';
import inviteMessagesRequest from './inviteMessages';
import imageRequest from './image';
import miscRequest from './misc';
import groupRequest from './group';
import authRequest from './auth';
import inventoryRequest from './inventory';
import propRequest from './prop';

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
    imageRequest,
    miscRequest,
    authRequest,
    groupRequest,
    inventoryRequest,
    propRequest
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
    imageRequest,
    miscRequest,
    authRequest,
    groupRequest,
    inventoryRequest,
    propRequest
};
