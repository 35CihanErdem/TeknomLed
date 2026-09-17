"""Align LIGHT_OFF / LIGHT_ON pair for cursor reveal (structure NCC)."""
from pathlib import Path

import numpy as np
from PIL import Image

DIR = Path(r"C:\Users\cihan\TeknomLed\storefront\src\assets\images\home")
RAW = DIR / "_raw"


def struct_map(rgb: np.ndarray) -> np.ndarray:
    g = rgb.mean(axis=2)
    gx = np.abs(np.diff(g, axis=1))
    gy = np.abs(np.diff(g, axis=0))
    return gx[1:, :] + gy[:, 1:]


def ncc(a: np.ndarray, b: np.ndarray) -> float:
    a = a - a.mean()
    b = b - b.mean()
    den = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-6
    return float((a * b).sum() / den)


def find_offset(off_rgb: np.ndarray, on_rgb: np.ndarray, search: int = 90) -> tuple[int, int, float]:
    a = struct_map(off_rgb)
    b = struct_map(on_rgb)
    # Focus on stone facade / lower house (avoid sky text)
    y0, y1 = int(a.shape[0] * 0.48), int(a.shape[0] * 0.78)
    x0, x1 = int(a.shape[1] * 0.18), int(a.shape[1] * 0.72)
    ref = a[y0:y1, x0:x1]
    best = (-1e9, 0, 0)
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            cand = b[y0 + dy : y1 + dy, x0 + dx : x1 + dx]
            if cand.shape != ref.shape:
                continue
            score = ncc(ref, cand)
            if score > best[0]:
                best = (score, dx, dy)
    return best[1], best[2], best[0]


def apply_shift(off: Image.Image, on: Image.Image, dx: int, dy: int) -> tuple[Image.Image, Image.Image]:
    """Shift ON by (-dx,-dy) relative to OFF paste origin, crop intersection."""
    w = max(off.width, on.width) + abs(dx) + 20
    h = max(off.height, on.height) + abs(dy) + 20
    canvas_off = Image.new("RGB", (w, h), (0, 0, 0))
    canvas_on = Image.new("RGB", (w, h), (0, 0, 0))
    ox = abs(min(0, -dx)) + 10
    oy = abs(min(0, -dy)) + 10
    canvas_off.paste(off, (ox, oy))
    canvas_on.paste(on, (ox - dx, oy - dy))
    left = max(ox, ox - dx) + 3
    top = max(oy, oy - dy) + 3
    right = min(ox + off.width, ox - dx + on.width) - 3
    bottom = min(oy + off.height, oy - dy + on.height) - 3
    return canvas_off.crop((left, top, right, bottom)), canvas_on.crop((left, top, right, bottom))


def main() -> None:
    off = Image.open(RAW / "off.jpg").convert("RGB")
    on = Image.open(RAW / "on.jpg").convert("RGB")

    # Normalize ON to OFF width first (keep aspect)
    on = on.resize(
        (off.width, max(1, round(on.height * off.width / on.width))),
        Image.Resampling.LANCZOS,
    )
    # Pad shorter canvas so arrays share width
    h = max(off.height, on.height)
    off_pad = Image.new("RGB", (off.width, h), (0, 0, 0))
    on_pad = Image.new("RGB", (off.width, h), (0, 0, 0))
    off_pad.paste(off, (0, 0))
    on_pad.paste(on, (0, 0))

    dx, dy, score = find_offset(
        np.asarray(off_pad, dtype=np.float32),
        np.asarray(on_pad, dtype=np.float32),
        search=90,
    )
    print(f"coarse dx={dx} dy={dy} score={score:.4f}")

    a, b = apply_shift(off, on, dx, dy)

    # Fine refine ±12
    dx2, dy2, score2 = find_offset(
        np.asarray(a, dtype=np.float32),
        np.asarray(b, dtype=np.float32),
        search=12,
    )
    print(f"fine dx={dx2} dy={dy2} score={score2:.4f}")
    a, b = apply_shift(a, b, dx2, dy2)

    dx3, dy3, score3 = find_offset(
        np.asarray(a, dtype=np.float32),
        np.asarray(b, dtype=np.float32),
        search=4,
    )
    print(f"verify dx={dx3} dy={dy3} score={score3:.4f} size={a.size}")
    if dx3 or dy3:
        a, b = apply_shift(a, b, dx3, dy3)

    assert a.size == b.size

    # Cache-busting filenames
    targets_off = [
        "pair-off-v3.jpg",
        "hero-light-off.jpg",
        "light-comparison-off.jpg",
        "comparison-light-off.jpg",
    ]
    targets_on = [
        "pair-on-v3.jpg",
        "hero-light-on.jpg",
        "light-comparison-on.jpg",
        "comparison-light-on.jpg",
    ]
    for name in targets_off:
        a.save(DIR / name, quality=93, optimize=True)
    for name in targets_on:
        b.save(DIR / name, quality=93, optimize=True)

    Image.blend(a, b, 0.5).save(DIR / "_check_blend.jpg", quality=90)
    print("saved", a.size)


if __name__ == "__main__":
    main()
