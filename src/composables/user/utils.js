import { languageMappings } from './constants/language';

function userOnlineForTimestamp(ctx) {
    if (ctx.ref.state === 'online' && ctx.ref.$online_for) {
        return ctx.ref.$online_for;
    } else if (ctx.ref.state === 'active' && ctx.ref.$active_for) {
        return ctx.ref.$active_for;
    } else if (ctx.ref.$offline_for) {
        return ctx.ref.$offline_for;
    }
    return 0;
}

function languageClass(language) {
    const style = {};
    const mapping = languageMappings[language];
    if (typeof mapping !== 'undefined') {
        style[mapping] = true;
    } else {
        style.unknown = true;
    }
    return style;
}

function getPrintFileName(print) {
    const authorName = print.authorName;
    // fileDate format: 2024-11-03_16-14-25.757
    const createdAt = getPrintLocalDate(print);
    const fileNameDate = createdAt
        .toISOString()
        .replace(/:/g, '-')
        .replace(/T/g, '_')
        .replace(/Z/g, '');
    const fileName = `${authorName}_${fileNameDate}_${print.id}.png`;
    return fileName;
}

function getEmojiFileName(emoji) {
    if (emoji.frames) {
        const loopStyle = emoji.loopStyle || 'linear';
        return `${emoji.name}_${emoji.animationStyle}animationStyle_${emoji.frames}frames_${emoji.framesOverTime}fps_${loopStyle}loopStyle.png`;
    } else {
        return `${emoji.name}_${emoji.animationStyle}animationStyle.png`;
    }
}

function getPrintLocalDate(print) {
    if (print.createdAt) {
        const createdAt = new Date(print.createdAt);
        // cursed convert to local time
        createdAt.setMinutes(
            createdAt.getMinutes() - createdAt.getTimezoneOffset()
        );
        return createdAt;
    }
    if (print.timestamp) {
        return new Date(print.timestamp);
    }

    const createdAt = new Date();
    // cursed convert to local time
    createdAt.setMinutes(
        createdAt.getMinutes() - createdAt.getTimezoneOffset()
    );
    return createdAt;
}

function isFriendOnline(friend) {
    if (typeof friend === 'undefined' || typeof friend.ref === 'undefined') {
        return false;
    }
    if (friend.state === 'online') {
        return true;
    }
    if (friend.state !== 'online' && friend.ref.location !== 'private') {
        // wat
        return true;
    }
    return false;
}

export {
    userOnlineForTimestamp,
    languageClass,
    getPrintFileName,
    getPrintLocalDate,
    getEmojiFileName,
    isFriendOnline
};
