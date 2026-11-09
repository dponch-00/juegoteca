"""Normaliza hojas PNG de fichas/dados a masters transparentes y WebP móviles.

Uso:
  python design/process-tabletop-renders.py checkers.png backgammon.png dice.png
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATE = "2026-11-08"


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A").point(lambda value: 0 if value < 20 else 255)
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Celda sin píxeles opacos")
    return bbox


def normalize(cell: Image.Image, target_width: int, baseline: int = 470) -> Image.Image:
    cell = cell.convert("RGBA")
    alpha = cell.getchannel("A").point(lambda value: 0 if value < 20 else value)
    cell.putalpha(alpha)
    left, top, right, bottom = alpha_bbox(cell)
    crop = cell.crop((left, top, right, bottom))
    scale = min(target_width / crop.width, 420 / crop.height)
    size = (round(crop.width * scale), round(crop.height * scale))
    crop = crop.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    canvas.alpha_composite(crop, ((512 - crop.width) // 2, baseline - crop.height))
    alpha = canvas.getchannel("A").point(lambda value: 0 if value < 20 else value)
    canvas.putalpha(alpha)
    return canvas


def remove_detached_floor_reflection(image: Image.Image) -> Image.Image:
    """Elimina solo un reflejo separado por aire, nunca la base de la ficha."""
    image = image.copy()
    alpha = image.getchannel("A")
    occupied = [any(alpha.getpixel((x, y)) >= 20 for x in range(image.width)) for y in range(image.height)]
    gap_start = None
    for y in range(1, image.height - 8):
        if occupied[y - 1] and not occupied[y]:
            gap_start = y
        if gap_start is not None and y - gap_start >= 8 and occupied[y]:
            for clear_y in range(gap_start, image.height):
                for x in range(image.width):
                    alpha.putpixel((x, clear_y), 0)
            image.putalpha(alpha)
            return image
        if occupied[y]:
            gap_start = None
    return image


def export(image: Image.Image, master: Path, webp: Path) -> None:
    master.parent.mkdir(parents=True, exist_ok=True)
    webp.parent.mkdir(parents=True, exist_ok=True)
    image.save(master, "PNG", optimize=True)
    mobile = image.resize((256, 256), Image.Resampling.LANCZOS)
    alpha = mobile.getchannel("A").point(lambda value: 0 if value < 20 else value)
    mobile.putalpha(alpha)
    for quality in (92, 86, 80, 74):
        mobile.save(webp, "WEBP", quality=quality, method=6, exact=True)
        if webp.stat().st_size <= 30_000:
            return
    raise ValueError(f"WebP supera 30 KB: {webp}")


def grid(path: Path, columns: int, rows: int) -> list[Image.Image]:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    x = [round(index * width / columns) for index in range(columns + 1)]
    y = [round(index * height / rows) for index in range(rows + 1)]
    return [image.crop((x[column], y[row], x[column + 1], y[row + 1])) for row in range(rows) for column in range(columns)]


def record(assets: list[dict], ident: str, master: Path, webp: Path, purpose: str, prompt: str | None) -> None:
    assets.extend([
        {"id": f"tabletop-master-{ident}", "path": str(master.relative_to(ROOT)).replace("\\", "/"), "purpose": f"Master PNG {purpose}", "tool": "image_gen + Pillow 3.14", "prompt": prompt, "date": DATE, "dimensions": "512x512 RGBA", "bytes": master.stat().st_size},
        {"id": f"tabletop-{ident}", "path": str(webp.relative_to(ROOT)).replace("\\", "/"), "purpose": f"Activo móvil {purpose}", "tool": "Pillow 3.14", "prompt": None, "date": DATE, "dimensions": "256x256 WebP con alfa", "bytes": webp.stat().st_size},
    ])


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("Uso: process-tabletop-renders.py checkers.png backgammon.png dice.png")
    checkers, backgammon, dice = map(Path, sys.argv[1:])
    outputs: list[tuple[str, Image.Image, Path, Path, str, str]] = []
    # Orden de la hoja de damas: man clara, man oscura, king clara, king oscura.
    for ident, cell in zip(("wman", "bman", "wking", "bking"), grid(checkers, 2, 2), strict=True):
        image = normalize(cell, 430)
        if ident in {"wman", "bman"}:
            image = remove_detached_floor_reflection(image)
        outputs.append((ident, image, ROOT / "design/masters/checkers" / f"{ident}.png", ROOT / "public/assets/checkers" / f"{ident}.webp", "ficha de damas 3D de madera", "Cuatro fichas de damas de arce/nogal: normales y coronadas con dos discos e inlay coral, luz suave arriba-izquierda, fondo transparente"))
    # Orden: checker claro, checker oscuro.
    for ident, cell in zip(("w-checker", "b-checker"), grid(backgammon, 2, 1), strict=True):
        outputs.append((ident, normalize(cell, 430), ROOT / "design/masters/backgammon" / f"{ident}.png", ROOT / "public/assets/backgammon" / f"{ident}.webp", "ficha cenital de backgammon 3D de madera", "Dos fichas cenitales de backgammon, arce claro y nogal oscuro, surcos concéntricos, luz arriba-izquierda, fondo transparente"))
    for number, cell in enumerate(grid(dice, 3, 2), start=1):
        ident = f"dice-{number}"
        outputs.append((ident, normalize(cell, 360), ROOT / "design/masters/backgammon" / f"{ident}.png", ROOT / "public/assets/backgammon" / f"{ident}.webp", "cara de dado 3D de marfil", "Seis caras de dado de arce marfil, puntos de nogal correctos, bordes redondeados, luz arriba-izquierda, fondo transparente"))
    for _, image, master, webp, _, _ in outputs:
        export(image, master, webp)
    manifest_path = ROOT / "design/asset-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    ids = {f"tabletop-{ident}" for ident, *_ in outputs} | {f"tabletop-master-{ident}" for ident, *_ in outputs}
    assets = [asset for asset in manifest["assets"] if asset["id"] not in ids]
    for ident, _, master, webp, purpose, prompt in outputs:
        record(assets, ident, master, webp, purpose, prompt)
    manifest["assets"] = assets
    manifest["generatedAt"] = DATE
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
