import { request } from '../service/request';
import { useUserStore } from '../stores';
import {
    entityQueryPolicies,
    fetchWithEntityPolicy,
    queryClient,
    queryKeys
} from '../query';

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
    uploadGalleryImage(imageData) {
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

    uploadSticker(imageData, params) {
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

    getPrints(params) {
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

    getCachedPrints(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.prints(params),
            policy: entityQueryPolicies.galleryCollection,
            queryFn: () => vrcPlusImageReq.getPrints(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },

    deletePrint(printId) {
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

    uploadPrint(imageData, cropWhiteBorder, params) {
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

    getPrint(params) {
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

    getCachedPrint(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.print(params.printId),
            policy: entityQueryPolicies.galleryCollection,
            queryFn: () => vrcPlusImageReq.getPrint(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },

    uploadEmoji(imageData, params) {
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
