import { Component, createRef, RefObject } from "react";
import { Run, RunStatusVerified } from "src-ts";
import { Moderator, resolveGame, getRuns, resolveUser, resolveGameTitle, displayDate, handleEmbeddedUsers, averageRunsPerDay, renderDaysDiff, getNullUser, GameEx, NotificationAlert, dateParser } from "../Util";
import { BaseDataEntry } from 'react-minimal-pie-chart/types/commonTypes';
import Link from "next/link";

import Avatar from "@mui/material/Avatar";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel"
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";

import HomeIcon from '@mui/icons-material/Home';

import Notification from "./Notification";
import PieChart from "./Chart";
import UserInfo from "./UserInfo";

interface AnalyzerProps {
    games: string,
    startDate?: string,
    endDate?: string,
    pronounFilter?: string // Thanks aspyn.
};

interface AnalyzerState {
    chartData: BaseDataEntry[],
    moderators: Moderator[],
    games: GameEx[],
    runs: Run[],
    categories: Map<string, string>,
    selected: Moderator | undefined,
    lastSelected: Moderator,
    userListCompact: boolean
};

export default class Analyzer extends Component<AnalyzerProps, AnalyzerState> {
    startDate: Date;
    endDate: Date;
    pronounFilter: string | undefined;
    notification: RefObject<Notification>;
    chart: RefObject<PieChart>;
    constructor(props: AnalyzerProps) {
        super(props);
        this.state = {
            chartData: [],
            moderators: [],
            games: [],
            runs: [],
            categories: new Map<string, string>(),
            selected: undefined,
            lastSelected: getNullUser(),
            userListCompact: false
        };

        this.notification = createRef();
        this.chart = createRef();

        [this.startDate, this.endDate] = dateParser(this.props.startDate, this.props.endDate);

        this.pronounFilter = this.props.pronounFilter;
    }

    async componentDidMount(): Promise<void> {
        this.setAlert({ text: "Fetching required data. This may take a moment.", type: "warning", title: "Processing", loading: true });
        let games = await this.defineGames();
        let res = await this.processGameInfo(games);
        if (res) this.setAlert({ text: "Data fetching has completed.", type: "info", title: "Complete", dismissable: true });
    }

    setAlert(alert: NotificationAlert): void {
        if (this.notification.current)
            this.notification.current.updateAlert(alert);
    }

    async defineGames(): Promise<GameEx[]> {
        let gamesTmp: GameEx[] = [];
        for (const game of this.props.games.split(",")) {
            let gameTmp = await resolveGame(game.trim());
            if (!gameTmp) {
                this.setAlert({ text: `Game information failed to load for game ${game}. This could mean speedrun.com is experiencing a lot of pressure, or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
                return gamesTmp;
            }
            gamesTmp.push(gameTmp);
            this.setState({ games: gamesTmp });
        }
        return gamesTmp;
    }

    async processGameInfo(games: GameEx[]): Promise<boolean> {
        let runs: Run[] = [];
        const moderators = new Map<string, Moderator>();
        const categories = new Map<string, string>();

        for (const game of games) {
            for (const category of game.categories.data) {
                categories.set(category.id, category.name);
            }
            handleEmbeddedUsers(game, moderators);
            let offset = 0
            let foundStart = false;
            let firstRun = true;
            while (true) {
                let runsTmp = await getRuns(game, offset, this.startDate, this.endDate);

                if (!runsTmp) {
                    this.setAlert({ text: `Run information failed to load at offset ${offset} for game ${game.abbreviation}. This could mean speedrun.com is experiencing a lot of pressure, the rate limit of 100 requests was reached (roughly 20,000 runs), or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error" });
                    return false;
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

                runs = runs.concat(runsTmp);
                await this.updateChartInfo(runsTmp, moderators);
                this.setState({ runs: runs });
            }
            this.setState({ categories: categories });
        }
        return runs.length > 0;
    }

    async updateChartInfo(runs: Run[], moderators: Map<string, Moderator>): Promise<void> {
        let output: BaseDataEntry[] = [];
        for (const run of runs) {
            const examiner = (run.status as RunStatusVerified).examiner;
            if (!moderators.get(examiner)) {
                let user = await resolveUser(examiner);
                if (user.name === examiner) {
                    this.setAlert({ text: `User information failed to load for user Id ${examiner}. This could mean speedrun.com is experiencing a lot of pressure, the rate limit of 100 requests was reached (roughly 20,000 runs), or something went wrong internally. If this happens repeatedly, please contact the developer.`, type: "error", title: "Error", dismissable: true });
                }
                moderators.set(examiner, user);
            }

            // Dear Microsoft: Fix maps please. Okay ty.
            moderators.get(examiner)!.runs.push(run);
        }

        let moderatorsArr = [...moderators.values()];
        moderatorsArr = moderatorsArr.sort((a: Moderator, b: Moderator) => { return b.runs.length - a.runs.length });

        moderatorsArr = moderatorsArr.filter((value: Moderator) => value.runs.length > 0);

        if (this.pronounFilter)
            moderatorsArr = moderatorsArr.filter((value: Moderator) => value.user.pronouns && value.user.pronouns.indexOf(this.pronounFilter!) !== -1);

        for (const value of moderatorsArr)
            output.push({
                color: value.color,
                value: value.runs.length,
                title: value.name
            });

        this.setState({ chartData: output, moderators: moderatorsArr });
    }

    updateChartHoverState(index: number | undefined): void {
        if (this.chart.current)
            this.chart.current.setHovered(index);
    }

    updateChartSelectedState(index: number | undefined): void {
        if (this.chart.current) {
            if (index === undefined || this.state.selected === this.state.moderators[index]) {
                this.chart.current.setSelected(undefined);
                this.setState({ selected: undefined });
            }
            // else if (this.state.selected !== undefined) {
            //     this.chart.current.setSelected(index);
            //     this.setState({selected: undefined});
            //     setTimeout(() => {
            //         this.setState({selected: this.state.moderators[index], lastSelected: this.state.moderators[index]});
            //     }, 270);
            // }
            else {
                document.getElementById('card')?.scrollIntoView({ behavior: 'smooth' });
                this.chart.current.setSelected(index);
                this.setState({ selected: this.state.moderators[index], lastSelected: this.state.moderators[index] });
            }
        }
    }

    getModeratorSelected(index: number): Moderator {
        return this.state.moderators[index];
    }

    render(): JSX.Element {
        return (
            <>
                <Link href="/" passHref>
                    <IconButton sx={{ marginTop: "0.5rem", paddingRight: "0.5rem", position: {xs: "relative", md: "absolute"} }}>
                        <HomeIcon />
                    </IconButton>
                </Link>
                <div className="md:h-screen w-screen md:flex md:flex-col md:flex-nowrap">
                    <p className="text-4xl mx-4 md:mx-10 font-bold my-2">{resolveGameTitle(this.state.games, this.props.games)}</p>
                    <p className="text-2xl mx-6 md:mx-16 mb-2">From <span className="font-bold">{displayDate(this.startDate)}</span> to <span className="font-bold">{displayDate(this.endDate)}</span> ({renderDaysDiff(this.startDate, this.endDate)})</p>
                    <p className="text-2xl mx-6 md:mx-16 mb-2"><span className="font-bold">Runs: </span>{this.state.runs.length}</p>
                    <p className="text-2xl mx-6 md:mx-16 mb-2"><span className="font-bold">Average Runs Verified Per Day: </span>{averageRunsPerDay(this.state.runs, this.startDate, this.endDate)}</p>
                    <div className="hidden md:block">
                        <FormGroup className="w-48">
                            <FormControlLabel control={<Switch inputProps={{ 'aria-label': 'controlled' }} checked={this.state.userListCompact} onChange={(event) => {this.setState({ userListCompact: event.target.checked })}} className="ml-5" />} label="Compact List" />
                        </FormGroup>
                    </div>
                    <div className="md:flex-1 relative">
                        <div className="md:flex md:h-full md:w-full absolute">
                            <div className="md:mx-2 md:pr-4 overflow-y-scroll w-full md:w-fit">
                                <table className="w-full">
                                    <tbody>
                                        {this.state.moderators.map((item: Moderator, index: number) => (
                                            <tr className="cursor-pointer" key={item.name} style={{ backgroundColor: item.color }} onMouseOver={this.updateChartHoverState.bind(this, index)} onMouseOut={this.updateChartHoverState.bind(this, undefined)} onClick={this.updateChartSelectedState.bind(this, index)}>
                                                {item.icon_url &&
                                                    <td><Avatar sx={this.state.userListCompact ? { width: 20, height: 20 } : {}} className={this.state.userListCompact ? "my-0.5 ml-0.5" : "my-1.5 ml-1.5"} alt={item.name} src={item.icon_url}></Avatar></td>
                                                }
                                                {!item.icon_url &&
                                                    <td><Avatar className={this.state.userListCompact ? "my-0.5 ml-0.5" : "my-1.5 ml-1.5"} alt={item.name} sx={this.state.userListCompact ? { width: 20, height: 20, bgcolor: item.color } : { bgcolor: item.color }}></Avatar></td>
                                                }
                                                {item.color === "#000000" &&
                                                    <>
                                                        <td className="text-white px-2"><p>{item.name}</p></td>
                                                        <td className="text-white pr-2"><p className="font-bold text-right">{item.runs.length}</p></td>
                                                    </>
                                                }
                                                {item.color !== "#000000" &&
                                                    <>
                                                        <td className="px-2"><p>{item.name}</p></td>
                                                        <td className="pr-2"><p className="font-bold text-right">{item.runs.length}</p></td>
                                                    </>
                                                }
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:mx-20 w-screen md:w-1/3 md:grow 2xl:grow-0">
                                {this.state.chartData &&
                                    <PieChart ref={this.chart} analyzer={this} data={this.state.chartData} />
                                }
                            </div>
                            <div id="card" className="2xl:hidden">
                                <Collapse in={this.state.selected !== undefined} orientation="horizontal">
                                    <div className="w-full md:w-96">
                                        <UserInfo runType="runs" user={this.state.lastSelected} runs={this.state.runs} categories={this.state.categories} endDate={this.endDate} startDate={this.startDate} />
                                    </div>
                                </Collapse>
                            </div>
                            <div id="card" className="hidden 2xl:block">
                                <Collapse in={this.state.selected !== undefined}>
                                    <div className="w-full md:w-96">
                                        <UserInfo runType="runs" user={this.state.lastSelected} runs={this.state.runs} categories={this.state.categories} endDate={this.endDate} startDate={this.startDate} />
                                    </div>
                                </Collapse>
                            </div>
                        </div>
                    </div>
                </div>
                <Notification ref={this.notification} />
            </>
        );
    }
}
