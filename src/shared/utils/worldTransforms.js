/**
 * Create a default world ref object.
 * @param {object} json - API response to merge
 * @returns {object}
 */
export function createDefaultWorldRef(json) {
    return {
        id: '',
        name: '',
        description: '',
        defaultContentSettings: {},
        authorId: '',
        authorName: '',
        capacity: 0,
        recommendedCapacity: 0,
        tags: [],
        releaseStatus: '',
        imageUrl: '',
        thumbnailImageUrl: '',
        assetUrl: '',
        assetUrlObject: {},
        pluginUrl: '',
        pluginUrlObject: {},
        unityPackageUrl: '',
        unityPackageUrlObject: {},
        unityPackages: [],
        version: 0,
        favorites: 0,
        created_at: '',
        updated_at: '',
        publicationDate: '',
        labsPublicationDate: '',
        visits: 0,
        popularity: 0,
        heat: 0,
        publicOccupants: 0,
        privateOccupants: 0,
        occupants: 0,
        instances: [],
        featured: false,
        organization: '',
        previewYoutubeId: '',
        // VRCX
        $isLabs: false,
        //
        ...json
    };
}
