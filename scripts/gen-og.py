# Regenerates public/og.png — the social link-preview card.
# Uses the real site lockup: logo-mark.png monogram + "FeeEdge" wordmark.
# Run: python3 scripts/gen-og.py
from PIL import Image, ImageDraw, ImageFont
ROOT="/sessions/magical-fervent-mendel/mnt/FeeEdge"
FONTS="/sessions/magical-fervent-mendel/mnt/.claude/skills/canvas-design/canvas-fonts"
def bric(s,bold=True): return ImageFont.truetype(f"{FONTS}/BricolageGrotesque-{'Bold' if bold else 'Regular'}.ttf",s)
W,H=1200,630
BG=(10,10,10); EMER=(16,185,129); WHITE=(255,255,255); GRAY=(161,161,170)
img=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(img)
# left accent bar
d.rectangle([0,0,13,H],fill=EMER)
# real logo mark (monogram), rounded like the site header (rounded-lg)
cs=66; lx,ly=78,69
logo=Image.open(f"{ROOT}/public/logo-mark.png").convert("RGB").resize((cs,cs),Image.LANCZOS).convert("RGBA")
mask=Image.new("L",(cs,cs),0); ImageDraw.Draw(mask).rounded_rectangle([0,0,cs-1,cs-1],radius=14,fill=255)
logo.putalpha(mask)
img.paste(logo,(lx,ly),logo)
# wordmark — matches site header "FeeEdge" (white, bold)
d.text((lx+cs+22,ly+cs/2),"FeeEdge",font=bric(46),fill=WHITE,anchor="lm")
# headline
hf=bric(82)
d.text((78,208),"The cheapest exchange",font=hf,fill=WHITE,anchor="la")
y2=208+92
d.text((78,y2),"for ",font=hf,fill=WHITE,anchor="la")
w=d.textlength("for ",font=hf)
d.text((78+w,y2),"how you trade",font=hf,fill=EMER,anchor="la")
# subtitle
sf=bric(31,bold=False)
d.text((80,432),"Compare real trading fees across 20 exchanges — perps & spot,",font=sf,fill=GRAY,anchor="la")
d.text((80,476),"ranked for your volume and style.",font=sf,fill=GRAY,anchor="la")
# bottom row
bf=bric(36)
d.text((80,560),"feeedge.com",font=bf,fill=WHITE,anchor="la")
d.text((1140,578),"$29 once · no subscription",font=bf,fill=EMER,anchor="rm")
img.save(f"{ROOT}/public/og.png")
print("wrote public/og.png")
