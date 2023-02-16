import { Component } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { parseChips } from "../Util";

import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormLabel from "@mui/material/FormLabel";
import Switch from "@mui/material/Switch";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

import { MuiChipsInput } from "mui-chips-input";

interface AnalyzerFormState {
    startDate: DateTime,
    endDate: DateTime,
    chips: string[]
};

interface QueueFormState {
    chips: string[],
    orderBy: string,
    records: boolean
};

interface VerifierFormState {
    startDate: DateTime,
    endDate: DateTime,
    input: string,
    max: boolean,
    maxValue: string
};

export class AnalyzerForm extends Component<{}, AnalyzerFormState> {
    constructor(props: any) {
        super(props);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        oneMonthAgo.setHours(0, 0, 0, 0);
        let startDate = DateTime.fromJSDate(oneMonthAgo);
        const today = new Date();
        let endDate = DateTime.fromJSDate(today);

        this.state = {
            startDate: startDate,
            endDate: endDate,
            chips: []
        };
    }

    render(): JSX.Element {
        return (
            <>
                <p className="text-6xl mb-5 font-bold">Analyzer</p>
                <div className="flex flex-col">
                    <MuiChipsInput placeholder="Type game abbreviation and press enter" label="Game(s)" variant="outlined" value={this.state.chips} onKeyDown={(event) => { if (event.shiftKey && event.key === "Enter" && this.state.chips.length > 0) document.getElementById('analyzerBtn')!.click() }} onChange={(newChips) => this.setState({ chips: newChips })} />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterLuxon}>
                                <DatePicker
                                    className="mt-7"
                                    label="Start Date"
                                    value={this.state.startDate}
                                    onChange={(newValue) => {
                                        this.setState({ startDate: newValue! })
                                    }}
                                    renderInput={(params) => <TextField {...params} />}
                                    renderDay={(day, _value, DayComponentProps) => {
                                        let allowed = true;
                                        if (this.state.endDate)
                                            allowed = day <= this.state.endDate;
                                        DayComponentProps.disabled = !allowed;
                                        return (
                                            <PickersDay {...DayComponentProps} />
                                        )
                                    }} />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterLuxon}>
                                <DatePicker
                                    className="mt-7"
                                    label="End Date"
                                    value={this.state.endDate}
                                    onChange={(newValue) => {
                                        this.setState({ endDate: newValue! })
                                    }}
                                    renderInput={(params) => <TextField {...params} />}
                                    renderDay={(day, _value, DayComponentProps) => {
                                        let allowed = true;
                                        if (this.state.startDate)
                                            allowed = day >= this.state.startDate;
                                        DayComponentProps.disabled = !allowed;
                                        return (
                                            <PickersDay {...DayComponentProps} />
                                        )
                                    }} />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </div>
                <Link href={{ pathname: '/[games]', query: { games: parseChips(this.state.chips), startDate: this.state.startDate.toISODate(), endDate: this.state.endDate.toISODate() } }} passHref>
                    <Button id="analyzerBtn" disabled={this.state.chips.length <= 0} className="hover:bg-[#8b35ed] bg-[#974af0] mt-10 w-2/3 mx-auto" variant="contained">Submit</Button>
                </Link>
            </>
        );
    }
}

export class QueueForm extends Component<{}, QueueFormState> {
    constructor(props: any) {
        super(props);

        this.state = {
            chips: [],
            orderBy: "submitted",
            records: false
        };
    }

    createQueueLink(): any {
        let output: any = { pathname: '/queue/[games]', query: { games: parseChips(this.state.chips) } };
        if (this.state.records)
            output.query['records'] = "yes";
        if (this.state.orderBy !== 'submitted')
            output.query['orderby'] = this.state.orderBy;
        return output;
    }

    render(): JSX.Element {
        return (
            <>
                <p className="text-6xl mb-5 font-bold">Queue</p>
                <div className="flex flex-col">
                    <MuiChipsInput fullWidth placeholder="Type game abbreviation and press enter" label="Game(s)" variant="outlined" value={this.state.chips} onKeyDown={(event) => { if (event.shiftKey && event.key === "Enter" && this.state.chips.length > 0) document.getElementById('queueBtn')!.click() }} onChange={(newChips) => this.setState({ chips: newChips })} />
                    <Select id="queue-select" className="mt-7" value={this.state.orderBy} onChange={(event) => this.setState({ orderBy: (event.target as HTMLInputElement).value })}>
                        <MenuItem value="submitted">Submit Date</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="platform">Platform</MenuItem>
                        <MenuItem value="region">Region</MenuItem>
                        <MenuItem value="emulated">Emulated</MenuItem>
                        <MenuItem value="game">Game</MenuItem>
                        <MenuItem value="category">Category</MenuItem>
                        <MenuItem value="level">Level</MenuItem>
                    </Select>
                    <FormLabel htmlFor="queue-select">Order By</FormLabel>
                    <FormControlLabel className="mt-4" control={<Checkbox onChange={(event, checked) => this.setState({ records: checked })} />} label="Show Records" value={this.state.records} />
                </div>
                <Link href={this.createQueueLink()} passHref>
                    <Button id="queueBtn" disabled={this.state.chips.length <= 0} className="hover:bg-[#8b35ed] bg-[#974af0] mt-10 w-2/3 mx-auto" variant="contained">Submit</Button>
                </Link>
            </>
        );
    }
}

export class VerifierForm extends Component<{}, VerifierFormState> {
    constructor(props: any) {
        super(props);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        oneMonthAgo.setHours(0, 0, 0, 0);
        let startDate = DateTime.fromJSDate(oneMonthAgo);
        const today = new Date();
        let endDate = DateTime.fromJSDate(today);

        this.state = {
            startDate: startDate,
            endDate: endDate,
            input: "",
            max: false,
            maxValue: "200"
        };
    }

    checkVerifierNumAccuracy(): boolean {
        if (!this.state.max) return false;
        return Number.isNaN(parseInt(this.state.maxValue)) || parseInt(this.state.maxValue) < 1;
    }

    createVerifierLink(): any {
        let output: any = { pathname: '/verifier/[user]', query: { user: this.state.input } };
        // {{ pathname: '/verifier/[user]', query: { user: this.state.input, startDate: this.state.startDate.toISODate(), endDate: this.state.endDate.toISODate() } }}
        if (this.state.max)
            output.query['max'] = this.state.maxValue;
        else {
            output.query['startDate'] = this.state.startDate.toISODate();
            output.query['endDate'] = this.state.endDate.toISODate();
        }
        return output;
    }

    render(): JSX.Element {
        return (
            <>
                <p className="text-6xl mb-5 font-bold">Verifier</p>
                <div className="flex flex-col">
                    <TextField variant="outlined" fullWidth label="Username" value={this.state.input} onKeyDown={(event) => { if (event.shiftKey && event.key === "Enter" && this.state.input.length > 0 && !this.checkVerifierNumAccuracy()) document.getElementById('verifierBtn')!.click() }} onChange={(event) => this.setState({ input: event.target.value })} />
                    {this.state.max &&
                        <>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField className="mt-7" fullWidth label="Run Count" type="number" error={this.checkVerifierNumAccuracy()} helperText={this.checkVerifierNumAccuracy() ? "Value must be a non-negative non-zero number." : undefined} value={this.state.maxValue} onChange={(event) => this.setState({ maxValue: event.target.value })} />
                                </Grid>
                            </Grid>
                        </>
                    }
                    {!this.state.max &&
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <LocalizationProvider dateAdapter={AdapterLuxon}>
                                    <DatePicker
                                        className="mt-7"
                                        label="Start Date"
                                        value={this.state.startDate}
                                        onChange={(newValue) => {
                                            this.setState({ startDate: newValue! })
                                        }}
                                        renderInput={(params) => <TextField {...params} />}
                                        renderDay={(day, _value, DayComponentProps) => {
                                            let allowed = true;
                                            if (this.state.endDate)
                                                allowed = day <= this.state.endDate;
                                            DayComponentProps.disabled = !allowed;
                                            return (
                                                <PickersDay {...DayComponentProps} />
                                            )
                                        }} />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={6}>
                                <LocalizationProvider dateAdapter={AdapterLuxon}>
                                    <DatePicker
                                        className="mt-7"
                                        label="End Date"
                                        value={this.state.endDate}
                                        onChange={(newValue) => {
                                            this.setState({ endDate: newValue! })
                                        }}
                                        renderInput={(params) => <TextField {...params} />}
                                        renderDay={(day, _value, DayComponentProps) => {
                                            let allowed = true;
                                            if (this.state.startDate)
                                                allowed = day >= this.state.startDate;
                                            DayComponentProps.disabled = !allowed;
                                            return (
                                                <PickersDay {...DayComponentProps} />
                                            )
                                        }} />
                                </LocalizationProvider>
                            </Grid>
                        </Grid>
                    }
                    <FormControlLabel className="mt-4" control={<Switch onChange={(event, checked) => this.setState({ max: checked })} />} value={this.state.max} label={this.state.max ? "Maximum Runs" : "Date Range"} />
                </div>
                <Link href={this.createVerifierLink()} passHref>
                    <Button id="verifierBtn" disabled={this.state.input.length <= 0 || this.checkVerifierNumAccuracy()} className="hover:bg-[#8b35ed] bg-[#974af0] mt-10 w-2/3 mx-auto" variant="contained">Submit</Button>
                </Link>
            </>
        );
    }
}
