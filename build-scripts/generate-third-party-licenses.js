/* global __dirname, require */
// generate-third-party-licenses.js
// use by frontend open source software notice dialog

const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const frontendLicensePath = path.join(
    rootDir,
    'build',
    'html',
    '.vite',
    'license.md'
);
const outputDir = path.join(rootDir, 'build', 'html', 'licenses');
const outputManifestPath = path.join(outputDir, 'third-party-licenses.json');
const outputNoticePath = path.join(outputDir, 'THIRD_PARTY_NOTICES.txt');
const dotnetDir = path.join(rootDir, 'Dotnet');
const nugetCacheDir =
    process.env.NUGET_PACKAGES || path.join(os.homedir(), '.nuget', 'packages');
const overridesPath = path.join(__dirname, 'licenses', 'nuget-overrides.json');

const nugetOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));

function ensureDirectory(directoryPath) {
    fs.mkdirSync(directoryPath, { recursive: true });
}

function readFileIfExists(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    return fs.readFileSync(filePath, 'utf8');
}

function normalizeWhitespace(value) {
    return value?.replace(/\r\n/g, '\n').trim() || '';
}

function sanitizeId(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function extractXmlTagValue(xml, tagName) {
    const match = xml.match(
        new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i')
    );

    return match?.[1]?.trim() || '';
}

function extractXmlSelfClosingTagAttribute(xml, tagName, attributeName) {
    const match = xml.match(
        new RegExp(
            `<${tagName}[^>]*${attributeName}="([^"]+)"[^>]*>(?:[\\s\\S]*?)<\\/${tagName}>`,
            'i'
        )
    );

    return match?.[1]?.trim() || '';
}

function extractRepositoryUrl(xml) {
    const match = xml.match(/<repository[^>]*url="([^"]+)"/i);

    return match?.[1]?.trim() || '';
}

function findFirstExistingFile(filePaths) {
    return filePaths.find((filePath) => fs.existsSync(filePath)) || null;
}

function findPackageLicenseFile(packageDir) {
    if (!fs.existsSync(packageDir)) {
        return null;
    }

    const stack = [packageDir];

    while (stack.length > 0) {
        const currentDir = stack.pop();
        const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const dirEntry of dirEntries) {
            const fullPath = path.join(currentDir, dirEntry.name);

            if (dirEntry.isDirectory()) {
                if (!fullPath.includes(`${path.sep}tools${path.sep}`)) {
                    stack.push(fullPath);
                }
                continue;
            }

            if (
                /^(license|licence|notice|copying)(\.[^.]+)?$/i.test(
                    dirEntry.name
                )
            ) {
                return fullPath;
            }
        }
    }

    return null;
}

function parseFrontendLicenses(markdown) {
    const normalized = normalizeWhitespace(markdown);
    if (!normalized) {
        return [];
    }

    const sections = normalized.split(/\n(?=## )/g).slice(1);

    return sections
        .map((section) => {
            const [headerLine, ...bodyLines] = section.split('\n');
            const headerMatch = headerLine.match(
                /^##\s+(.+?)\s+-\s+(.+?)\s+\((.+?)\)$/
            );

            if (!headerMatch) {
                return null;
            }

            const [, name, version, license] = headerMatch;
            const noticeText = normalizeWhitespace(bodyLines.join('\n'));

            return {
                id: `frontend-${sanitizeId(`${name}-${version}`)}`,
                name,
                version,
                license,
                sourceType: 'frontend',
                sourceLabel: 'Frontend bundle',
                noticeText,
                needsReview: !license && !noticeText
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.name.localeCompare(right.name));
}

function parseCsprojPackageReferences(csprojText) {
    return [
        ...csprojText.matchAll(
            /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g
        )
    ].map(([, name, version]) => ({
        name,
        version,
        sourceType: 'dotnet'
    }));
}

function parseCsprojBinaryReferences(csprojText) {
    const binaryEntries = [];

    for (const [, name, hintPath] of csprojText.matchAll(
        /<Reference\s+Include="([^"]+)">[\s\S]*?<HintPath>([^<]+)<\/HintPath>[\s\S]*?<\/Reference>/g
    )) {
        binaryEntries.push({
            name,
            version: '',
            sourceType: 'native',
            filePath: hintPath.replaceAll('\\', '/')
        });
    }

    for (const [, includePath] of csprojText.matchAll(
        /<None\s+Include="([^"]*libs[^"]+\.(?:dll|so|dylib))">/g
    )) {
        const normalizedPath = includePath.replaceAll('\\', '/');
        const fileName = path.basename(normalizedPath);
        const overrideName =
            fileName === 'openvr_api.dll' ? 'OpenVR SDK' : fileName;

        binaryEntries.push({
            name: overrideName,
            version: '',
            sourceType: 'native',
            filePath: normalizedPath
        });
    }

    return binaryEntries;
}

function parseAssetsLibraries(projectAssetsPath) {
    const assetsRaw = readFileIfExists(projectAssetsPath);
    if (!assetsRaw) {
        return [];
    }

    const assets = JSON.parse(assetsRaw);
    const libraries = assets.libraries || {};

    return Object.keys(libraries)
        .filter(
            (libraryKey) =>
                !libraries[libraryKey]?.type ||
                libraries[libraryKey].type === 'package'
        )
        .map((libraryKey) => {
            const lastSlashIndex = libraryKey.lastIndexOf('/');

            return {
                name: libraryKey.slice(0, lastSlashIndex),
                version: libraryKey.slice(lastSlashIndex + 1),
                sourceType: 'dotnet'
            };
        });
}

function mergeDotnetEntries(csprojFiles) {
    const collectedEntries = new Map();

    for (const csprojFile of csprojFiles) {
        const projectName = path.basename(csprojFile, '.csproj');
        const csprojText = fs.readFileSync(csprojFile, 'utf8');
        const assetEntries = parseAssetsLibraries(
            path.join(path.dirname(csprojFile), 'obj', 'project.assets.json')
        );
        const packageEntries =
            assetEntries.length > 0
                ? assetEntries
                : parseCsprojPackageReferences(csprojText);
        const binaryEntries = parseCsprojBinaryReferences(csprojText);

        for (const entry of [...packageEntries, ...binaryEntries]) {
            const key = `${entry.sourceType}:${entry.name}:${entry.version}`;
            const existingEntry = collectedEntries.get(key) || {
                ...entry,
                projects: []
            };

            existingEntry.projects = [
                ...new Set([...existingEntry.projects, projectName])
            ].sort();
            collectedEntries.set(key, existingEntry);
        }
    }

    return [...collectedEntries.values()].sort((left, right) =>
        left.name.localeCompare(right.name)
    );
}

function resolveNugetMetadata(name, version) {
    const packageDir = path.join(nugetCacheDir, name.toLowerCase(), version);
    const nuspecPath =
        findFirstExistingFile([
            path.join(packageDir, `${name.toLowerCase()}.nuspec`),
            ...(fs.existsSync(packageDir)
                ? fs
                      .readdirSync(packageDir)
                      .filter((fileName) => fileName.endsWith('.nuspec'))
                      .map((fileName) => path.join(packageDir, fileName))
                : [])
        ]) || null;

    const override = nugetOverrides[name] || {};
    const metadata = {
        license: override.license || '',
        licenseUrl: override.licenseUrl || '',
        projectUrl: override.projectUrl || '',
        noticeText: normalizeWhitespace(override.noticeText),
        needsReview: false
    };

    if (!nuspecPath) {
        metadata.needsReview = !metadata.license && !metadata.noticeText;
        return metadata;
    }

    const nuspecText = fs.readFileSync(nuspecPath, 'utf8');
    const licenseExpression =
        extractXmlSelfClosingTagAttribute(nuspecText, 'license', 'type') ===
        'expression'
            ? extractXmlTagValue(nuspecText, 'license')
            : '';
    const licenseFilePath =
        extractXmlSelfClosingTagAttribute(nuspecText, 'license', 'type') ===
        'file'
            ? extractXmlTagValue(nuspecText, 'license')
            : '';

    metadata.license ||= licenseExpression;
    metadata.licenseUrl ||= extractXmlTagValue(nuspecText, 'licenseUrl');
    metadata.projectUrl ||=
        extractXmlTagValue(nuspecText, 'projectUrl') ||
        extractRepositoryUrl(nuspecText);

    if (!metadata.noticeText) {
        const embeddedLicensePath = licenseFilePath
            ? path.join(packageDir, licenseFilePath.replaceAll('\\', path.sep))
            : null;
        const discoveredLicensePath = findPackageLicenseFile(packageDir);
        const resolvedLicensePath = findFirstExistingFile(
            [embeddedLicensePath, discoveredLicensePath].filter(Boolean)
        );

        metadata.noticeText = normalizeWhitespace(
            readFileIfExists(resolvedLicensePath)
        );
    }

    metadata.needsReview = !metadata.license && !metadata.noticeText;
    return metadata;
}

function enrichDotnetEntries(entries) {
    return entries.map((entry) => {
        const override = nugetOverrides[entry.name] || {};

        if (entry.sourceType === 'native') {
            return {
                id: `native-${sanitizeId(entry.name)}`,
                ...entry,
                license: override.license || 'Unknown',
                licenseUrl: override.licenseUrl || '',
                projectUrl: override.projectUrl || '',
                noticeText: normalizeWhitespace(override.noticeText),
                sourceLabel: 'Bundled native/.NET component',
                needsReview: !override.license && !override.noticeText
            };
        }

        const metadata = entry.version
            ? resolveNugetMetadata(entry.name, entry.version)
            : {
                  license: override.license || '',
                  licenseUrl: override.licenseUrl || '',
                  projectUrl: override.projectUrl || '',
                  noticeText: normalizeWhitespace(override.noticeText),
                  needsReview: !override.license && !override.noticeText
              };

        return {
            id: `${entry.sourceType}-${sanitizeId(`${entry.name}-${entry.version}`)}`,
            ...entry,
            license: metadata.license || 'Unknown',
            licenseUrl: metadata.licenseUrl || '',
            projectUrl: metadata.projectUrl || '',
            noticeText: metadata.noticeText,
            sourceLabel: 'Bundled .NET/native backend component',
            needsReview: metadata.needsReview
        };
    });
}

function createThirdPartyNoticeText(frontendLicenseMarkdown, entries) {
    const lines = [
        'VRCX Third-Party Notices',
        '',
        `Generated: ${new Date().toISOString()}`,
        '',
        '========================================',
        'Frontend bundled dependencies',
        '========================================',
        '',
        normalizeWhitespace(frontendLicenseMarkdown) ||
            'No frontend license manifest was available.',
        '',
        '',
        '========================================',
        '.NET and native bundled components',
        '========================================',
        ''
    ];

    for (const entry of entries.filter(
        (item) => item.sourceType !== 'frontend'
    )) {
        lines.push(
            `${entry.name}${entry.version ? ` - ${entry.version}` : ''} (${entry.license})`
        );
        lines.push(`Source: ${entry.sourceLabel}`);

        if (entry.projects?.length) {
            lines.push(`Used by: ${entry.projects.join(', ')}`);
        }

        if (entry.projectUrl) {
            lines.push(`Project URL: ${entry.projectUrl}`);
        }

        if (entry.licenseUrl) {
            lines.push(`License URL: ${entry.licenseUrl}`);
        }

        if (entry.filePath) {
            lines.push(`Bundled file: ${entry.filePath}`);
        }

        lines.push('');

        if (entry.noticeText) {
            lines.push(entry.noticeText);
        } else {
            lines.push(
                'No local license text was available during generation. Review this component before release.'
            );
        }

        lines.push('');
        lines.push('----------------------------------------');
        lines.push('');
    }

    return `${lines.join('\n').trimEnd()}\n`;
}

function main() {
    ensureDirectory(outputDir);

    const frontendLicenseMarkdown = readFileIfExists(frontendLicensePath) || '';
    const frontendEntries = parseFrontendLicenses(frontendLicenseMarkdown);
    const csprojFiles = fs
        .readdirSync(dotnetDir)
        .filter((fileName) => fileName.endsWith('.csproj'))
        .map((fileName) => path.join(dotnetDir, fileName))
        .concat(path.join(dotnetDir, 'DBMerger', 'DBMerger.csproj'))
        .filter(
            (filePath, index, filePaths) =>
                filePaths.indexOf(filePath) === index && fs.existsSync(filePath)
        );

    const dotnetEntries = enrichDotnetEntries(mergeDotnetEntries(csprojFiles));
    const manifest = {
        generatedAt: new Date().toISOString(),
        noticePath: 'licenses/THIRD_PARTY_NOTICES.txt',
        entries: [...frontendEntries, ...dotnetEntries]
    };

    fs.writeFileSync(outputManifestPath, JSON.stringify(manifest, null, 4));
    fs.writeFileSync(
        outputNoticePath,
        createThirdPartyNoticeText(frontendLicenseMarkdown, manifest.entries)
    );

    const reviewCount = manifest.entries.filter(
        (entry) => entry.needsReview
    ).length;
    console.log(
        `Generated third-party license manifest with ${manifest.entries.length} entries (${reviewCount} requiring review).`
    );
}

main();
