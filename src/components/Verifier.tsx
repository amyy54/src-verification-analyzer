import Link from "next/link";
import { Component, createRef, RefObject } from "react";
import { categoryToString, checkIfNull, dateParser, displayDate, Filter, getFilteredRuns, getNullUser, getVerified, Moderator, msToTime, NotificationAlert, platformToString, playersToString, QueueRun, resolveUser, runStatusString, runStatusValue, VerifierRun } from "../Util";
import { ShowClearFilter, categoryToWeblink, playersToWeblink, gameToWeblink } from "../Renderer";
import { ParsedUrlQueryInput } from "querystring";
import { NextRouter } from "next/router";

import Notification from "./Notification";
import UserInfo from "./UserInfo";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import HomeIcon from '@mui/icons-material/Home';

interface VerifierProps {
    user: string,
    startDate?: string,
    endDate?: string,
    max?: string,
    filter?: Filter,
    router?: NextRouter
};

interface VerifierState {
    user: Moderator,
    filter: Filter,
    rangeInvalid: boolean
};

export default class Verifier extends Component<VerifierProps, VerifierState> {
    startDate: Date | undefined;
    endDate: Date | undefined;
    notification: RefObject<Notification>;
    max: number | undefined;
    constructor(props: VerifierProps) {
        super(props);
        this.state = {
            user: getNullUser(),
            filter: props.filter ? props.filter : {},
            rangeInvalid: false
        };

        if (this.props.max) {
            const tempMax = parseInt(this.props.max);
            if (!Number.isNaN(tempMax) && tempMax > 0)
                this.max = tempMax;
            else
                this.max = 200;
        }
        else
            [this.startDate, this.endDate] = dateParser(this.props.startDate, this.props.endDate);

        this.notification = createRef();
    }

    async componentDidMount(): Promise<void> {
        this.setAlert({ text: "Fetching required data. This may take a moment.", type: "warning", title: "Processing", loading: true });
        let user = await this.fetchUser();
        if (!user) return;
        let res = await this.fetchRuns(user);
        if (res) this.setAlert({ text: "Data fetching has completed.", type: "info", title: "Complete", dismissable: true });
    }

    setAlert(alert: NotificationAlert): void {
        if (this.notification.current)
            this.notification.current.updateAlert(alert);
    }

    async fetchUser(): Promise<Moderator | undefined> {
        let user = await resolveUser(this.props.user);
        if (checkIfNull(user)) {
            this.setAlert({ text: `User information failed to load for user ${this.props.user}. This could mean speedrun.com is experiencing a lot of pressure, or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
            return undefined;
        }
        this.setState({ user: user });
        return user;
    }

    async fetchRuns(user: Moderator): Promise<VerifierRun[] | undefined> {
        let runs: VerifierRun[] = [];
        let offset = 0;
        let foundStart = false;
        let firstRun = true;
        while (true) {
            let runsTmp = await getVerified(user.user, offset, this.startDate, this.endDate);

            if (!runsTmp) {
                this.setAlert({ text: `Run information failed to load at offset ${offset} for user ${user.name}. This could mean speedrun.com is experiencing a lot of pressure, the rate limit of 100 requests was reached (roughly 20,000 runs), or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
                return undefined;
            }

            offset += 200;

            if (runsTmp.length === 0)
                if (foundStart || firstRun)
                    break;
                else
                    continue;
            else if (!foundStart)
                foundStart = true;

            firstRun = false;

            runs = runs.concat(runsTmp.sort((a: VerifierRun, b: VerifierRun) => runStatusValue(b) - runStatusValue(a)));
            user.verifierRuns = runs;
            this.setState({ user: user });
            if (this.max && runs.length >= this.max) {
                if (runs.length > this.max) {
                    runs = runs.slice(0, this.max);
                    user.verifierRuns = runs;
                    this.setState({ user: user });
                }
                break;
            }
        }
        if (runs.length <= 0 && this.startDate && this.endDate) {
            let runsTmp = await getVerified(user.user, 0);
            if (!runsTmp) {
                this.setAlert({ text: `Run information failed to load for user ${user.name}. This could mean speedrun.com is experiencing a lot of pressure, the rate limit of 100 requests was reached (roughly 20,000 runs), or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
                return undefined;
            }
            runs = runsTmp;
            user.verifierRuns = runsTmp;
            this.setState({ user: user, rangeInvalid: true });
            this.setAlert({ text: `Could not find runs verified by ${user.name} in the provided date range. Displaying last 200 runs.`, type: 'error', dismissable: true });
        }
        if (runs.length <= 0) {
            this.setAlert({ text: `User ${user.name} did not have any examined runs. Double check the user and try again.`, type: "error" });
            return undefined;
        }

        return runs;
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
            let query: ParsedUrlQueryInput = { user: this.props.user };

            if (this.props.max)
                query['max'] = this.props.max;
            if (this.props.startDate)
                query['startDate'] = this.props.startDate;
            if (this.props.endDate)
                query['endDate'] = this.props.endDate;
            if (playerTmp)
                query['userFilter'] = playerTmp;
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
                <Link id="userInfoLink" href="/" passHref>
                    <IconButton className="z-10" sx={{ marginTop: "0.5rem", paddingRight: "0.5rem", position: { xs: "relative", md: "absolute" } }}>
                        <HomeIcon />
                    </IconButton>
                </Link>
                <div className="lg:flex lg:h-full lg:items-center lg:absolute">
                    <div className="w-full lg:w-96">
                        {this.startDate && this.endDate &&
                            <p className={"text-2xl mx-2 mb-2" + (this.state.rangeInvalid ? " line-through" : "")}>From <span className="font-bold">{displayDate(this.startDate)}</span> to <span className="font-bold">{displayDate(this.endDate)}</span></p>
                        }
                        {this.max &&
                            <p className="text-2xl mx-2 mb-2">Runs <span className="font-bold">{this.state.user.verifierRuns.length}</span> / <span className="font-bold">{this.max}</span></p>
                        }
                        <UserInfo runType="verifierRuns" user={this.state.user} startDate={this.state.rangeInvalid ? undefined : this.startDate} endDate={this.state.rangeInvalid ? undefined : this.endDate} />
                    </div>
                    <div className="lg:flex lg:flex-col overflow-y-scroll lg:h-full lg:items-center">
                        <TableContainer sx={{ width: { xs: "100%", lg: "95%" } }} className="lg:flex-1 my-5 mx-auto lg:overflow-auto" component={Paper}>
                            <Table stickyHeader aria-label="sticky table">
                                <colgroup>
                                    <col className="w-5 md:w-32" />
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
                                        <TableCell>Game</TableCell>
                                        <TableCell sx={{ padding: 0, textAlign: "right" }} className="min-w-[120px]"><ShowClearFilter filter={this.state.filter} position="category" updateFilter={this.updateFilter.bind(this)} /></TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell sx={{ padding: 0, textAlign: "right" }}><ShowClearFilter filter={this.state.filter} position="player" updateFilter={this.updateFilter.bind(this)} /></TableCell>
                                        <TableCell>Player(s)</TableCell>
                                        <TableCell />
                                        <TableCell>Time</TableCell>
                                        <TableCell sx={{ display: { xs: "none", xl: "table-cell" } }}>Platform</TableCell>
                                        <TableCell>Verified Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getFilteredRuns(this.state.user.verifierRuns, this.state.filter).map((v: QueueRun | VerifierRun) => (
                                        <TableRow key={v.id}>
                                            <TableCell>{gameToWeblink((v as VerifierRun))}</TableCell>
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
                                                            <FilterListIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                                {this.state.filter.player &&
                                                    <IconButton disabled className="opacity-0"><FilterListIcon /></IconButton>
                                                }
                                            </TableCell>
                                            <TableCell>{playersToWeblink(v.players.data)}</TableCell>
                                            <TableCell sx={{ padding: 0, textAlign: "right" }}>
                                                <Tooltip title="Open in New Tab">
                                                    <IconButton target="_blank" rel="noreferrer noopener" href={v.weblink}>
                                                        <OpenInNewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>{msToTime(v.times.primary_t * 1000)}</TableCell>
                                            <TableCell sx={{ display: { xs: "none", xl: "table-cell" } }}>{platformToString(v.platform.data)}</TableCell>
                                            <TableCell>{runStatusString(v.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </div>
                <Notification ref={this.notification} />
            </>
        );
    }
}
