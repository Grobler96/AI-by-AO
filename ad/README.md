# AI by AO brand ads (Remotion)

13-second, 1080x1920 vertical ads built with [Remotion](https://www.remotion.dev). Not part of the website deploy (see `.vercelignore`).

```
cd ad
npm install
npm run studio                  # live preview and editing
npm run render                  # renders every ad to out/aibyao-<id>.mp4
npm run render -- chatbot       # renders just one
```

## Ads

Each ad is one entry in `src/ads.json`: the hook line, the first "problem" card, the typed headline, the three feature cards and the six voiceover lines. `missed-calls`, `chatbot`, `automation` and `web-design` are included.

To make a new one: copy an entry in `src/ads.json` with a new `id`, then build its voice and soundtrack:

```
pip install kokoro-onnx soundfile numpy scipy
python audio/make_voice.py <id>      # voiceover lines -> audio/vo/<id>/   (model files via KOKORO_DIR)
python audio/make_audio.py <id>      # music + effects + voice -> public/audio/<id>.wav
npm run render -- <id>
```

Keep typed lines short (about 35 characters) and the spoken lines close to the lengths in the existing ads so they fit their scenes.

## Notes

- `src/Ad.tsx` holds the timeline and scenes. `src/theme.ts` holds the brand palette and fonts (bundled in `public/fonts`, so renders work offline).
- The voice is the free Kokoro text-to-speech model (`af_heart`, Apache 2.0). Spelled-out letters are written like `[[A]] [[M]]` in the voice lines so she says the letters, not the word "a". To use a recorded or ElevenLabs voice, replace `a.wav` to `f.wav` in `audio/vo/<id>/` and re-run `make_audio.py`.
- The music and sound effects are synthesized by `audio/make_audio.py`.
