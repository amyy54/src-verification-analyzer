import { useRouter } from "next/router";
import Analyzer from "../components/Analyzer";
import { displayDate, shortTimeRefCompatibility } from "../Util";

export default function AnalyzerPage(): JSX.Element {
    const router = useRouter();
    const { games, startDate, endDate, startdate, enddate, t, pronouns } = router.query;

    let startDateArg: string | undefined;
    let endDateArg: string | undefined;

    // Backwards Compatibility
    if (typeof t === 'string') {
        startDateArg = displayDate(shortTimeRefCompatibility(t, new Date(Date.now())), false, true);
        router.push({
            query: { games: games, startDate: startDateArg }
        }, undefined, { shallow: true });
    } else if (typeof startdate === 'string') {
        startDateArg = startdate;
        if (typeof enddate === 'string') {
            endDateArg = enddate;
            router.push({
                query: { games: games, startDate: startDateArg, endDate: endDateArg }
            }, undefined, { shallow: true });
        } else {
            router.push({
                query: { games: games, startDate: startDateArg }
            }, undefined, { shallow: true });
        }
    }

    if (typeof startDate === 'string') {
        startDateArg = startDate;
        if (typeof endDate === 'string')
            endDateArg = endDate;
    }

    if (typeof games === 'string')
        return <Analyzer games={games} startDate={startDateArg} endDate={endDateArg} pronounFilter={typeof pronouns === 'string' ? pronouns : undefined} />;
    else
        return <p>Error</p>;
}
