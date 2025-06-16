/**
 * API requests
 * Export all API requests from here
 *
 * "window.API" is used as app.js is a large IIFE, preventing direct API export. No current issues
 * Refactoring may be required
 */

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
import inventoryRequest from './inventory';
import propRequest from './prop';

window.request = {
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
    groupRequest,
    inventoryRequest,
    propRequest
};

export {
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
    groupRequest,
    inventoryRequest,
    propRequest
};
