# Edie's Fee Tip — Post Creation Guide

How to make a new "Edie's Fee Tip" image post for X (@Fee_Edge).

Format: portrait 1080×1350, text baked onto an Edie photo.

IMPORTANT (2026-06-29): we no longer use one fixed hoodie shot for every card.
Cards #1 to #9 all looked the same (Edie on the right, charcoal hoodie, dark
teal background, text left), so we locked a 6-look ROTATION of scenes + layouts.
See the "Card variety" section just below. The reusable composite code lives in
`card-builder.js` (this folder). Approved reference cards:
`edie-sample-D-window-v2.jpg`, `edie-sample-E-home.jpg`,
`edie-sample-F-rooftop-v2.jpg`, `edie-sample-G-bookshelf-v2.jpg`
(plus the cafe + studio looks).

---

## Card variety — locked rotation (2026-06-29)

Pick the next card by cycling this table so **no two consecutive posts share a
scene OR a layout**. Each row = a distinct Edie photo (Higgsfield prompt) + a
distinct text layout. Full prompts + the canvas code are in `card-builder.js`
(`SCENES` map). The five layouts:
- `left`  — dark left-to-right gradient, headline + body left, footer bottom-left.
- `right` — mirrored: gradient from the right, text right-aligned, footer bottom-right.
- `panel` — solid dark 400px side panel (emerald edge) holding the text; bright
  photo fills the rest. Best for high-key / bright scenes. Keep panel ≤400px so
  Edie is not sliced.
- `bar`   — full-bleed photo, translucent dark caption bar across the bottom with
  an emerald hairline; headline + body + footer inside the bar.
- `center`— full-bleed, bottom gradient, everything centered. Needs a tight
  chest-up photo with the face in the upper third or it looks awkward.

| Key | Scene | Wardrobe | Light | Layout | Photo anchor |
| --- | --- | --- | --- | --- | --- |
| B | cafe window, mid-laugh | denim jacket | warm daylight | bar | cover |
| C | minimalist studio | charcoal blazer | emerald rim | right | left |
| D | bright window | cream cardigan | high-key daylight | panel | right |
| E | cozy couch at home | charcoal hoodie | warm lamp | left | right |
| F | city rooftop, dusk | olive jacket | blue hour | center | cover |
| G | home office bookshelf | blazer + glasses | bright warm key | right | left |

Notes from review: keep faces clearly lit (the first bookshelf + desk attempts
were too dark). For `panel` keep Edie well right of the 400px panel. For `center`
generate a chest-up crop, minimal sky. Old "trading desk" scene was rejected
(too dark, too close to the old fixed look) — do not reuse it.

### How to build a card (replaces the single-prompt Step 1/2 below)
1. Higgsfield: `generate_image` model `soul_2`, soul_id `e1ae79e2-efb6-4723-aa1c-0138ca2c3f5b`,
   aspect `3:4`, count 1, prompt = `SCENES[key].prompt` from `card-builder.js`.
   Poll `job_display`, grab `results.rawUrl`.
2. Open a tab on https://feeedge.com, paste `card-builder.js`, set
   `U.<key> = "<rawUrl>"`, then call `render({ X:{scene:'<key>', head:[...], body:'...'} })`.
   (Sandbox is CDN-blocked and base64 returns are filtered, so this MUST run in
   the browser — same as the original pipeline.)
3. Chrome writes each card as `<uuid>.tmp` in Downloads. If it doesn't land in
   this folder, move it with Desktop Commander `move_file` to
   `edie-persona\edie-<scene>.jpg`. Then post via the normal X steps below.

The original single-look pipeline (Step 1–4) is kept below for reference, but the
scene prompt + layout now come from the rotation above, not the fixed hoodie shot.

---

## Brand constants
- Emerald: `#2ee6a6`  · White text: `#f4f7f6`  · Background: `#07100c`
- Logo: real FE monogram served at `https://feeedge.com/logo-mark.png`
  (emerald strokes on dark navy square — must be made transparent, see below).
- Persona Soul: "Edie - FeeEdge", soul_id `e1ae79e2-efb6-4723-aa1c-0138ca2c3f5b`
- Headline/body font in canvas: Arial weight 800/600 (Bricolage Grotesque is NOT
  available to canvas; Arial bold is the practical match).

## Step 1 — Generate Edie photo (Higgsfield)
- Tool: `generate_image`, model `soul_2`, soul_id above, aspect `4:5` (→ 3:4).
- count: 2, then pick the best.
- Prompt template (plain hoodie + room for text on the left):
  "Edie, a friendly nerdy-cute young woman with long blonde hair and no glasses,
   wearing a plain solid dark charcoal hoodie. Studio editorial portrait,
   positioned on the right side of the frame with clean negative space on the
   left, deep dark teal-black background, subtle soft emerald rim lighting,
   looking straight at the camera with a warm confident smile, crisp high-end
   fashion photography, shallow depth of field."
- NOTE: the Soul almost always bakes an FE-ish monogram onto the hoodie anyway —
  that's expected; we mask + replace it with the real logo in Step 2.
- Poll with `job_display`; grab the `rawUrl` (CloudFront PNG).

## Step 2 — Build the composite IN THE BROWSER (not the sandbox)
The sandbox is IP-blocked from the Higgsfield/Twitter CDNs (403) and the tool
filter blocks returning base64/hex, so do all image work in a Chrome tab on
**feeedge.com** (same-origin to the logo, CORS-OK to the Higgsfield CDN).

Canvas layout (1080×1350):
1. Fill bg `#07100c`. Fetch the Edie rawUrl → draw with a SMALL zoom and
   TOP-ALIGN so her head is never cut off: `s = max(W/iw, H/ih) * 1.04`,
   `dw = iw*s`, `dh = ih*s`, `dx = W - dw` (right-anchor: the Soul puts her on
   the right with negative space on the left, so right-anchoring keeps her face
   in the right half), `dy = 0` (top-align so the top of her head stays in frame).
   NOTE: the old `*1.32` zoom with `dy = (H-dh)/2 - 40` pushed the top of her
   head off the canvas — do not use it.
2. Transparent logo sprite: load `/logo-mark.png`, getImageData, set
   `alpha = clamp((green-55)*2, 0..255)` per pixel (keeps emerald, drops navy),
   crop to bounding box → reusable sprite.
3. Hoodie logo fix: sample hoodie colour (`getImageData` at a plain spot ~705,985),
   stamp a feathered rounded patch in that colour over the AI monogram
   (centre ≈ 718,876), then draw the real sprite there (~128px tall).
4. Gradients for legibility: left-to-right dark gradient (opaque→0 by ~72% width)
   so left text is readable and her face (right) stays clear; soft top strip
   (badge) and bottom strip (footer).
5. Text:
   - Badge pill top-left: `EDIE'S FEE TIP #N` — emerald outline + 14% emerald fill, 26px 800.
   - Headline: emerald `#2ee6a6`, **Arial 800 ~116px**, drop shadow
     (`rgba(0,0,0,.55)` blur 18) for legibility over the photo; wrap ~560px.
   - Emerald accent underline (~150×8px) under the headline.
   - Body: white, Arial 600 ~40px, wrap ~500px, drop shadow on.
   - Footer: transparent logo sprite (~64px) + "feeedge.com" white Arial 700 38px.
6. Export `canvas.toDataURL('image/jpeg', 0.92)` and stash in `window.name`.
7. Preview before posting: render `window.name` in a full-screen overlay `<img>`
   and screenshot to eyeball it.

## Step 3 — Get the image onto X
- `window.name` survives cross-origin navigation, so navigate the SAME tab to
  `https://x.com/compose/post` (the dataURL rides along).
- Inject into X's uploader WITHOUT fetch (X CSP blocks `data:` fetch): decode with
  `atob`, build a `File`, set it on `input[type=file]` via `DataTransfer`, dispatch
  `input` + `change`. (Verify `mediaCount===1`.)

## Step 4 — Caption + post
- Caption style: lowercase, conversational, one 🤓, end with feeedge.com + 👇. e.g.
  "edie's fee tip #N 🤓 <hook>.\n\nfeeedge.com ranks all 20 by what you'd actually pay 👇"
- If a feeedge.com link-card appears, remove it (aria-label "Remove card preview")
  so only the image shows.
- CRITICAL: the image thumbnail renders instantly, but the SERVER upload takes
  ~15-25s. If you hit Post before it finishes, X publishes TEXT-ONLY (no image).
  Wait ~20-25s after injecting, then Post. AFTER posting, reload the profile and
  verify the new post actually has a photo (`[data-testid="tweetPhoto"]`); if not,
  delete it and repost. (Don't trust the arc next to Post — the char-count ring
  looks like an upload spinner.)

## Editing/replacing a live post
X can't swap media on an existing tweet — delete + repost:
open the post's caret menu → Delete → confirm, then compose fresh.

## Caption / posting hygiene
- Use straight hyphens " - " not em-dashes in the canvas text (em-dash sometimes
  left a stray "—" in the X composer; fine inside the baked image though).
- Always save a copy to Downloads (`<a download>`).

## Tip log
- #1 — "Stop using market orders." (maker vs taker)
- #2 — "Hold their token." (native-token fee discounts: BNB/OKB/GT/KCS −10–25%)
- #3 — "Funding > fees." (on perps, funding can cost more than the trade fee)
- Ideas for next: withdrawal fees; volume tiers; limit-order maker rebates;
  "your taker fee is the silent one"; spread vs fee on thin books.

---

# UGC TALKING VIDEO (Edie speaking to camera) — recipe + hard-won learnings

Reference output: marketing/edie-persona/edie-ugc-final.mp4 (talking) → UGC1-final.mp4 (CapCut: +logo +captions).
UGC #1 script (B): "Quick question: do you actually know which exchange is cheapest for
how you trade? Most people don't — and it's quietly costing them. FeeEdge ranks all 20
by real cost. Check yours at feeedge.com." (~12s)

PIPELINE
1. VOICE — use the ElevenLabs Player MCP, NOT Higgsfield's text2speech preset voices
   (Chloe/Luna etc. sound like children). Voice = Sarah `EXAVITQu4vr4xnSDxMaL`,
   model `eleven_multilingual_v2`. (Gentle adult female; user-approved.)
   * GOTCHA: the ElevenLabs Player has a broken output path — it saves to a folder
     literally named `${user_config.output_dir}` under the launch CWD, i.e.
     `C:\Windows\System32\${user_config.output_dir}\tts_*.mp3`. Only a Recent .lnk
     shortcut is easy to find (and that .lnk is what gets uploaded by mistake).
     Locate via Desktop Commander: resolve the Recent shortcut's TargetPath, then
     `Copy-Item` the real mp3 into `C:\FeeEdge\marketing\edie-persona\`. Use find+copy
     in ONE pipeline (the shell strips `$`/`${...}`): 
     `Get-ChildItem -Path 'C:\Windows\System32' -Filter 'tts_*.mp3' -Recurse -Depth 1 | Copy-Item -Destination '...'`.
2. EDIE FRAME — Soul `soul_2` (soul_id e1ae79e2-...), selfie close-up, 9:16, front-facing,
   plain hoodie, mid-talking smile, cozy room. Pass the image JOB ID straight to the video.
3. GET AUDIO INTO HIGGSFIELD — `media_upload_widget` (type audio); the USER picks the mp3
   (point them at the clean C:\FeeEdge copy). The sandbox CANNOT push it: curl PUT to
   upload.higgsfield.ai is proxy-blocked (403), and ffmpeg/sandbox can't reach the CDN.
4. LIPSYNC VIDEO — `generate_video` model `seedance_2_0`, medias: {start_image: image job_id},
   {audio: audio media_id}, aspect 9:16, duration ≈ audio length, `generate_audio:false`,
   720p std. ~58 credits for 13s. Preflight with get_cost.
   * GOTCHA: Seedance uses the audio ONLY to drive the lips — it outputs a SILENT mp4.
5. MUX THE AUDIO BACK IN — ffmpeg is on the user's Windows box (Desktop Commander). It can
   read the video from its cloudfront URL and the local mp3:
   `ffmpeg -y -i '<cloudfront mp4 url>' -i 'C:\FeeEdge\...\voice.mp3' -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest 'C:\FeeEdge\...\final.mp4'`
6. LOGO — transparent FE monogram via PIL green-channel alpha knockout of /logo-mark.png
   (script in this folder's history) → feeedge-logo-transparent.png.
7. CAPTIONS + LOGO — CapCut web: import final.mp4, Auto-captions (English), drop the
   transparent logo top-right. To export from CapCut via Chrome MCP, open the editor URL
   (capcut.com/editor/<projectId>) in a controlled tab — the autosaved project loads —
   then Export → Download.
8. COMPRESS FOR X — the Chrome file_upload bridge caps at 10 MB. Re-encode:
   `ffmpeg -y -i final.mp4 -c:v libx264 -crf 26 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 128k web.mp4`.

CRITICAL — POSTING VIDEO TO X
- Automated video posting is UNRELIABLE. X silently DROPS the video and posts text-only
  if you click Post before its server-side processing finishes, and that state is NOT
  detectable from the page (readyState 4 / no progressbar still wasn't enough). It failed
  twice. **Have the user upload the video to X manually.** Claude does everything up to
  the finished, compressed mp4.
- Do NOT delete-a-post-by-caption right after a video upload: a still-processing video post
  reads as text-only (hasVideo:false) and you'll delete the user's real post by mistake.
