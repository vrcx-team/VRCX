/**
 *
 * @param {object} print
 * @returns
 */
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

/**
 *
 * @param {object} print
 * @returns
 */
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

/**
 * @param {object} emoji
 */
function getEmojiFileName(emoji) {
    if (emoji.frames) {
        const loopStyle = emoji.loopStyle || 'linear';
        return `${emoji.name}_${emoji.animationStyle}animationStyle_${emoji.frames}frames_${emoji.framesOverTime}fps_${loopStyle}loopStyle.png`;
    } else {
        return `${emoji.name}_${emoji.animationStyle}animationStyle.png`;
    }
}

/**
 * @param {string} url
 * @param {number} fps
 * @param {number} frameCount
 * @param {string} loopStyle
 */
function generateEmojiStyle(url, fps, frameCount, loopStyle) {
    let framesPerLine = 2;
    if (frameCount > 4) framesPerLine = 4;
    if (frameCount > 16) framesPerLine = 8;
    const animationDurationMs = (1000 / fps) * frameCount;
    const frameSize = 1024 / framesPerLine;
    const scale = 100 / (frameSize / 200);
    const animStyle = loopStyle === 'pingpong' ? 'alternate' : 'none';
    const style = `
            transform: scale(${scale / 100});
            transform-origin: top left;
            width: ${frameSize}px;
            height: ${frameSize}px;
            background: url('${url}') 0 0;
            animation: ${animationDurationMs}ms steps(1) 0s infinite ${animStyle} running animated-emoji-${frameCount};
        `;
    return style;
}

export {
    getPrintLocalDate,
    getPrintFileName,
    getEmojiFileName,
    generateEmojiStyle
};
