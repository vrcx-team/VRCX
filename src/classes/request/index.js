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

export {
    userRequest,
    worldRequest,
    instanceRequest,
    friendRequest,
    avatarRequest,
    notificationRequest
};
