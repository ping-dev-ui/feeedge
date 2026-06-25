# Regenerates public/og.png — the social link-preview card.
# Markets the free "Your Fees" analyzer (the page's top hook).
# Self-contained: uses the in-repo logo + fonts. Run: python3 scripts/gen-og.py
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = f"{ROOT}/scripts/og/fonts"

def bric(s, bold=True):
    return ImageFont.truetype(f"{FONTS}/BricolageGrotesque-{'Bold' if bold else 'Regular'}.ttf", s)

W, H = 1200, 630
BG = (6, 20, 14)        # site dark green (#06140e)
EMER = (16, 185, 129)
MINT = (52, 211, 153)
WHITE = (255, 255, 255)
GRAY = (143, 179, 163)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# left accent bar
d.rectangle([0, 0, 13, H], fill=EMER)

# logo (transparent FE mark) + wordmark
lh = 64
lx, ly = 78, 64
logo = Image.open(f"{ROOT}/public/logo-mark-t.png").convert("RGBA")
ratio = lh / logo.height
logo = logo.resize((int(logo.width * ratio), lh), Image.LANCZOS)
img.paste(logo, (lx, ly), logo)
d.text((lx + logo.width + 20, ly + lh / 2), "FeeEdge", font=bric(46), fill=WHITE, anchor="lm")

# eyebrow
d.text((80, 198), "NEW · FREE TOOL · NOTHING UPLOADED", font=bric(24), fill=MINT, anchor="la")

# headline (two lines, "really" in mint)
hf = bric(84)
d.text((78, 238), "What are fees", font=hf, fill=WHITE, anchor="la")
y2 = 238 + 96
rl = "really "
d.text((78, y2), rl, font=hf, fill=MINT, anchor="la")
w = d.textlength(rl, font=hf)
d.text((78 + w, y2), "costing you?", font=hf, fill=WHITE, anchor="la")

# subtitle
sf = bric(30, bold=False)
d.text((80, 452), "Upload your exchange trades — see your real fee + funding", font=sf, fill=GRAY, anchor="la")
d.text((80, 494), "bill in seconds. Parsed in your browser.", font=sf, fill=GRAY, anchor="la")

# bottom row
bf = bric(34)
d.text((80, 566), "feeedge.com", font=bf, fill=WHITE, anchor="la")
d.text((1140, 583), "free · private", font=bf, fill=MINT, anchor="rm")

img.save(f"{ROOT}/public/og.png")
print("wrote public/og.png", img.size)
