import { Component } from "react";
import { capitalizeFirstLetter, NotificationAlert } from "../Util";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";

interface NotificationState {
    notification: NotificationAlert,
    open: boolean
};

export default class Notification extends Component<{}, NotificationState> {
    constructor(props: any) {
        super(props);
        this.state = {
            notification: {text: 'Template', type: 'info'},
            open: true
        };
    }

    updateAlert(alert: NotificationAlert): void {
        alert.title = alert.title ? alert.title : capitalizeFirstLetter(alert.type);
        this.setState({notification: alert});
    }

    setOpen(input: boolean): void {
        this.setState({open: input});
    }

    renderAlert(): JSX.Element {
        if (this.state.notification.loading) {
            return (
                <Alert severity={this.state.notification.type} icon={<CircularProgress />}>
                    <AlertTitle>{this.state.notification.title}</AlertTitle>
                    {this.state.notification.text}
                </Alert>
            );
        } else if (this.state.notification.dismissable) {
            return (
                <Alert severity={this.state.notification.type} onClose={() => {this.setOpen(false);}}>
                    <AlertTitle>{this.state.notification.title}</AlertTitle>
                    {this.state.notification.text}
                </Alert>
            );
        } else {
            return (
                <Alert severity={this.state.notification.type}>
                    <AlertTitle>{this.state.notification.title}</AlertTitle>
                    {this.state.notification.text}
                </Alert>
            );
        }
    }

    render(): JSX.Element {
        return (
            <>
            {this.state.notification.text &&
                <Snackbar sx={{ maxWidth: 600 }} ClickAwayListenerProps={this.state.notification.dismissable ? {} : { mouseEvent: false, touchEvent: false }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} open={this.state.open} autoHideDuration={this.state.notification.loading ? null : this.state.notification.type === 'error' ? null : 5000} onClose={() => this.setOpen(false)}>
                    <div className="mx-4 mt-4 mb-2">
                        {this.renderAlert()}
                    </div>
                </Snackbar>
            }
            </>
        );
    }
}
