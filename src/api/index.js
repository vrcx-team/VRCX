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
import miscRequest from './misc';
import groupRequest from './group';
import authRequest from './auth';
import inventoryRequest from './inventory';
import propRequest from './prop';
import imageRequest from './image';

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
