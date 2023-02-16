/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    basePath: '/src-analyzer',

    async redirects() {
        return [
            {
                source: '/data/:slug',
                destination: '/:slug',
                permanent: true
            },
            {
                source: '/leaderboard/:slug',
                destination: '/:slug',
                permanent: false
            },
            {
                source: '/queue/:slug/records',
                destination: '/queue/:slug?records=yes',
                permanent: true
            }
        ];
    }
};

module.exports = nextConfig;
