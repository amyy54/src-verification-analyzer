import { useRouter } from "next/router";
import Verifier from "../../components/Verifier";

export default function AnalyzerPage(): JSX.Element {
    const router = useRouter();
    const { user, startDate, endDate, max, category, userFilter, exclude, time, pronouns } = router.query;

    let startDateArg: string | undefined;
    let endDateArg: string | undefined;
    let maxArg: string | undefined;

    if (typeof startDate === 'string') {
        startDateArg = startDate;
        if (typeof endDate === 'string')
            endDateArg = endDate;
    }
    if (typeof max === 'string')
        maxArg = max;

    if (typeof user === 'string')
        return <Verifier user={user} startDate={startDateArg} endDate={endDateArg} max={maxArg} router={router} filter={{ category: typeof category === 'string' ? category : undefined, player: typeof userFilter === 'string' ? userFilter : undefined, exclude: typeof exclude === 'string' ? exclude : undefined, time: typeof time === 'string' ? parseInt(time) : undefined, pronouns: typeof pronouns === 'string' ? pronouns : undefined }} />;
    else
        return <p>Error</p>;
}
