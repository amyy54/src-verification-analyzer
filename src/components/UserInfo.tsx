import { Component } from "react";
import { Run, RunStatusVerified } from "src-ts";
import { convertDate, Moderator, displayDate, msToTime, averageRunsPerDay, fetchCategory, VerifierRun, categoryToString, gameToString, checkIfNull } from "../Util";

import Avatar from "@mui/material/Avatar";
import Accordion from "@mui/material/Accordion";
import Link from "@mui/material/Link";
import * as NextLink from "next/link";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Skeleton from "@mui/material/Skeleton";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import SearchIcon from '@mui/icons-material/Search';

interface UserInfoProps {
    user: Moderator,
    runType: "runs" | "verifierRuns",
    runs?: Run[],
    categories?: Map<string, string>,
    startDate?: Date,
    endDate?: Date
};

export default class UserInfo extends Component<UserInfoProps> {
    constructor(props: UserInfoProps) {
        super(props);
    }

    getRuns(): Run[] | VerifierRun[] {
        return this.props.runType === 'runs' ? this.props.user.runs : this.props.user.verifierRuns;
    }

    averageRunsVerifiedPerDay(): string {
        if (this.props.endDate && this.props.startDate) {
            return averageRunsPerDay(this.getRuns(), this.props.startDate, this.props.endDate);
        } else
            return "Unknown";
    }

    averageRunLength(): string {
        let timesArr: number[] = [];
        for (const run of this.getRuns()) {
            timesArr.push(run.times.primary_t);
        }
        if (timesArr.length > 0) {
            let timesRes = timesArr.reduce((a: number, b: number) => a + b) / timesArr.length;
            return msToTime(timesRes * 1000);
        } else
            return "0.00";
    }

    mostFrequentVerifiedCategories(): string {
        let userRuns = this.props.user.runs;
        if (this.props.runType === 'runs') {
            let runs = userRuns.sort((a: Run, b: Run) =>
                userRuns.filter((v: Run) => v.category === b.category).length
                - userRuns.filter((v: Run) => v.category === a.category).length
            );
            if (runs.length > 0)
                return fetchCategory(runs[0].category, this.props.categories);
            else
                return "Unknown";
        } else {
            let verifierRuns = this.props.user.verifierRuns;
            let runs = verifierRuns.sort((a: VerifierRun, b: VerifierRun) =>
                verifierRuns.filter((v: VerifierRun) => v.category.data === b.category.data).length
                - verifierRuns.filter((v: VerifierRun) => v.category.data === a.category.data).length);
            console.log(runs);
            if (runs.length > 0)
                return `${gameToString(runs[0])} - ${categoryToString(runs[0])}`;
            else
                return "Unknown";
        }
    }

    calculatePercent(): string {
        if (this.props.runs)
            return parseFloat(((this.getRuns().length / this.props.runs.length) * 100).toString()).toFixed(2) + "%";
        else
            return "100.00%";
    }

    lastRunVerified(): Run[] | VerifierRun[] {
        return this.getRuns().sort((a: Run | VerifierRun, b: Run | VerifierRun) => convertDate((b.status as RunStatusVerified)["verify-date"]).valueOf() - convertDate((a.status as RunStatusVerified)["verify-date"]).valueOf());
    }

    renderLastRunVerified(): JSX.Element {
        let run = this.lastRunVerified();
        if (run.length > 0)
            return (
                <Link target="_blank" underline="hover" rel="noreferrer noopener" href={run[0].weblink}>{displayDate((run[0].status as RunStatusVerified)["verify-date"])}</Link>
            )
        else
            return <>Unknown</>;
    }

    render(): JSX.Element {
        return (
            <Card>
                <div className="pt-1 flex flex-col items-center place-content-evenly">
                    {this.props.user.icon_url &&
                        <Avatar className="my-1.5 ml-1.5" alt={this.props.user.name} src={this.props.user.icon_url} sx={{ width: 100, height: 100 }}></Avatar>
                    }
                    {!this.props.user.icon_url && !checkIfNull(this.props.user) &&
                        <Avatar className="my-1.5 ml-1.5" alt={this.props.user.name} sx={{ width: 100, height: 100, backgroundColor: this.props.user.color }}></Avatar>
                    }
                    {checkIfNull(this.props.user) &&
                        <Skeleton className="my-1.5 ml-1.5" variant="circular" width={100} height={100} />
                    }
                    <p className={"text-2xl font-bold" + (this.props.runType === 'runs' ? " pl-10" : "")}>
                        <Link target="_blank" underline="hover" rel="noreferrer noopener" href={this.props.user.user.weblink}>{checkIfNull(this.props.user) ? <Skeleton width={150} /> : this.props.user.name}</Link>
                        {this.props.runType === 'runs' &&
                            <NextLink.default href={{ pathname: '/verifier/[user]', query: { user: this.props.user.name, startDate: displayDate(this.props.startDate, undefined, true), endDate: displayDate(this.props.endDate, undefined, true) } }} passHref>
                                <Tooltip title="View Runs">
                                    <IconButton>
                                        <SearchIcon />
                                    </IconButton>
                                </Tooltip>
                            </NextLink.default>
                        }
                    </p>
                    <p className={`text-lg ${this.props.user.user.pronouns ? "" : "opacity-0"}`}>{this.props.user.user.pronouns ? this.props.user.user.pronouns : "She/Her"}</p>
                </div>
                <hr className="border-2 w-full border-black"></hr>
                <table className="w-full h-full overflow-y-scroll table-fixed">
                    <colgroup>
                        <col className="w-[40%]" />
                        <col className="w-[60%]" />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td><p className="text-lg ml-3 font-bold">Runs Verified:</p></td>
                            <td><p className="text-lg mr-3 text-right">{checkIfNull(this.props.user) || this.getRuns().length <= 0 ? <Skeleton /> : `${this.getRuns().length} ${this.props.runType === 'runs' ? "/ " + this.calculatePercent() : ""}`}</p></td>
                        </tr>
                        <tr>
                            <td><p className="text-lg ml-3 font-bold">Average Runs Verified Per Day:</p></td>
                            <td><p className="text-lg mr-3 text-right">{checkIfNull(this.props.user) || this.getRuns().length <= 0 ? <Skeleton /> : this.averageRunsVerifiedPerDay()}</p></td>
                        </tr>
                        <tr>
                            <td><p className="text-lg ml-3 font-bold">Last Verified Run:</p></td>
                            <td><p className="text-lg mr-3 text-right">{checkIfNull(this.props.user) || this.getRuns().length <= 0 ? <Skeleton /> : this.renderLastRunVerified()}</p></td>
                        </tr>
                        <tr>
                            <td><p className="text-lg ml-3 font-bold">Most Verified Category:</p></td>
                            <td><p className="text-lg mr-3 text-right">{checkIfNull(this.props.user) || this.getRuns().length <= 0 ? <Skeleton /> : this.mostFrequentVerifiedCategories()}</p></td>
                        </tr>
                        <tr>
                            <td><p className="text-lg ml-3 font-bold">Average Run Length:</p></td>
                            <td><p className="text-lg mr-3 text-right">{checkIfNull(this.props.user) || this.getRuns().length <= 0 ? <Skeleton /> : this.averageRunLength()}</p></td>
                        </tr>
                    </tbody>
                </table>
                <hr className="border-2 w-full border-black"></hr>
                {false /*this.props.runType === 'runs' */ &&
                    <div>
                        <Accordion sx={{ bgcolor: "#b879ff" }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="runaccordian"
                                id="runaccordian-header"
                            >
                                <p className="font-bold">Verified Runs</p>
                            </AccordionSummary>
                            <AccordionDetails>
                                <table className="w-full table-fixed">
                                    <colgroup>
                                        <col className="w-1/3" />
                                        <col className="w-1/3" />
                                        <col className="w-1/3" />
                                    </colgroup>
                                    <tbody>
                                        <tr>
                                            <th className="text-left">Category</th>
                                            <th className="text-center">Time</th>
                                            <th className="text-right">Verify Date</th>
                                        </tr>
                                        <>
                                            {this.props.user.runs.sort((a: Run, b: Run) => convertDate((b.status as RunStatusVerified)["verify-date"]).valueOf() - convertDate((a.status as RunStatusVerified)["verify-date"]).valueOf()).map((v: Run, index: number) => (
                                                <tr key={index}>
                                                    <td>{fetchCategory(v.category, this.props.categories)}</td>
                                                    <td className="text-center"><Link target="_blank" underline="hover" rel="noreferrer noopener" href={v.weblink}>{msToTime(v.times.primary_t * 1000)}</Link></td>
                                                    <td className="text-right">{displayDate((v.status as RunStatusVerified)["verify-date"], true)}</td>
                                                </tr>
                                            ))}
                                        </>
                                    </tbody>
                                </table>
                            </AccordionDetails>
                        </Accordion>
                    </div>
                }
            </Card>
        );
    }
}
