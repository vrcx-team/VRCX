/**
 * Create a default avatar ref object.
 *
 * @param {Partial<import('@/types/vrcx').Json<import('vrchat').Avatar>>} json - API response to merge
 * @returns {import('@/types/vrcx').Json<import('vrchat').Avatar>}
 */
export function createDefaultAvatarRef(json) {
    return /** @type {import('@/types/vrcx').Json<import('vrchat').Avatar>} */ ({
        acknowledgements: '',
        activeAssetReviewId: '',
        assetUrl: '',
        assetUrlObject: {},
        attribution: null,
        authorId: '',
        authorName: '',
        created_at: '',
        description: '',
        featured: false,
        highestPrice: null,
        id: '',
        imageUrl: '',
        listingDate: null,
        lock: false,
        lowestPrice: null,
        name: '',
        pendingUpload: false,
        performance: {},
        productId: null,
        publishedListings: [],
        releaseStatus: '',
        searchable: false,
        styles: [],
        tags: [],
        thumbnailImageUrl: '',
        unityPackageUrl: '',
        unityPackageUrlObject: {},
        unityPackages: [],
        updated_at: '',
        version: 0,
        ...json
    });
}
