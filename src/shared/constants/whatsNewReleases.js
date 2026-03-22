const whatsNewReleases = {
    v2026_04_a: {
        titleKey: 'onboarding.whatsnew.releases.v2026_04_a.title',
        releaseLabel: '2026.04',
        items: [
            {
                key: 'quick_search',
                icon: 'search',
                titleKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.quick_search.title',
                descriptionKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.quick_search.description'
            },
            {
                key: 'dashboard',
                icon: 'layout-dashboard',
                titleKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.dashboard.title',
                descriptionKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.dashboard.description'
            },
            {
                key: 'activity_insights',
                icon: 'activity',
                titleKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.activity_insights.title',
                descriptionKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.activity_insights.description'
            },
            {
                key: 'my_avatars',
                icon: 'images',
                titleKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.my_avatars.title',
                descriptionKey:
                    'onboarding.whatsnew.releases.v2026_04_a.items.my_avatars.description'
            }
        ]
    }
};

/**
 * @param {string} version
 * @returns {string}
 */
function getWhatsNewReleaseKey(version) {
    const match = String(version || '').match(/(\d{4})\.(\d{2})(?:\.\d{2})?/);
    if (!match) {
        return '';
    }
    return `v${match[1]}_${match[2]}_a`;
}

/**
 * @param {string} version
 * @returns {{titleKey: string, releaseLabel?: string, items: Array<{key: string, icon: string, titleKey: string, descriptionKey: string}>} | null}
 */
function getWhatsNewRelease(version) {
    const releaseKey = String(version || '');
    if (!releaseKey) {
        return null;
    }
    return whatsNewReleases[releaseKey] ?? null;
}

export { getWhatsNewRelease, getWhatsNewReleaseKey, whatsNewReleases };
