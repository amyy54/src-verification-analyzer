/** @type {import('tailwindcss').Config} */
module.exports = {
    important: true,
    content: [
        './src/**/*.{ts,tsx}',
        './config.tsx'
    ],
    theme: {
        extend: {
            colors: {
                'link': '#4044ff',
            }
        },
    },
    plugins: [],
}
