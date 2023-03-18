import { Component, createRef, RefObject } from "react";
import { Filter, getFilteredRuns, displayDate, getQueue, msToTime, resolveGame, QueueRun, GameEx, playersToString, categoryToString, platformToString, getQueueGameList, isOrderByType, getRecords, NotificationAlert, OrderBy, VerifierRun } from "../Util";
import { RegionSvg, ShowClearFilter, categoryToWeblink, playersToWeblink } from "../Renderer";
import { NextRouter } from "next/router";
import { ParsedUrlQueryInput } from "querystring";
import { RankedRun } from "src-ts";
import Link from "next/link";

import Notification from "./Notification";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import HomeIcon from '@mui/icons-material/Home';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface QueueProps {
    games: string,
    orderby?: string,
    records: boolean,
    filter?: Filter,
    router?: NextRouter
};

interface QueueState {
    runs: Map<GameEx, QueueRun[]>,
    filter: Filter,
    categoriesMap: Map<string, RankedRun>,
    shiftPressed: boolean
};

export default class Queue extends Component<QueueProps, QueueState> {
    notification: RefObject<Notification>;
    orderby: OrderBy = "submitted";
    keyFunc: any;
    constructor(props: QueueProps) {
        super(props);

        this.keyFunc = this.onKey.bind(this); // React is weird.

        if (isOrderByType(props.orderby))
            this.orderby = props.orderby;

        this.state = {
            runs: new Map<GameEx, QueueRun[]>(),
            filter: props.filter ? props.filter : {},
            categoriesMap: new Map<string, RankedRun>(),
            shiftPressed: false
        };

        this.notification = createRef();
    }

    async componentDidMount(): Promise<void> {
        document.addEventListener('keydown', this.keyFunc);
        document.addEventListener('keyup', this.keyFunc);

        this.setAlert({ text: "Fetching required data. This may take a moment.", type: "warning", loading: true, title: "Processing" });
        let games = await this.defineGames();
        if (!games) return;
        let runs = await this.defineQueue(games);
        if (!runs) return;
        if (this.props.records)
            await this.loadRecords(runs);
        this.setAlert({ text: "Data fetching has completed.", type: "info", title: "Complete", dismissable: true });
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keyFunc);
        document.removeEventListener('keyup', this.keyFunc);
    }

    onKey(event: KeyboardEvent): void {
        this.setState({ shiftPressed: event.shiftKey });
    }

    async defineGames(): Promise<Map<GameEx, QueueRun[]> | undefined> {
        let gamesTmp = new Map<GameEx, QueueRun[]>();
        for (const game of this.props.games.split(",")) {
            let gameTmp = await resolveGame(game.trim());
            if (!gameTmp) {
                this.setAlert({ text: `Game information failed to load for game ${game}. This could mean speedrun.com is experiencing a lot of pressure, or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
                return undefined;
            }

            gamesTmp.set(gameTmp, []);
        }
        return gamesTmp;
    }

    async defineQueue(games: Map<GameEx, QueueRun[]>): Promise<Map<GameEx, QueueRun[]> | undefined> {
        for (const game of [...games.keys()]) {
            let offset = 0;
            while (true) {
                let runsTmp = await getQueue(game, offset, this.orderby);

                if (!runsTmp) {
                    this.setAlert({ text: `Queue information failed to load at offset ${offset} for game ${game.abbreviation}. This could mean speedrun.com is experiencing a lot of pressure, the rate limit of 100 requests was reached (roughly 20,000 runs), or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
                    return undefined;
                }

                offset += 200;

                if (runsTmp.length === 0)
                    break;

                games.set(game, games.get(game)!.concat(runsTmp));
                this.setState({ runs: games });
            }
        }
        return games;
    }

    async loadRecords(runs: Map<GameEx, QueueRun[]>): Promise<void> {
        const categoriesMap = new Map<string, RankedRun>();
        for (const game of [...runs.keys()]) {
            let records = await getRecords(game);

            if (!records) {
                this.setAlert({ text: `Record information for game ${game.abbreviation} failed to load. This could mean speedrun.com is experiencing a lot of pressure, the rate limit of 100 requests was reached (roughly 20,000 runs), or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
                return;
            }

            for (const leaderboard of records)
                if (leaderboard.runs.length > 0)
                    categoriesMap.set(leaderboard.category, leaderboard.runs[0]);
        }
        this.setState({ categoriesMap: categoriesMap });
    }

    setAlert(alert: NotificationAlert): void {
        if (this.notification.current)
            this.notification.current.updateAlert(alert);
    }

    updateFilter(category?: string | null, player?: string | null, exclude?: string | null): void {
        let categoryTmp = category !== undefined ? category === null ? undefined : category : this.state.filter.category;
        let playerTmp = player !== undefined ? player === null ? undefined : player : this.state.filter.player;
        let excludeTmp = exclude !== undefined ? exclude === null ? undefined : exclude : this.state.filter.exclude;
        this.setState((state) => {
            return {
                filter: {
                    category: categoryTmp,
                    player: playerTmp,
                    exclude: excludeTmp,
                    time: state.filter.time,
                    pronouns: state.filter.pronouns
                }
            };
        });

        if (this.props.router) {
            let query: ParsedUrlQueryInput = { games: this.props.games };

            if (this.props.orderby)
                query['orderby'] = this.props.orderby;
            if (this.props.records)
                query['records'] = 'yes';
            if (playerTmp)
                query['user'] = playerTmp;
            if (categoryTmp)
                query['category'] = categoryTmp;
            if (excludeTmp)
                query['exclude'] = excludeTmp;
            if (this.state.filter.time)
                query['time'] = this.state.filter.time;
            if (this.state.filter.pronouns)
                query['pronouns'] = this.state.filter.pronouns;

            this.props.router.push({ query: query }, undefined, { shallow: true });
        }
    }

    render(): JSX.Element {
        return (
            <>
                <Link href="/" passHref>
                    <IconButton className="md:absolute md:pr-2 mt-2">
                        <HomeIcon />
                    </IconButton>
                </Link>
                <div className="sm:flex sm:flex-col sm:h-full">
                    {getQueueGameList(this.state.runs, this.state.filter, this.state.categoriesMap).map((game: GameEx, index: number) => (
                        <>
                            <div className="sm:flex-initial">
                                <p className={"text-2xl my-3 " + (index === 0 ? "mx-10" : "mx-2")}>{game.names.international} - <span className="font-bold">{getFilteredRuns(this.state.runs.get(game)!, this.state.filter, this.state.categoriesMap).length}</span></p>
                            </div>
                            <TableContainer sx={{ width: { xs: "100%", md: "85%" } }} className="sm:flex-1 mb-5 mx-auto sm:overflow-auto" key={game.abbreviation} component={Paper}>
                                <Table stickyHeader aria-label="sticky table">
                                    <colgroup>
                                        <col className="w-1" />
                                        <col className="w-5 md:w-32" />
                                        <col className="w-1" />
                                        <col className="w-5 md:w-48" />
                                        <col className="w-1" />
                                        <col className="w-5 md:w-32" />
                                        <col className="w-5 md:w-32" />
                                        <col className="w-5 md:w-32" />
                                    </colgroup>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ padding: 0, textAlign: "right" }} className="min-w-[120px]"><ShowClearFilter filter={this.state.filter} position="category" updateFilter={this.updateFilter.bind(this)} /></TableCell>
                                            <TableCell>Category</TableCell>
                                            <TableCell sx={{ padding: 0, textAlign: "right" }}><ShowClearFilter filter={this.state.filter} position="player" updateFilter={this.updateFilter.bind(this)} /></TableCell>
                                            <TableCell>Player(s)</TableCell>
                                            <TableCell />
                                            <TableCell>Time</TableCell>
                                            <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Platform</TableCell>
                                            <TableCell>Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {getFilteredRuns(this.state.runs.get(game)!, this.state.filter, this.state.categoriesMap).map((v: QueueRun | VerifierRun) => (
                                            <TableRow key={v.id}>
                                                <TableCell sx={{ padding: 0, textAlign: "right" }} className="min-w-[120px]">
                                                    {!this.state.filter.category &&
                                                        <Tooltip title={`Filter for "${categoryToString(v)}"`}>
                                                            <IconButton onClick={() => this.updateFilter(categoryToString(v))}>
                                                                <FilterListIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    }
                                                    {this.state.filter.category &&
                                                        <IconButton disabled className="opacity-0"><FilterListIcon /></IconButton>
                                                    }
                                                    {!this.state.filter.exclude && !this.state.filter.category &&
                                                        <Tooltip title={`Exclude "${categoryToString(v)}"`}>
                                                            <IconButton onClick={() => this.updateFilter(undefined, undefined, categoryToString(v))}>
                                                                <RemoveCircleOutlineIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    }
                                                    {(this.state.filter.exclude || this.state.filter.category) &&
                                                        <IconButton disabled className="opacity-0"><RemoveCircleOutlineIcon /></IconButton>
                                                    }
                                                </TableCell>
                                                <TableCell>{categoryToWeblink(v)}</TableCell>
                                                <TableCell sx={{ padding: 0, textAlign: "right" }}>
                                                    {!this.state.filter.player &&
                                                        <Tooltip title={`Filter for "${playersToString(v.players.data)}"`}>
                                                            <IconButton onClick={() => this.updateFilter(undefined, playersToString(v.players.data))}>
                                                                <Badge badgeContent={getFilteredRuns(this.state.runs.get(game)!, { player: playersToString(v.players.data), category: this.state.filter.category, exclude: this.state.filter.exclude, time: this.state.filter.time }, this.state.categoriesMap).length - 1} color="primary">
                                                                    <FilterListIcon />
                                                                </Badge>
                                                            </IconButton>
                                                        </Tooltip>
                                                    }
                                                    {this.state.filter.player &&
                                                        <IconButton disabled className="opacity-0"><FilterListIcon /></IconButton>
                                                    }
                                                </TableCell>
                                                <TableCell>{playersToWeblink(v.players.data)}</TableCell>
                                                <TableCell sx={{ padding: 0, textAlign: "right" }}>
                                                    {this.state.shiftPressed &&
                                                        <Tooltip title="Copy Run Identifier">
                                                            <IconButton onClick={async () => {await navigator.clipboard.writeText(`${playersToString(v.players.data)} ${categoryToString(v)}`)}}>
                                                                <ContentCopyIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    }
                                                    {!this.state.shiftPressed &&
                                                        <Tooltip title="Open in New Tab">
                                                            <IconButton target="_blank" rel="noreferrer noopener" href={v.weblink}>
                                                                <OpenInNewIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    }
                                                </TableCell>
                                                <TableCell>{msToTime(v.times.primary_t * 1000)}</TableCell>
                                                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                                                    <RegionSvg region={v.system.region} /> {platformToString(v.platform.data)}
                                                </TableCell>
                                                <TableCell>{displayDate(v.date)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ))}
                </div>
                <Notification ref={this.notification} />
            </>
        );
    }
}
