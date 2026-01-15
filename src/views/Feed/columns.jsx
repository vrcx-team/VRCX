import AvatarInfo from '../../components/AvatarInfo.vue';
import Location from '../../components/Location.vue';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import {
    ArrowDown,
    ArrowRight,
    ArrowUpDown,
    ChevronDown,
    ChevronRight
} from 'lucide-vue-next';
import { formatDateFilter, statusClass, timeToText } from '../../shared/utils';
import { i18n } from '../../plugin';
import { useUserStore, useGalleryStore } from '../../stores';

const { t } = i18n.global;

const expandedRow = ({ row }) => {
    const original = row.original;
    const type = original.type;
    if (type === 'GPS') {
        return (
            <div class="pl-5 text-sm">
                {original.previousLocation ? (
                    <>
                        <Location
                            location={original.previousLocation}
                            class="inline-block"
                        />
                        <Badge variant="secondary" class="ml-1 w-fit">
                            {timeToText(original.time)}
                        </Badge>
                        <br />
                        <span>
                            <ArrowDown />
                        </span>
                    </>
                ) : null}
                {original.location ? (
                    <Location
                        location={original.location}
                        hint={original.worldName}
                        grouphint={original.groupName}
                    />
                ) : null}
            </div>
        );
    }

    if (type === 'Offline') {
        return original.location ? (
            <div class="pl-5 text-sm">
                <Location
                    location={original.location}
                    hint={original.worldName}
                    grouphint={original.groupName}
                />
                <Badge variant="secondary" class="ml-1 w-fit">
                    {timeToText(original.time)}
                </Badge>
            </div>
        ) : null;
    }

    if (type === 'Online') {
        return original.location ? (
            <div class="pl-5 text-sm">
                <Location
                    location={original.location}
                    hint={original.worldName}
                    grouphint={original.groupName}
                />
            </div>
        ) : null;
    }

    if (type === 'Avatar') {
        const { showFullscreenImageDialog } = useGalleryStore();
        return (
            <div class="pl-5 text-sm">
                <div class="flex items-center">
                    <div class="inline-block align-top w-40">
                        {original.previousCurrentAvatarThumbnailImageUrl ? (
                            <>
                                <img
                                    src={
                                        original.previousCurrentAvatarThumbnailImageUrl
                                    }
                                    class="x-link h-30 w-40 rounded pointer"
                                    loading="lazy"
                                    onClick={() =>
                                        showFullscreenImageDialog(
                                            original.previousCurrentAvatarImageUrl
                                        )
                                    }
                                />
                                <br />
                                <AvatarInfo
                                    imageurl={
                                        original.previousCurrentAvatarThumbnailImageUrl
                                    }
                                    userid={original.userId}
                                    hintownerid={original.previousOwnerId}
                                    hintavatarname={original.previousAvatarName}
                                    avatartags={
                                        original.previousCurrentAvatarTags
                                    }
                                />
                            </>
                        ) : null}
                    </div>
                    <span class="mx-2">
                        <ArrowRight />
                    </span>
                    <div class="inline-block align-top w-40">
                        {original.currentAvatarThumbnailImageUrl ? (
                            <>
                                <img
                                    src={
                                        original.currentAvatarThumbnailImageUrl
                                    }
                                    class="x-link h-30 w-40 rounded pointer"
                                    loading="lazy"
                                    onClick={() =>
                                        showFullscreenImageDialog(
                                            original.currentAvatarImageUrl
                                        )
                                    }
                                />
                                <br />
                                <AvatarInfo
                                    imageurl={
                                        original.currentAvatarThumbnailImageUrl
                                    }
                                    userid={original.userId}
                                    hintownerid={original.ownerId}
                                    hintavatarname={original.avatarName}
                                    avatartags={original.currentAvatarTags}
                                />
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'Status') {
        return (
            <div class="flex items-center pl-5 text-sm">
                <i
                    class={[
                        'x-user-status',
                        statusClass(original.previousStatus)
                    ]}
                ></i>
                <span class="ml-1">{original.previousStatusDescription}</span>
                <br />
                <span class="mx-2">
                    <ArrowRight />
                </span>
                <i
                    class={[
                        'x-user-status',
                        statusClass(original.status),
                        'mx-1'
                    ]}
                ></i>
                <span>{original.statusDescription}</span>
            </div>
        );
    }

    if (type === 'Bio') {
        return (
            <div class="pl-5 text-sm">
                <pre
                    class="text-xs leading-5.5 whitespace-pre-wrap font-[inherit]"
                    innerHTML={formatDifference(
                        original.previousBio,
                        original.bio
                    )}
                ></pre>
            </div>
        );
    }

    return null;
};

export const columns = [
    {
        id: 'expander',
        header: () => null,
        enableSorting: false,
        size: 20,
        minSize: 0,
        maxSize: 20,
        meta: {
            expandedRow
        },
        cell: ({ row }) => {
            if (!row.getCanExpand()) {
                return null;
            }
            return (
                <button
                    type="button"
                    class="inline-flex h-6 items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                    onClick={(event) => {
                        event.stopPropagation();
                        row.toggleExpanded();
                    }}
                >
                    {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
                </button>
            );
        }
    },
    {
        accessorKey: 'created_at',
        size: 140,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                {t('table.feed.date')}
                <ArrowUpDown class="ml-1 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const createdAt = row.getValue('created_at');
            const shortText = formatDateFilter(createdAt, 'short');
            const longText = formatDateFilter(createdAt, 'long');

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>{shortText}</span>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <span>{longText}</span>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
    },
    {
        accessorKey: 'type',
        size: 130,
        header: () => t('table.feed.type'),
        cell: ({ row }) => {
            const type = row.getValue('type');
            return (
                <div>
                    <Badge variant="outline" class="text-muted-foreground">
                        {t(`view.feed.filters.${type}`)}
                    </Badge>
                </div>
            );
        }
    },
    {
        accessorKey: 'displayName',
        size: 190,
        header: () => t('table.feed.user'),
        cell: ({ row }) => {
            const { showUserDialog } = useUserStore();
            const original = row.original;
            return (
                <span
                    class="x-link pr-2.5"
                    onClick={() => showUserDialog(original.userId)}
                >
                    {original.displayName}
                </span>
            );
        }
    },
    {
        id: 'detail',
        header: () => t('table.feed.detail'),
        enableSorting: false,
        minSize: 100,
        meta: {
            stretch: true
        },
        cell: ({ row }) => {
            const original = row.original;
            const type = original.type;
            if (type === 'GPS') {
                return original.location ? (
                    <div class="w-full min-w-0 truncate">
                        <Location
                            location={original.location}
                            hint={original.worldName}
                            grouphint={original.groupName}
                            disableTooltip
                        />
                    </div>
                ) : null;
            }

            if (type === 'Offline' || type === 'Online') {
                return original.location ? (
                    <div class="w-full min-w-0 truncate">
                        <Location
                            location={original.location}
                            hint={original.worldName}
                            grouphint={original.groupName}
                            disableTooltip
                        />
                    </div>
                ) : null;
            }

            if (type === 'Status') {
                if (
                    original.statusDescription ===
                    original.previousStatusDescription
                ) {
                    return (
                        <div class="flex items-center">
                            <i
                                class={[
                                    'x-user-status',
                                    statusClass(original.previousStatus)
                                ]}
                            ></i>
                            <span class="mx-2">
                                <ArrowRight />
                            </span>
                            <i
                                class={[
                                    'x-user-status',
                                    statusClass(original.status)
                                ]}
                            ></i>
                        </div>
                    );
                }

                return (
                    <div class="w-full min-w-0 truncate">
                        <i
                            style="display:-webkit-inline-box"
                            class={[
                                'x-user-status',
                                'mr-2',
                                statusClass(original.status)
                            ]}
                        ></i>
                        <span style="display:-webkit-inline-box">
                            {original.statusDescription}
                        </span>
                    </div>
                );
            }

            if (type === 'Avatar') {
                return (
                    <div class="w-full min-w-0 truncate">
                        <AvatarInfo
                            imageurl={original.currentAvatarImageUrl}
                            userid={original.userId}
                            hintownerid={original.ownerId}
                            hintavatarname={original.avatarName}
                            avatartags={original.currentAvatarTags}
                        />
                    </div>
                );
            }

            if (type === 'Bio') {
                return (
                    <div class="block w-full min-w-0 truncate">
                        {original.bio}
                    </div>
                );
            }

            return null;
        }
    }
];

/**
 * Function that format the differences between two strings with HTML tags
 * markerStartTag and markerEndTag are optional, if emitted, the differences will be highlighted with yellow and underlined.
 * @param {*} s1
 * @param {*} s2
 * @param {*} markerStartTag
 * @param {*} markerEndTag
 * @returns An array that contains both the string 1 and string 2, which the differences are formatted with HTML tags
 */

//function getWordDifferences
function formatDifference(
    oldString,
    newString,
    markerAddition = '<span class="x-text-added">{{text}}</span>',
    markerDeletion = '<span class="x-text-removed">{{text}}</span>'
) {
    [oldString, newString] = [oldString, newString].map((s) =>
        s
            .replaceAll(/&/g, '&amp;')
            .replaceAll(/</g, '&lt;')
            .replaceAll(/>/g, '&gt;')
            .replaceAll(/"/g, '&quot;')
            .replaceAll(/'/g, '&#039;')
            .replaceAll(/\n/g, '<br>')
    );

    const oldWords = oldString
        .split(/\s+/)
        .flatMap((word) => word.split(/(<br>)/));
    const newWords = newString
        .split(/\s+/)
        .flatMap((word) => word.split(/(<br>)/));

    function findLongestMatch(oldStart, oldEnd, newStart, newEnd) {
        let bestOldStart = oldStart;
        let bestNewStart = newStart;
        let bestSize = 0;

        const lookup = new Map();
        for (let i = oldStart; i < oldEnd; i++) {
            const word = oldWords[i];
            if (!lookup.has(word)) lookup.set(word, []);
            lookup.get(word).push(i);
        }

        for (let j = newStart; j < newEnd; j++) {
            const word = newWords[j];
            if (!lookup.has(word)) continue;

            for (const i of lookup.get(word)) {
                let size = 0;
                while (
                    i + size < oldEnd &&
                    j + size < newEnd &&
                    oldWords[i + size] === newWords[j + size]
                ) {
                    size++;
                }
                if (size > bestSize) {
                    bestOldStart = i;
                    bestNewStart = j;
                    bestSize = size;
                }
            }
        }

        return {
            oldStart: bestOldStart,
            newStart: bestNewStart,
            size: bestSize
        };
    }

    function buildDiff(oldStart, oldEnd, newStart, newEnd) {
        const result = [];
        const match = findLongestMatch(oldStart, oldEnd, newStart, newEnd);

        if (match.size > 0) {
            // Handle differences before the match
            if (oldStart < match.oldStart || newStart < match.newStart) {
                result.push(
                    ...buildDiff(
                        oldStart,
                        match.oldStart,
                        newStart,
                        match.newStart
                    )
                );
            }

            // Add the matched words
            result.push(
                oldWords
                    .slice(match.oldStart, match.oldStart + match.size)
                    .join(' ')
            );

            // Handle differences after the match
            if (
                match.oldStart + match.size < oldEnd ||
                match.newStart + match.size < newEnd
            ) {
                result.push(
                    ...buildDiff(
                        match.oldStart + match.size,
                        oldEnd,
                        match.newStart + match.size,
                        newEnd
                    )
                );
            }
        } else {
            function build(words, start, end, pattern) {
                let r = [];
                let ts = words
                    .slice(start, end)
                    .filter((w) => w.length > 0)
                    .join(' ')
                    .split('<br>');
                for (let i = 0; i < ts.length; i++) {
                    if (i > 0) r.push('<br>');
                    if (ts[i].length < 1) continue;
                    r.push(pattern.replace('{{text}}', ts[i]));
                }
                return r;
            }

            // Add deletions
            if (oldStart < oldEnd)
                result.push(
                    ...build(oldWords, oldStart, oldEnd, markerDeletion)
                );

            // Add insertions
            if (newStart < newEnd)
                result.push(
                    ...build(newWords, newStart, newEnd, markerAddition)
                );
        }

        return result;
    }

    return buildDiff(0, oldWords.length, 0, newWords.length)
        .join(' ')
        .replace(/<br>[ ]+<br>/g, '<br><br>')
        .replace(/<br> /g, '<br>');
}
