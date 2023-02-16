import Image from "next/image";
import { config } from "../config";
import { categoryToString, Filter, gameToString, QueueRun, VerifierRun } from "./Util";
import { Player, PlayerGuest, PlayerUser } from "src-ts";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import Link from "@mui/material/Link";

import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import HideSourceIcon from '@mui/icons-material/HideSource';


const staticPath = config.staticPath;

// https://mui.com/material-ui/react-switch/
export const DarkModeSwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
        margin: 1,
        padding: 0,
        transform: 'translateX(6px)',
        '&.Mui-checked': {
            color: '#fff',
            transform: 'translateX(22px)',
            '& .MuiSwitch-thumb:before': {
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
                    '#fff',
                )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
            },
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
            },
        },
    },
    '& .MuiSwitch-thumb': {
        backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
        width: 32,
        height: 32,
        '&:before': {
            content: "''",
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
                '#fff',
            )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
        },
    },
    '& .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
        borderRadius: 20 / 2,
    },
}));

export function RegionSvg(props: { region: string | null }): JSX.Element {
    if (!props.region) return <></>;
    switch (props.region) {
        case "ypl25l47":
            return <Image width="40" height="40" className="mt-[-5px] float-left mr-2 py-1" src={staticPath + "/svg/br.svg"} alt="Brazil" />;
        case "mol4z19n":
            return <Image width="40" height="40" className="mt-[-5px] float-left mr-2 py-1" src={staticPath + "/svg/cn.svg"} alt="China" />;
        case "e6lxy1dz":
            return <Image width="40" height="40" className="mt-[-5px] float-left mr-2 py-1" src={staticPath + "/svg/eu.svg"} alt="Europe" />;
        case "o316x197":
            return <Image width="40" height="40" className="mt-[-5px] float-left mr-2 py-1" src={staticPath + "/svg/jp.svg"} alt="Japan" />;
        case "p2g50lnk":
            return <Image width="40" height="40" className="mt-[-5px] float-left mr-2 py-1" src={staticPath + "/svg/kr.svg"} alt="Korea" />;
        case "pr184lqn":
            return <Image width="40" height="40" className="mt-[-5px] float-left mr-2 py-1" src={staticPath + "/svg/us.svg"} alt="United States" />;
        default:
            return <></>;
    }
}

export function ShowClearFilter(props: { filter: Filter, position: "category" | "player", updateFilter: Function }): JSX.Element {
    let clearFilterArr: JSX.Element[] = [];
    if (props.position === 'category') {
        if (props.filter.category) {
            clearFilterArr.push(
                <Tooltip title={`Clear "${props.filter.category}" Filter`}>
                    <IconButton onClick={() => props.updateFilter(null)}>
                        <FilterListOffIcon />
                    </IconButton>
                </Tooltip>
            );
        } else {
            clearFilterArr.push(
                <IconButton disabled className="opacity-0"><FilterListOffIcon /></IconButton>
            );
        }
        if (props.filter.exclude) {
            clearFilterArr.push(
                <Tooltip title={`Clear "${props.filter.exclude}" Exclusion`}>
                    <IconButton onClick={() => props.updateFilter(undefined, undefined, null)}>
                        <HideSourceIcon />
                    </IconButton>
                </Tooltip>
            );
        } else {
            clearFilterArr.push(
                <IconButton disabled className="opacity-0"><HideSourceIcon /></IconButton>
            );
        }
        return (
            <>
                {clearFilterArr}
            </>
        );

    } else if (props.position === "player") {
        if (props.filter.player)
            return (
                <Tooltip title={`Clear "${props.filter.player}" Filter`}>
                    <IconButton onClick={() => props.updateFilter(undefined, null)}>
                        <FilterListOffIcon />
                    </IconButton>
                </Tooltip>
            );
        else
            return (
                <IconButton disabled className="opacity-0"><FilterListOffIcon /></IconButton>
            );
    } else
        return (
            <></>
        );
}

export function gameToWeblink(run: VerifierRun): JSX.Element {
    if (!Array.isArray(run.game.data))
        return <Link target="_blank" underline="hover" rel="noreferrer noopener" href={run.game.data.weblink}>{gameToString(run)}</Link>;
    else
        return <>{gameToString(run)}</>;
}

export function categoryToWeblink(run: QueueRun | VerifierRun): JSX.Element {
    if (!Array.isArray(run.level.data))
        return <Link target="_blank" underline="hover" rel="noreferrer noopener" href={run.level.data.weblink}>{categoryToString(run)}</Link>;
    else if (!Array.isArray(run.category.data))
        return <Link target="_blank" underline="hover" rel="noreferrer noopener" href={run.category.data.weblink}>{categoryToString(run)}</Link>;
    else
        return <>{categoryToString(run)}</>;
}

export function playersToWeblink(players: Player[]): JSX.Element {
    let elements: JSX.Element[] = [];
    for (const player of players) {
        if (player.rel === "user") {
            let playerTmp = (player as PlayerUser);
            elements.push(<Link key={playerTmp.id} target="_blank" underline="hover" rel="noreferrer noopener" href={playerTmp.weblink}>{playerTmp.names.international}</Link>);
        } else {
            let playerTmp = (player as PlayerGuest);
            elements.push(<span key={playerTmp.name}>{playerTmp.name}</span>)
        }
    }
    return (
        <>
            {elements.map((v, index) => (
                <>
                    {index === elements.length - 1 &&
                        <>{v}</>
                    }
                    {index !== elements.length - 1 &&
                        <>{v}, </>
                    }
                </>
            ))}
        </>
    )
}
