# SRC-Verification-Analyzer
Analysis and data visualization tool for speedrun.com

## Usage
The latest stable release is hosted on my own server located [here](https://mini.amyy.me/src-analyzer). Using the program should be self-explanatory, although more extensive documentation may be written eventually.

## Build
This program utilizes [React](https://reactjs.org) with the CSS library [Material UI](https://mui.com), as well as CSS from [Tailwind](https://tailwindcss.com). Server-side components are provided by [Next.JS](https://nextjs.org). All speedrun.com API lookups are performed by [src-ts](https://github.com/mitchell-merry/src-ts).

- Clone the repository
- Run `yarn`
- Open `example.config.tsx`, and edit the values to the desired settings, then save as `config.tsx` in the same folder
- Start with `yarn run dev` or `npm run dev`

To distribute, run `yarn run build && yarn run start`.
