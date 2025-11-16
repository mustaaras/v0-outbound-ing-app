from PIL import Image, ImageDraw, ImageFont
import os

W = 1200
H = 630
OUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'og-image.png')

# Create base image
img = Image.new('RGBA', (W, H), '#0f172a')
d = ImageDraw.Draw(img)

# Draw subtle rounded rectangle overlay (as semi-transparent gradient-like)
overlay = Image.new('RGBA', (W - 120, H - 120), (6,182,212,20))
# paste overlay centered
img.paste(overlay, (60,60), overlay)

# Try loading a TTF font, fall back to default
def load_font(size):
    # Try common fonts
    candidates = [
        '/Library/Fonts/Arial.ttf',
        '/System/Library/Fonts/SFNSDisplay.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()

title_font = load_font(64)
subtitle_font = load_font(28)
logo_font = load_font(36)

# Title and subtitle
title = "Outbound.ing"
subtitle = "AI-powered cold outreach emails — personalized at scale"

# Calculate positions
x = 90
y = 180

# Draw title
d.text((x, y), title, font=title_font, fill=(255,255,255))
# Draw subtitle below
d.text((x, y + 80), subtitle, font=subtitle_font, fill=(255,255,255,220))

# Draw logo mark (circle + O)
logo_x = W - 240
logo_y = 64
r = 36
cx = logo_x + r
cy = logo_y + r
# circle
d.ellipse((logo_x, logo_y, logo_x + 2*r, logo_y + 2*r), fill=(6,182,212))
# letter
try:
    w, h = logo_font.getsize('O')
except Exception:
    # Pillow newer versions: use textbbox
    bbox = d.textbbox((0, 0), 'O', font=logo_font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]

d.text((cx - w/2, cy - h/2), 'O', font=logo_font, fill=(7,16,36))

# Save
img.save(OUT, format='PNG')
print('Wrote', OUT)
