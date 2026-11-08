"""Recorta dos hojas 3×2 generadas por imagen y produce masters PNG y WebP móviles.

Uso:
  python design/process-piece-renders.py hoja-arce.png hoja-nogal.png
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MASTER_DIR = ROOT / "design" / "masters" / "pieces"
WEB_DIR = ROOT / "public" / "assets" / "chess" / "pieces"
PIECES = ("k", "q", "r", "b", "n", "p")
DATE = "2026-11-08"


def clean_alpha(image: Image.Image) -> Image.Image:
    """Quita el velo residual del fondo generado y conserva brillos/sombra de la pieza."""
    image = image.convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 0 if value < 10 else value)
    image.putalpha(alpha)
    return image


def split_sheet(path: Path, color: str) -> None:
    image = Image.open(path).convert("RGBA")
    if image.size != (1536, 1024):
        raise ValueError(f"Se esperaba 1536×1024, se recibió {image.size}: {path}")
    for index, piece in enumerate(PIECES):
        col, row = index % 3, index // 3
        crop = clean_alpha(image.crop((col * 512, row * 512, (col + 1) * 512, (row + 1) * 512)))
        master = MASTER_DIR / f"{color}{piece}.png"
        crop.save(master, "PNG", optimize=True)
        mobile = crop.resize((256, 256), Image.Resampling.LANCZOS)
        webp = WEB_DIR / f"{color}{piece}.webp"
        for quality in (92, 86, 80, 74):
            mobile.save(webp, "WEBP", quality=quality, method=6, exact=True)
            if webp.stat().st_size <= 30_000:
                break
        if webp.stat().st_size > 30_000:
            raise ValueError(f"WebP supera 30 KB: {webp}")


def update_manifest() -> None:
    manifest_path = ROOT / "design" / "asset-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    ids = {f"staunton-piece-{color}{piece}" for color in "wb" for piece in PIECES}
    ids |= {f"staunton-master-{color}{piece}" for color in "wb" for piece in PIECES}
    assets = [asset for asset in manifest["assets"] if asset["id"] not in ids]
    for color in "wb":
        for piece in PIECES:
            master = MASTER_DIR / f"{color}{piece}.png"
            webp = WEB_DIR / f"{color}{piece}.webp"
            assets.extend([
                {"id": f"staunton-master-{color}{piece}", "path": str(master.relative_to(ROOT)).replace("\\", "/"), "purpose": f"Master PNG render 3D Staunton {color}{piece}", "tool": "image_gen + Pillow 3.14", "prompt": "Hoja 3×2 de piezas Staunton originales, vista frontal elevada, luz suave desde arriba a la izquierda, arce claro o nogal oscuro, fondo transparente", "date": DATE, "dimensions": "512x512 RGBA", "bytes": master.stat().st_size},
                {"id": f"staunton-piece-{color}{piece}", "path": str(webp.relative_to(ROOT)).replace("\\", "/"), "purpose": f"Pieza móvil render 3D Staunton {color}{piece}", "tool": "Pillow 3.14", "prompt": None, "date": DATE, "dimensions": "256x256 WebP con alfa", "bytes": webp.stat().st_size},
            ])
    manifest["assets"] = assets
    manifest["generatedAt"] = DATE
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Uso: process-piece-renders.py hoja-arce.png hoja-nogal.png")
    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    split_sheet(Path(sys.argv[1]), "w")
    split_sheet(Path(sys.argv[2]), "b")
    for svg in WEB_DIR.glob("*.svg"):
        svg.unlink()
    update_manifest()


if __name__ == "__main__":
    main()
