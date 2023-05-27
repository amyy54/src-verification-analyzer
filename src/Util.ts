import { DateTime, Duration } from "luxon";
import { Game, getAllRuns, getGame, getUser, NameStyleGradient, NameStyleSolid, Run, RunStatusVerified, User, Player, PlayerUser, PlayerGuest, Platform, RankedRun, getAllGameRecords, Leaderboard, getGames, RunStatus } from "src-ts";

const NULL_USER: User = { // Why did I do this? ...great question.
    id: "abcdefg",
    names: {
        international: "Unknown",
        japanese: null
    },
    supporterAnimation: false,
    pronouns: null,
    weblink: "https://speedrun.com",
    "name-style": {
        style: "solid",
        color: {
            light: "#000000",
            dark: "#ffffff"
        }
    },
    role: "user",
    signup: "N/A",
    location: null,
    twitch: null,
    hitbox: null,
    youtube: null,
    twitter: null,
    speedrunslive: null,
    assets: {
        icon: { uri: null },
        supporterIcon: null,
        image: { uri: null }
    },
    links: []
};

export type QueueRun = Run<"platform,players,level,category.variables">;
export type VerifierRun = Run<"platform,players,level,category.variables,game">;
export type GameEx = Game<"moderators,categories">;
export type OrderBy = "region" | "platform" | "level" | "category" | "game" | "emulated" | "date" | "submitted" | "status" | "verify-date";

export interface ConfigAlert {
    message: JSX.Element | string,
    type: "warning" | "error" | "info"
};

export interface NotificationAlert {
    text: string,
    type: "info" | "warning" | "error",
    loading?: boolean,
    title?: string,
    dismissable?: boolean
};

export interface Filter {
    category?: string,
    player?: string,
    exclude?: string,
    time?: number,
    pronouns?: string
};

export interface Moderator {
    name: string,
    color: string,
    runs: Run[],
    verifierRuns: VerifierRun[],
    icon_url: string | null
    user: User
};

export function shortTimeRefCompatibility(input: string, endDate: Date): Date {
    let output = new Date(endDate);
    output.setHours(0, 0, 0, 0);
    switch (input) {
        case 'lastmonth':
            output.setMonth(output.getMonth() - 1);
            break;
        case 'lastday':
            output.setDate(output.getDate() - 1);
            break;
        case 'lastweek':
            output.setDate(output.getDate() - 7);
            break;
        case 'thismonth':
            output.setDate(1);
            break;
        case 'thisday':
            // lol
            break;
        case 'thisweek':
            output.setDate(output.getDate() - output.getDay() + (output.getDay() === 0 ? -6 : 1));
            break;
        case 'thisweekmondaystart':
            output.setDate(output.getDate() - output.getDay() + (output.getDay() === 0 ? -6 : 1) + 1);
    }
    return output;
}

export function isOrderByType(keyInput: string | undefined): keyInput is OrderBy {
    if (!keyInput) return false;
    return ["region", "platform", "level", "category", "game", "emulated", "date", "submitted", "status", "verify-date"].includes(keyInput);
}

export function isVerifierRunType(runs: QueueRun[] | VerifierRun[] | QueueRun | VerifierRun): runs is VerifierRun[] | VerifierRun {
    if (Array.isArray(runs)) {
        if (runs.length > 0)
            return typeof runs[0].game === 'string';
        else
            return false;
    } else
        return typeof runs.game === 'string';
}

export function platformToString(platform: Platform | []): string {
    if (!Array.isArray(platform))
        return platform.name;
    else
        return "N/A";
}

export function playersToString(players: Player[]): string {
    let output = "";
    for (const player of players) {
        if (player.rel === "user")
            output += (player as PlayerUser).names.international + ", ";
        else
            output += (player as PlayerGuest).name + ", ";
    }
    return output.slice(0, -2);
}

export function gameToString(run: VerifierRun): string {
    if (!Array.isArray(run.game.data)) {
        return run.game.data.abbreviation.toUpperCase();
    }
    return "Unknown";
}

export function categoryToString(run: QueueRun | VerifierRun): string {
    let title = "";
    if (!Array.isArray(run.level.data))
        title += `${run.level.data.name}: `;
    if (!Array.isArray(run.category.data)) {
        title += run.category.data.name;
        for (const variable of run.category.data.variables.data)
            if (variable["is-subcategory"] && variable.id in run.values)
                title += ` - ${variable.values.values[run.values[variable.id]].label}`;
    }
    return title;
}

export async function resolveGame(gameAbv: string): Promise<GameEx | undefined> {
    if (gameAbv.includes(" ")) {
        try {
            let gameList = await getGames({ name: gameAbv, embed: "moderators,categories" });
            if (gameList.data.length > 0)
                return gameList.data[0];
        } catch (e) {
            return undefined;
        }
    } else {
        try {
            return await getGame(gameAbv, { embed: "moderators,categories" });
        } catch (e) {
            return undefined;
        };
    }
}

export function resolveGameTitle(gamesList: GameEx[], abbreviation: string): string {
    let titleTmp = "";
    let abbreviationArr = abbreviation.split(",");
    if (gamesList.length === abbreviationArr.length)
        for (const game of gamesList)
            titleTmp += game.names.international + ", ";
    else
        for (const game of abbreviationArr) {
            let filteredList = gamesList.filter(v => v.abbreviation === game || v.id === game);
            if (filteredList.length !== 1)
                titleTmp += game + ", ";
            else
                titleTmp += filteredList[0].names.international + ", ";
        }
    titleTmp.trim();
    return titleTmp.slice(0, -2);
}

export async function resolveUser(userId: string): Promise<Moderator> {
    try {
        return userObjToModerator(await getUser(userId));
    } catch (e) {
        return getNullUser(userId);
    }
}

export function getNullUser(userId?: string): Moderator {
    return {
        name: userId ? userId : "Unknown",
        color: "#000000",
        runs: [],
        verifierRuns: [],
        icon_url: null,
        user: NULL_USER
    };
}

export function checkIfNull(user: Moderator): boolean {
    return user.user.id === NULL_USER.id && user.name !== "Banned User";
}

function userObjToModerator(user: User): Moderator {
    if (user.role === "banned")
        return getNullUser("Banned User");

    let color: string;
    if (user["name-style"].style === "solid") {
        let style = (user["name-style"] as NameStyleSolid);
        color = style.color.light
    } else {
        let style = (user["name-style"] as NameStyleGradient);
        color = style["color-from"].light
    }

    return {
        name: user.names.international,
        color: color,
        runs: [],
        verifierRuns: [],
        icon_url: user.assets.image.uri,
        user: user
    }
}

export function handleEmbeddedUsers(input: GameEx, map: Map<string, Moderator>): void {
    for (const moderator of input.moderators.data) {
        if (!map.get(moderator.id))
            map.set(moderator.id, userObjToModerator(moderator));
    }
}

export async function getRuns(game: GameEx, offset: number = 0, startDate: Date, endDate: Date): Promise<Run[] | undefined> {
    try {
        let runs = await getAllRuns({ game: game.id, direction: "desc", orderby: "verify-date", max: 200, status: "verified", offset: offset }, { max: 200 });
        return runs.filter(run => convertDate((run.status as RunStatusVerified)["verify-date"]).valueOf() >= startDate.valueOf() && convertDate((run.status as RunStatusVerified)["verify-date"]).valueOf() < increaseEndDate(endDate).valueOf());
    } catch (e) {
        return undefined;
    }
}

export async function getQueue(game: GameEx, offset: number = 0, orderby: OrderBy): Promise<QueueRun[] | undefined> {
    try {
        return await getAllRuns({ game: game.id, direction: "asc", orderby: orderby, max: 200, status: "new", offset: offset, embed: "platform,players,level,category.variables" }, { max: 200 });
    } catch (e) {
        return undefined;
    }
}

export async function getVerified(user: User, offset: number = 0, startDate?: Date, endDate?: Date): Promise<VerifierRun[] | undefined> {
    try {
        let runs = await getAllRuns({ examiner: user.id, direction: "desc", orderby: "verify-date", max: 200, offset: offset, embed: "platform,players,level,category.variables,game" }, { max: 200 });
        if (startDate && endDate) {
            return runs.filter(run => convertDate((run.status as RunStatusVerified)["verify-date"]).valueOf() >= startDate.valueOf() && convertDate((run.status as RunStatusVerified)["verify-date"]).valueOf() < increaseEndDate(endDate).valueOf());
        }
        else
            return runs;
    } catch (e) {
        return undefined;
    }
}

export async function getRecords(game: GameEx): Promise<Leaderboard<"">[] | undefined> {
    try {
        return await getAllGameRecords(game.id, { top: 1, max: 200 });
    } catch (e) {
        return undefined;
    }
}

export function fetchCategory(categoryId: string, map?: Map<string, string>): string {
    if (map) {
        let name = map.get(categoryId);
        if (name)
            return name;
    }
    return `ID: ${categoryId}`;
}

export function getQueueGameList(runs: Map<GameEx, QueueRun[]>, filter: Filter, recordsMap: Map<string, RankedRun>): GameEx[] {
    let runsTmp = [...runs.keys()].filter(v => getFilteredRuns(runs.get(v)!, filter, recordsMap).length > 0);
    if (runsTmp.length === 0 && [...runs.keys()].length > 0) return [...runs.keys()]; // A game must always exist.
    return runsTmp;
}

export function getFilteredRuns(runs: QueueRun[] | VerifierRun[], filter: Filter, recordsMap?: Map<string, RankedRun>): QueueRun[] | VerifierRun[] {
    let runsTmp: any;

    if (runs.length <= 0) return [];
    if (isVerifierRunType(runs)) {
        runsTmp = runs; // Typescript is a very cool language yes this looks really stupid reading back like what.
    } else
        runsTmp = runs;

    runsTmp = runsTmp.filter((v: { category: { data: { id: string; }; }; times: { primary_t: number; }; }) => {
        if (!Array.isArray(v.category.data)) {
            if (recordsMap && recordsMap.get(v.category.data.id))
                return recordsMap.get(v.category.data.id)!.run.times.primary_t > v.times.primary_t;
            else
                return true;
        } else
            return true;
    });

    if (filter.category)
        runsTmp = runsTmp.filter((v: QueueRun | VerifierRun) => categoryToString(v) === filter.category);
    if (filter.player)
        runsTmp = runsTmp.filter((v: { players: { data: Player[]; }; }) => playersToString(v.players.data) === filter.player);
    if (filter.exclude)
        runsTmp = runsTmp.filter((v: QueueRun | VerifierRun) => categoryToString(v) !== filter.exclude);
    if (filter.time)
        runsTmp = runsTmp.filter((v: { times: { primary_t: number; }; }) => v.times.primary_t < filter.time!);
    if (filter.pronouns)
        runsTmp = runsTmp.filter((v: { players: { data: any; }; }) => {
            for (const player of v.players.data) {
                if (player.rel === 'user') {
                    let playerTmp = (player as PlayerUser);
                    if (playerTmp.pronouns && playerTmp.pronouns.indexOf(filter.pronouns!) !== -1)
                        return true;
                    else if (!playerTmp.pronouns && filter.pronouns! === 'null')
                        return true;
                }
            }
            return false;
        })
    return runsTmp;
}

function increaseEndDate(input: Date): Date {
    let output = new Date(input);
    output.setHours(0, 0, 0, 0);
    output.setDate(input.getDate() + 1);
    return output;
}

export function renderDaysDiff(startDate: Date, endDate: Date): string {
    let diff = getDaysDiff(startDate, endDate) - 1;
    if (diff === 1)
        return "1 day";
    else
        return `${diff} days`;
}

function getDaysDiff(startDate: Date, endDate: Date): number {
    let dateDiff = increaseEndDate(endDate).valueOf() - startDate.valueOf();
    return Math.floor(dateDiff / 86400000);
}

export function averageRunsPerDay(runs: Run[] | VerifierRun[], startDate: Date, endDate: Date): string {
    return parseFloat((runs.length / (getDaysDiff(startDate, endDate))).toString()).toFixed(2);
}

export function convertDate(input: string | null | undefined): Date {
    if (!input)
        return new Date(0);
    else if (input.endsWith("Z")) // Submitted Date (2023-01-05T03:15:06Z)
        return new Date(input);
    else // Regular Date (2023-01-05). Treat standard date as midnight for current timezone. Ignores timezone stupidity across all queries.
        return new Date(`${input}T00:00:00`);
}

export function displayDate(date: Date | string | null | undefined, removeTime: boolean = false, isoDate: boolean = false): string {
    let dateTmp: Date;
    if (!date || typeof date === 'string') dateTmp = convertDate(date);
    else dateTmp = date;

    let dateTime = DateTime.fromJSDate(dateTmp);

    if (isoDate) {
        let datetimeISO = dateTime.toISODate();
        if (datetimeISO) return datetimeISO;
    }

    if (removeTime || (dateTime.get('hour') === 0 && dateTime.get('minute') === 0 && dateTime.get('second') === 0))
        return dateTime.toLocaleString(DateTime.DATE_MED);
    else
        return dateTime.toLocaleString(DateTime.DATETIME_MED);
}

export function dateParser(startDate: string | undefined, endDate: string | undefined): Date[] {
    let startDateOut: Date;
    let endDateOut: Date;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    if (startDate)
        startDateOut = convertDate(startDate);
    else
        startDateOut = oneMonthAgo;

    if (endDate)
        endDateOut = convertDate(endDate);
    else
        endDateOut = new Date();

    if (startDateOut.valueOf() > endDateOut.valueOf()) {
        endDateOut = new Date();
        startDateOut = oneMonthAgo;
    }
    return [startDateOut, endDateOut];
}

export function runStatusValue(run: Run | QueueRun | VerifierRun): number {
    const status = run.status;
    if (status.status === 'verified') {
        const newStatus = (status as RunStatusVerified);
        if (newStatus["verify-date"])
            return convertDate(newStatus["verify-date"]).valueOf();
    }
    return convertDate(run.date).valueOf();
}

export function runStatusString(status: RunStatus): string {
    if (status.status === 'verified') {
        const newStatus = (status as RunStatusVerified);
        if (newStatus["verify-date"])
            return displayDate((status as RunStatusVerified)["verify-date"], true);
        else
            return "Verified";
    } else
        return "Rejected";
}

export function msToTime(duration: number): string {
    let time = Duration.fromMillis(duration);
    if (duration % 1000 !== 0)
        return time.toFormat("hh:mm:ss.SSS");
    else
        return time.toFormat("hh:mm:ss");
}

export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function parseChips(input: string[]): string {
    let output = "";
    for (const chip of input)
        output += chip + ",";
    return output.slice(0, -1);
}
