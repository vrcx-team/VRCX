import { toast } from 'vue-sonner';

import { $throw } from '../../service/request';
import { AppDebug } from '../../service/appConfig.js';
import { extractFileId } from './index.js';
import { imageRequest } from '../../api';

const UPLOAD_TIMEOUT_MS = 30_000;

export function withUploadTimeout(promise) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error('Upload timed out')),
                UPLOAD_TIMEOUT_MS
            )
        )
    ]);
}

function resolveMessage(message) {
    if (typeof message === 'function') {
        return message();
    }
    return message;
}

function getInputElement(selector) {
    if (!selector) {
        return null;
    }
    if (typeof selector === 'function') {
        return selector();
    }
    if (typeof selector === 'string') {
        return document.querySelector(selector);
    }
    return selector;
}

export function handleImageUploadInput(event, options = {}) {
    const {
        inputSelector,
        // 20MB
        maxSize = 20000000,
        acceptPattern = /image.*/,
        tooLargeMessage,
        invalidTypeMessage,
        onClear
    } = options;

    const clearInput = () => {
        onClear?.();
        const input = getInputElement(inputSelector);
        if (input) {
            input.value = '';
        }
    };

    const files = event?.target?.files || event?.dataTransfer?.files;
    if (!files || files.length === 0) {
        clearInput();
        return { file: null, clearInput };
    }

    const file = files[0];
    if (file.size >= maxSize) {
        if (tooLargeMessage) {
            toast.error(resolveMessage(tooLargeMessage));
        }
        clearInput();
        return { file: null, clearInput };
    }

    let acceptRegex = null;
    if (acceptPattern) {
        acceptRegex =
            acceptPattern instanceof RegExp
                ? acceptPattern
                : new RegExp(acceptPattern);
    }

    if (acceptRegex && !acceptRegex.test(file.type)) {
        if (invalidTypeMessage) {
            toast.error(resolveMessage(invalidTypeMessage));
        }
        clearInput();
        return { file: null, clearInput };
    }

    return { file, clearInput };
}

/**
 * File -> base64
 * @param {Blob|File} blob
 * @returns {Promise<string>} base64 encoded string
 */
export function readFileAsBase64(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = reject;
        r.onabort = reject;
        r.onload = () => {
            const bytes = new Uint8Array(r.result);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            resolve(btoa(binary));
        };
        r.readAsArrayBuffer(blob);
    });
}

/**
 * @param {string} base64Data - base64 encoded image
 * @returns {Promise<string>} resized base64 encoded image
 */
export async function resizeImageToFitLimits(base64Data) {
    // frontend limit check = 20MB
    return AppApi.ResizeImageToFitLimits(base64Data);
}

/**
 * Upload image through AWS
 * @param {'avatar'|'world'} type
 * @param {object} opts
 * @param {string} opts.entityId - avatar or world id
 * @param {string} opts.imageUrl - current imageUrl on the entity
 * @param {string} opts.base64File - base64 encoded image data
 * @param {Blob}   opts.blob - the original blob (used for file size)
 */
export async function uploadImageLegacy(
    type,
    { entityId, imageUrl, base64File, blob }
) {
    const apiMap = {
        avatar: {
            uploadImage: imageRequest.uploadAvatarImage,
            fileStart: imageRequest.uploadAvatarImageFileStart,
            fileFinish: imageRequest.uploadAvatarImageFileFinish,
            sigStart: imageRequest.uploadAvatarImageSigStart,
            sigFinish: imageRequest.uploadAvatarImageSigFinish,
            setImage: imageRequest.setAvatarImage
        },
        world: {
            uploadImage: imageRequest.uploadWorldImage,
            fileStart: imageRequest.uploadWorldImageFileStart,
            fileFinish: imageRequest.uploadWorldImageFileFinish,
            sigStart: imageRequest.uploadWorldImageSigStart,
            sigFinish: imageRequest.uploadWorldImageSigFinish,
            setImage: imageRequest.setWorldImage
        }
    };
    const api = apiMap[type];

    const fileMd5 = await AppApi.MD5File(base64File);
    const fileSizeInBytes = parseInt(blob.size, 10);
    const base64SignatureFile = await AppApi.SignFile(base64File);
    const signatureMd5 = await AppApi.MD5File(base64SignatureFile);
    const signatureSizeInBytes = parseInt(
        await AppApi.FileLength(base64SignatureFile),
        10
    );
    const fileId = extractFileId(imageUrl);

    // imageInit
    const uploadRes = await api.uploadImage(
        { fileMd5, fileSizeInBytes, signatureMd5, signatureSizeInBytes },
        fileId
    );
    const uploadedFileId = uploadRes.json.id;
    const fileVersion =
        uploadRes.json.versions[uploadRes.json.versions.length - 1].version;

    // imageFileStart
    const fileStartRes = await api.fileStart({
        fileId: uploadedFileId,
        fileVersion
    });

    // uploadImageFileAWS
    const fileAwsRes = await webApiService.execute({
        url: fileStartRes.json.url,
        uploadFilePUT: true,
        fileData: base64File,
        fileMIME: 'image/png',
        fileMD5: fileMd5
    });
    if (fileAwsRes.status !== 200) {
        $throw(
            fileAwsRes.status,
            `${type} image upload failed`,
            fileStartRes.json.url
        );
    }

    // imageFileFinish
    await api.fileFinish({ fileId: uploadedFileId, fileVersion });

    // imageSigStart
    const sigStartRes = await api.sigStart({
        fileId: uploadedFileId,
        fileVersion
    });

    // uploadImageSigAWS
    const sigAwsRes = await webApiService.execute({
        url: sigStartRes.json.url,
        uploadFilePUT: true,
        fileData: base64SignatureFile,
        fileMIME: 'application/x-rsync-signature',
        fileMD5: signatureMd5
    });
    if (sigAwsRes.status !== 200) {
        $throw(
            sigAwsRes.status,
            `${type} image upload failed`,
            sigStartRes.json.url
        );
    }

    // imageSigFinish
    await api.sigFinish({ fileId: uploadedFileId, fileVersion });

    // imageSet
    const newImageUrl = `${AppDebug.endpointDomain}/file/${uploadedFileId}/${fileVersion}/file`;
    const setRes = await api.setImage({ id: entityId, imageUrl: newImageUrl });
    if (setRes.json.imageUrl !== newImageUrl) {
        $throw(0, `${type} image change failed`, newImageUrl);
    }
}
