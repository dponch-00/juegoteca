from pathlib import Path
from PIL import Image
import sys

source = Path(sys.argv[1])
target = Path(sys.argv[2])
target.parent.mkdir(parents=True, exist_ok=True)
image = Image.open(source).convert("RGB")
image.thumbnail((960, 960), Image.Resampling.LANCZOS)
for quality in (76, 70, 64, 58, 52):
    image.save(target, "WEBP", quality=quality, method=6)
    if target.stat().st_size <= 150_000:
        break
if target.stat().st_size > 150_000:
    raise SystemExit(f"El mood supera 150 KB: {target.stat().st_size}")
