import { ChangeEvent, Component } from "react";
import { AnalyzerForm, QueueForm, VerifierForm } from "../components/HomeForms";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";

import DatasetLinkedIcon from '@mui/icons-material/DatasetLinked';
import QueueIcon from '@mui/icons-material/Queue';
import PersonIcon from '@mui/icons-material/Person';

interface IndexState {
    selectedItem: string,
    bottomNavigationItem: number
}

export default class IndexPage extends Component<{}, IndexState> {
    constructor(props: any) {
        super(props);

        this.state = {
            selectedItem: "analyzer",
            bottomNavigationItem: 0
        };
    }

    componentDidMount(): void {
        if (window.location.hash.length > 0) {
            let hash = window.location.hash.substring(1);
            this.setState({ selectedItem: hash, bottomNavigationItem: hash === "queue" ? 1 : 2 });
        }
    }

    handleBottomNavigationChange(value: number): void {
        console.log(value);
        if (value === 0) {
            this.setState({ selectedItem: "analyzer", bottomNavigationItem: 0 });
            window.location.hash = '';
        }
        else if (value === 1) {
            this.setState({ selectedItem: "queue", bottomNavigationItem: 1 });
            window.location.hash = "queue";
        }
        else if (value === 2) {
            this.setState({ selectedItem: "verifier", bottomNavigationItem: 2 });
            window.location.hash = "verifier";
        }
        console.log(this.state.selectedItem);
    }

    handleRadioButtonChange(event: ChangeEvent<HTMLInputElement>): void {
        const value = (event.target as HTMLInputElement).value
        if (value !== 'analyzer')
            window.location.hash = value;
        else
            window.location.hash = '';
        this.setState({ selectedItem: value });
    }

    render(): JSX.Element {
        return (
            <>
                <div className="hidden md:flex items-center h-full mx-6 absolute">
                    <FormControl>
                        <RadioGroup
                            aria-labelledby="demo-radio-buttons-group-label"
                            value={this.state.selectedItem}
                            onChange={this.handleRadioButtonChange.bind(this)}
                            name="radio-buttons-group"
                        >
                            <FormControlLabel value="analyzer" control={<Radio />} label="Analyzer" />
                            <FormControlLabel value="queue" control={<Radio />} label="Queue" />
                            <FormControlLabel value="verifier" control={<Radio />} label="Verifier" />
                        </RadioGroup>
                    </FormControl>
                </div>
                <div className="block md:hidden absolute bottom-0 w-full">
                    <BottomNavigation
                        showLabels
                        value={this.state.bottomNavigationItem}
                        onChange={(event, newValue) => {
                            this.handleBottomNavigationChange(newValue);
                        }}
                    >
                        <BottomNavigationAction label="Analyzer" icon={<DatasetLinkedIcon />} />
                        <BottomNavigationAction label="Queue" icon={<QueueIcon />} />
                        <BottomNavigationAction label="Verifier" icon={<PersonIcon />} />
                    </BottomNavigation>
                </div>
                <div className="flex h-full items-center justify-center">
                    <FormControl className="max-w-[90%] min-[500px]:w-[440px]">
                        {this.state.selectedItem === 'analyzer' &&
                            <AnalyzerForm />
                        }
                        {this.state.selectedItem === 'queue' &&
                            <QueueForm />
                        }
                        {this.state.selectedItem === 'verifier' &&
                            <VerifierForm />
                        }
                    </FormControl>
                </div>
            </>
        )
    };
}
