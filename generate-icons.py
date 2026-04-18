#!/usr/bin/env python3
"""
CloroPrime — Icon Generator
Gera todos os ícones PNG necessários a partir do icon.svg.

Dependências:
  pip install cairosvg Pillow

Uso:
  python3 generate-icons.py
"""

import os
import sys

SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512]

def generate():
    try:
        import cairosvg
        from PIL import Image
        import io
    except ImportError:
        print("❌  Instale as dependências: pip install cairosvg Pillow")
        sys.exit(1)

    os.makedirs("icons", exist_ok=True)
    svg_path = os.path.join("icons", "icon.svg")

    if not os.path.exists(svg_path):
        print(f"❌  Arquivo não encontrado: {svg_path}")
        sys.exit(1)

    print(f"🎨  Gerando ícones a partir de {svg_path}...\n")

    for size in SIZES:
        out = f"icons/icon-{size}.png"
        png_bytes = cairosvg.svg2png(
            url=svg_path,
            output_width=size,
            output_height=size
        )
        with open(out, "wb") as f:
            f.write(png_bytes)
        print(f"  ✅  {out}  ({size}x{size})")

    # Apple Touch Icon (180x180)
    apple_bytes = cairosvg.svg2png(url=svg_path, output_width=180, output_height=180)
    with open("icons/apple-touch-icon.png", "wb") as f:
        f.write(apple_bytes)
    print(f"  ✅  icons/apple-touch-icon.png  (180x180)")

    # Favicon ICO (multi-size)
    fav16  = Image.open(io.BytesIO(cairosvg.svg2png(url=svg_path, output_width=16,  output_height=16)))
    fav32  = Image.open(io.BytesIO(cairosvg.svg2png(url=svg_path, output_width=32,  output_height=32)))
    fav48  = Image.open(io.BytesIO(cairosvg.svg2png(url=svg_path, output_width=48,  output_height=48)))
    fav32.save("icons/favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48)])
    print(f"  ✅  icons/favicon.ico  (16/32/48)")

    print("\n🎉  Todos os ícones gerados com sucesso!")

if __name__ == "__main__":
    generate()
