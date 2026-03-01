"""
Generate PWA icons for CodeQuest.
Run: python generate-icons.py
Requires: pip install Pillow
"""
try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

import os

def make_icon(size, path, is_maskable=False):
    padding = size // 5 if is_maskable else 0

    img = Image.new('RGB', (size, size), '#6C63FF')
    draw = ImageDraw.Draw(img)

    # Background rounded rect (simulated with full fill)
    # Draw lightning bolt emoji text
    center = size // 2
    font_size = size // 2

    try:
        # Try to use a system font
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    # Draw ⚡ emoji
    text = "⚡"
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((center - tw // 2, center - th // 2 - size // 10), text, fill='white', font=font)
    except:
        draw.rectangle([size//4, size//4, 3*size//4, 3*size//4], fill='white')

    # Small "CQ" text at bottom
    try:
        small_font = ImageFont.truetype("arial.ttf", size // 8)
        draw.text((center, 7 * size // 8), "CodeQuest", fill='rgba(255,255,255,180)', font=small_font, anchor='mm')
    except:
        pass

    img.save(path, 'PNG')
    print(f"  Created {path}")

if not HAS_PILLOW:
    print("Pillow not installed. Creating placeholder icons...")
    # Create minimal valid 1x1 PNG placeholders
    import base64
    # 1x1 purple PNG
    PNG_1X1 = base64.b64decode(
        b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )
    for fname in ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png']:
        path = os.path.join('assets', 'icons', fname)
        with open(path, 'wb') as f:
            f.write(PNG_1X1)
        print(f"  Created placeholder {path}")
    print("\nNote: Install Pillow for real icons: pip install Pillow")
    print("Then run this script again.")
else:
    print("Generating icons with Pillow...")
    make_icon(192, 'assets/icons/icon-192.png')
    make_icon(512, 'assets/icons/icon-512.png')
    make_icon(512, 'assets/icons/icon-maskable-512.png', is_maskable=True)
    print("Done! Icons generated.")
