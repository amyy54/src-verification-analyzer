import { Component } from 'react';
import { PieChart, pieChartDefaultProps, PieChartProps } from 'react-minimal-pie-chart';
import { BaseDataEntry } from 'react-minimal-pie-chart/types/commonTypes';

import Analyzer from './Analyzer';

interface ChartProps extends PieChartProps {
    analyzer: Analyzer
};

interface ChartState {
    selected: number | undefined,
    hovered: number | undefined
};

export default class Chart extends Component<ChartProps, ChartState> {
    constructor(props: ChartProps) {
        super(props);
        this.state = {
            selected: undefined,
            hovered: undefined
        }
    }

    handleData(): BaseDataEntry[] {
        const data = this.props.data.map((entry, i) => {
            if (this.state.hovered === i) {
                return {
                    ...entry,
                    color: '#615c69',
                };
            }
            return entry;
        });
        return data;
    }

    handleClicked(input: number | undefined): void {
        if (this.props.analyzer) {
            this.props.analyzer.updateChartSelectedState(input);
        }
    }

    setHovered(input: number | undefined): void {
        this.setState({hovered: input});
    }

    setSelected(input: number | undefined): void {
        this.setState({selected: input});
    }

    render(): JSX.Element {
        return (
            <PieChart
                style={{
                    fontSize: '8px'
                }}
                data={this.handleData()}
                radius={pieChartDefaultProps.radius - 6}
                segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
                segmentsShift={(index) => (index === this.state.selected ? 6 : 0)}
                animate
                label={({ dataEntry, dataIndex }) => (dataEntry.percentage > 5) ? Math.round(dataEntry.percentage) + '%' : ""}
                labelPosition={100 - 60 / 2}
                labelStyle={{
                    fill: '#fff',
                    opacity: 0.75,
                    pointerEvents: 'none',
                }}
                onClick={(_, index) => {
                    this.handleClicked(index === this.state.selected ? undefined : index);
                }}
                onMouseOver={(_, index) => {
                    this.setHovered(index);
                }}
                onMouseOut={() => {
                    this.setHovered(undefined);
                }}
            />
        );
    }
}

