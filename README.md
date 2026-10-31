# FastShare (Catbox edition, v2)

Static site plus one tiny backup function. No accounts, no environment variables.

## Deploy on Vercel
Unzip, push to GitHub, import in Vercel (Framework Preset: Other). Or run `npx vercel` in the folder. Open the site. Done.

## What it does
- **Multi-select:** pick many files at once, upload whole folders, or drag them in. Tick items and use Select all.
- **Big files:** anything over 190 MB is cut into byte-exact parts, uploaded in parallel (6 at a time), and rejoined on download with a single button. Nothing is re-encoded, and the joined size is checked.
- **Temporary mode (Litterbox):** parts up to 950 MB, deleted after 1, 12, 24 or 72 hours. The share page shows the time left.
- **Sharing:** select items > Share selected. The link holds the file list, so receivers need nothing from your browser.

## Good to know
- Your library is saved in your browser only. Use "Back up library".
- Anyone with a link can open that file. "Remove" doesn't delete from Catbox.
- Downloads read Catbox directly. If the browser blocks that, `/api/dl` relays it (Catbox hosts only). If both fail, each share page has "Download parts separately".
- Chrome/Edge write the joined file straight to disk. Safari/Firefox build it in memory, so files over about 1 GB may fail there.
