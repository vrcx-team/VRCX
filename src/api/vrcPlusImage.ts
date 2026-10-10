import type { File, Print, UploadImage, UploadPrint } from 'vrchat';
import type { Json } from '../types/vrcx';
import { queryClient } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

function refetchActiveGalleryQueries() {
    queryClient
        .invalidateQueries({
            queryKey: ['gallery'],
            refetchType: 'active'
        })
        .catch((err) => {
            console.error('Failed to refresh gallery queries:', err);
        });
}
const vrcPlusImageReq = {
    uploadGalleryImage(imageData: string): Promise<{ json: Json<File>; params: { tag: string } }> {
        const params = {
            tag: 'gallery'
        };
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: false,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGalleryQueries();
            return args;
        });
    },

    uploadSticker(
        imageData: string,
        params: Omit<NonNullable<UploadImage['body']>, 'file'>
    ): Promise<{ json: Json<File>; params: Omit<NonNullable<UploadImage['body']>, 'file'> }> {
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGalleryQueries();
            return args;
        });
    },

    getPrints(params: { n?: number }): Promise<{ json: Json<Print[]>; params: { n?: number } }> {
        return request(`prints/user/${getCurrentUserId()}`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    deletePrint(printId: string): Promise<{ json: unknown; printId: string }> {
        return request(`prints/${printId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                printId
            };
            refetchActiveGalleryQueries();
            return args;
        });
    },

    uploadPrint(
        imageData: string,
        cropWhiteBorder: boolean,
        params: Json<Omit<NonNullable<UploadPrint['body']>, 'image'>>
    ): Promise<{ json: Json<Print>; params: Json<Omit<NonNullable<UploadPrint['body']>, 'image'>> }> {
        return request('prints', {
            uploadImagePrint: true,
            cropWhiteBorder,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGalleryQueries();
            return args;
        });
    },

    getPrint(params: { printId: string }): Promise<{ json: Json<Print>; params: { printId: string } }> {
        return request(`prints/${params.printId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    uploadEmoji(
        imageData: string,
        params: Omit<NonNullable<UploadImage['body']>, 'file'>
    ): Promise<{ json: Json<File>; params: Omit<NonNullable<UploadImage['body']>, 'file'> }> {
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGalleryQueries();
            return args;
        });
    }

    // editPrint(params) {
    //     return request(`prints/${params.printId}`, {
    //         method: 'POST',
    //         params
    //     }).then((json) => {
    //         const args = {
    //             json,
    //             params
    //         };
    //         API.$emit('PRINT:EDIT', args);
    //         return args;
    //     });
    // },
};

export default vrcPlusImageReq;
