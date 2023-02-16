import { useRouter } from "next/router";
import Queue from "../../components/Queue";

export default function QueuePage(): JSX.Element {
    const router = useRouter();
    const { games, category, user, exclude, time, pronouns, orderby, records } = router.query;
    // Allowed Parameters: category, user, orderby, exclude, time
    if (typeof games === 'string')
        return <Queue games={games} orderby={typeof orderby === 'string' ? orderby : undefined} records={typeof records === 'string' ? (records === 'yes' || records === 'true') : false} filter={{ category: typeof category === 'string' ? category : undefined, player: typeof user === 'string' ? user : undefined, exclude: typeof exclude === 'string' ? exclude : undefined, time: typeof time === 'string' ? parseInt(time) : undefined, pronouns: typeof pronouns === 'string' ? pronouns : undefined }} router={router} />;
    else
        return <p>Error</p>;
}
