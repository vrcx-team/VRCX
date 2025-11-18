const langCodes = [
    'cs',
    'en',
    'es',
    'fr',
    'hu',
    'ja',
    'ko',
    'pl',
    'pt',
    'ru',
    'th',
    'vi',
    'zh-CN',
    'zh-TW'
];

async function getLocalizationStrings() {
    const urlPromises = Promise.all(
        langCodes.map((code) =>
            import(`./${code}.json?url`).then((m) => m.default)
        )
    );

    const urls = await urlPromises;
    const fetchPromises = Promise.all(
        urls.map((url) => fetch(url).then((res) => res.json()))
    );
    const results = await fetchPromises;
    const entries = langCodes.map((code, index) => {
        return [code, results[index]];
    });

    return Object.fromEntries(entries);
}

export { getLocalizationStrings };
