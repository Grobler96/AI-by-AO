# AI by AO brand ad (Remotion)

13-second, 1080x1920 vertical ad built with [Remotion](https://www.remotion.dev). Not part of the website deploy (see `.vercelignore`).

```
cd ad
npm install
npm run studio    # live preview and editing
npm run render    # writes out/aibyao-ad.mp4
```

- `src/Ad.tsx` holds the timeline, copy and scenes. The hook line is the `HOOK` constant at the top.
- `src/theme.ts` holds the brand palette and fonts (bundled in `public/fonts`, so renders work offline).
- The video has no audio. Add a music track with Remotion's `<Audio>` component.
