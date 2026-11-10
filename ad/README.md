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

`night-shift` is a different, story-style ad (`src/PhoneStory.tsx`, copy in `src/stories.json`): a phone on a nightstand fills with enquiries at 2am, the AI handles them, and you wake up to booked jobs. It has word-by-word captions timed to the voice. Its score is built by `audio/make_audio_story.py`.

`brand-film` ("The Orb", 38s) is the long brand film (`src/BrandFilm.tsx`, copy and timing marks in `src/stories.json`). The brand orb morphs into a phone call, a chat window, a workflow graph and a website, then becomes the logo. Its score and sound design come from `audio/make_audio_brand.py`, timed from the same marks as the animation.

To make a new template ad: copy an entry in `src/ads.json` with a new `id`, then build its voice and soundtrack:

```
pip install kokoro-onnx soundfile numpy scipy
python audio/make_voice.py <id>      # voiceover lines -> audio/vo/<id>/ and src/voice-durations.json   (model files via KOKORO_DIR)
python audio/make_audio.py <id>      # music + effects + voice -> public/audio/<id>.wav
npm run render -- <id>
```

Keep typed lines short (about 35 characters) and the spoken lines close to the lengths in the existing ads so they fit their scenes.

## Notes

- `src/Ad.tsx` holds the timeline and scenes. `src/theme.ts` holds the brand palette and fonts (bundled in `public/fonts`, so renders work offline).
- The voice is the free Kokoro text-to-speech model (`af_heart`, Apache 2.0). Spelled-out letters are written like `[[A]] [[M]]` in the voice lines so she says the letters, not the word "a". To use a recorded or ElevenLabs voice, replace `a.wav` to `f.wav` in `audio/vo/<id>/` and re-run `make_audio.py`.
- The music and sound effects are synthesized by `audio/make_audio.py`.

## SpinPix UK client videos

Four 15-second vertical promos, plus a 22-second brand film, for SpinPix UK (spinpixuk.co.uk), a photo booth hire client. They use their own brand, not AI by AO's: `src/theme-spinpix.ts` holds the SpinPix palette (near-black, hot pink, electric blue, violet neon) and fonts (Bungee + Fredoka, bundled in `public/fonts`). `src/theme.ts` is untouched.

| id | what happens |
| --- | --- |
| `spinpix-360` | A guest drops onto the 360 platform, the camera orbits, slow motion with confetti and a glowing ring, ending on "Spin the fun." |
| `spinpix-quiz` | A booth-finder quiz on a phone picks the Magic Mirror for a wedding and the 360 Spin for a prom, then the date picker says "Your date is free ✓". |
| `spinpix-montage` | Beat-synced cuts through weddings, proms, parties and work events, then the hero shape morphs through the Magic Mirror, Selfie Pod, 360 Spin, Classic Booth and Props Table. |
| `spinpix-qr` | Guests' phones go up, they scan the table card (a real QR code for spinpixuk.co.uk, `src/spinpix/qr.json`), photos fly into one private gallery. Only £35. |
| `spinpix-brand` | 22s concept ad for the whole business, in a premium, minimal style: a thin pink line splits into supplier nodes, chaos builds around "Is my date free?", a hush pulls everything into a loading ring that blooms into a neon orb and the name, a "What's the occasion?" prompt types out and the orb sends it, then a burst of service cards and the end card. Calmer voice (af_bella at 1.04x), subtler captions. |

Code is in `src/spinpix/` (one file per video, shared parts in `kit.tsx`). Copy, voice lines and every timing mark are in `src/spinpix/spinpix.json`; the animation and the sound both read the same marks.

```
pip install kokoro-onnx soundfile numpy scipy sherpa-onnx
python audio/make_voice.py spinpix-360          # af_bella at 1.15x (set per video by voiceName / voiceSpeed in spinpix.json)
python audio/check_voice.py spinpix-360         # Whisper speech recognition on each line, flags mispronunciations
python audio/make_audio_spinpix.py spinpix-360  # 120 bpm party beat + shutters, flashes, whooshes, confetti pops + voice
python audio/check_mix.py spinpix-360           # loudness, peaks, voice-over-music level, Whisper on the finished mix, spectrogram
node scripts/stills.mjs spinpix-360             # contact sheet of stills across the timeline -> out/stills/
npm run render -- spinpix-360                   # -> out/spinpix-360.mp4
```

A film's length is its `"seconds"` in spinpix.json (default 15); the compositions and `make_audio_spinpix.py` both read it. Set `BROWSER` to a Chromium headless shell for `stills.mjs` and `npm run render` if Remotion can't download one.

Whisper (`sherpa-onnx-whisper-base.en`) comes from the k2-fsa/sherpa-onnx GitHub releases (`asr-models`); point `WHISPER_DIR` at it. Spelled-out letters work as before (`[[U]] [[K]]`, `[[Q]] [[R]]`). Where the spoken words differ from what should be on screen (e.g. "three-sixty" vs "360"), `caption` in spinpix.json overrides the caption text, and `captionOff` hides captions for lines already shown as big on-screen type.

To use real event photos or video instead of the drawn booths, drop them in `public/spinpix/` and swap the shape art for Remotion's `<Img>` or `<OffthreadVideo>` in the scene that needs it.

## Rave advert (`rave-leeds`)

A 23-second vertical advert for United Sounds Event 3 at Beaverworks, Leeds (Sat 5 Dec 2026, 6pm–2am, bassline / house / harder rooms). It has its own look, separate from the AI by AO and SpinPix ads: `src/theme-rave.ts` (acid lime, UV purple, orange, Anton type), code in `src/rave/RaveAd.tsx`, copy, voice lines and timing marks in `src/rave/rave.json`.

```
python audio/make_voice.py rave-leeds      # Kokoro bm_george at 1.1x
python audio/check_voice.py rave-leeds
python audio/make_audio_rave.py            # intro riser, then 138 bpm bassline, 126 bpm house, 170 bpm hardcore, 140 bpm finale
python audio/check_mix.py rave-leeds
npm run render -- rave-leeds               # -> out/rave-leeds.mp4
```
