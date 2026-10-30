"""Regenerate optimized website images and fonts from the checked-in originals.
Requires Pillow, fonttools and brotli. Not needed by the deployment build.
"""
from pathlib import Path
from PIL import Image, ImageOps
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
for directory in ('public/images', 'public/og', 'public/fonts'):
    (ROOT / directory).mkdir(parents=True, exist_ok=True)

def webp(source, name, sizes):
    image = Image.open(ROOT / source).convert('RGB')
    for width, height, suffix in sizes:
        result = ImageOps.pad(image, (width, height), color='#20231f', centering=(0.5, 0.5))
        result.save(ROOT / f'public/images/{name}{suffix}.webp', quality=84, method=6)

webp('design/portrait-source.png', 'pablo', [(480, 480, '-480'), (800, 800, '-800')])
webp('design/impostor-source.png', 'impostor', [(640, 427, '-640'), (1200, 800, '')])
for source, target in [('wordleinfinito.png', 'wordle'), ('jandj.png', 'jack-jones'), ('lunolife.png', 'luno'), ('nsgcorp.png', 'nsgcorp')]:
    webp(f'src/assets/images/projects/{source}', target, [(640, 427, '-640'), (1200, 800, '')] if target == 'wordle' else [(480, 320, '')])

og = Image.open(ROOT / 'design/og-source.png').convert('RGB')
ImageOps.fit(og, (1200, 630)).save(ROOT / 'public/og/portfolio-v2.png', optimize=True)

for source, target in [('CabinetGrotesk-Variable.ttf', 'cabinet'), ('Satoshi-Variable.ttf', 'satoshi')]:
    font = TTFont(ROOT / 'src/assets/fonts' / source)
    options = subset.Options()
    options.flavor = 'woff2'
    processor = subset.Subsetter(options=options)
    processor.populate(unicodes=list(range(0x20, 0x100)) + list(range(0x2000, 0x2070)) + list(range(0x2190, 0x2200)) + [0x2212, 0x2715])
    processor.subset(font)
    font.flavor = 'woff2'
    font.save(ROOT / f'public/fonts/{target}.woff2')
print('Prepared responsive WebP images, 1200×630 OG image and subset WOFF2 fonts.')
