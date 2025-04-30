import utils from '../../classes/utils';

function storeAvatarImage(args) {
    const refCreatedAt = args.json.versions[0];
    const fileCreatedAt = refCreatedAt.created_at;
    const fileId = args.params.fileId;
    let avatarName = '';
    const imageName = args.json.name;
    const avatarNameRegex = /Avatar - (.*) - Image -/gi.exec(imageName);
    if (avatarNameRegex) {
        avatarName = utils.replaceBioSymbols(avatarNameRegex[1]);
    }
    const ownerId = args.json.ownerId;
    const avatarInfo = {
        ownerId,
        avatarName,
        fileCreatedAt
    };
    window.API.cachedAvatarNames.set(fileId, avatarInfo);
    // return avatarInfo;
}

export { storeAvatarImage };
