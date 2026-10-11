import os
import random
from PIL import Image, ImageDraw

random.seed(42)

def make_paddy_tile(path):
    # 160x160 flooded rice paddy: shallow water over mud with rows of rice seedlings
    img = Image.new("RGBA", (160, 160), (45, 110, 140, 255))
    draw = ImageDraw.Draw(img)

    # Base mud & water gradient with horizontal bunds/water troughs
    for y in range(160):
        row_idx = y // 40
        y_in_row = y % 40
        for x in range(160):
            # Mud ridge at top of each 40px strip
            if y_in_row < 6:
                mud_col = (70 + (x % 3) * 5, 45 + (y % 2) * 5, 25, 255)
                draw.point((x, y), fill=mud_col)
            elif y_in_row < 10:
                trans_col = (50 + (x % 4) * 4, 75 + (y % 3) * 4, 90, 255)
                draw.point((x, y), fill=trans_col)
            else:
                # Water reflection & ripple
                water_base = 120 + ((x + y * 2) % 17) * 3
                draw.point((x, y), fill=(35, 95, water_base, 255))

    # Plant rice saplings in 4 rows (at y=16, 56, 96, 136)
    for row in range(4):
        base_y = row * 40 + 26
        for col in range(10):
            bx = col * 16 + 8 + (col % 2) * 2
            # Water ripple around plant base
            draw.ellipse((bx - 4, base_y - 2, bx + 4, base_y + 3), fill=(30, 80, 110, 255), outline=(70, 150, 180, 255))
            # Green shoots (3-4 blades of rice grass)
            draw.line((bx, base_y, bx - 3, base_y - 14), fill=(74, 222, 128, 255), width=2)
            draw.line((bx, base_y, bx, base_y - 17), fill=(34, 197, 94, 255), width=2)
            draw.line((bx, base_y, bx + 3, base_y - 13), fill=(134, 239, 172, 255), width=2)
            # Bright tips
            draw.point((bx - 3, base_y - 14), fill=(187, 247, 208, 255))
            draw.point((bx, base_y - 17), fill=(187, 247, 208, 255))
            draw.point((bx + 3, base_y - 13), fill=(187, 247, 208, 255))

    img.save(path)
    print("Saved", path)

def make_sugarcane_tile(path):
    # 160x160 rich tilled soil with tall green sugarcane stalks
    img = Image.new("RGBA", (160, 160), (45, 28, 18, 255))
    draw = ImageDraw.Draw(img)

    for y in range(160):
        y_in_row = y % 40
        for x in range(160):
            if y_in_row < 6:
                draw.point((x, y), fill=(35 + (x % 3) * 3, 20, 12, 255))
            elif y_in_row > 34:
                draw.point((x, y), fill=(30 + (x % 3) * 3, 18, 10, 255))
            else:
                draw.point((x, y), fill=(55 + (x % 5) * 4, 35 + (y % 4) * 3, 22, 255))

    # Sugarcane stalks in 4 rows
    for row in range(4):
        base_y = row * 40 + 34
        for col in range(10):
            bx = col * 16 + 8
            # Tall vertical stalk (green with yellow joints)
            for sy in range(base_y - 24, base_y):
                col_g = (22, 163, 74, 255) if (sy % 6 != 0) else (234, 179, 8, 255)
                draw.line((bx - 1, sy, bx + 1, sy), fill=col_g)
            # Top leaves fanning out
            top_y = base_y - 24
            draw.line((bx, top_y, bx - 6, top_y - 8), fill=(74, 222, 128, 255), width=2)
            draw.line((bx, top_y, bx + 6, top_y - 8), fill=(74, 222, 128, 255), width=2)
            draw.line((bx, top_y, bx - 2, top_y - 10), fill=(134, 239, 172, 255), width=1)
            draw.line((bx, top_y, bx + 2, top_y - 10), fill=(134, 239, 172, 255), width=1)

    img.save(path)
    print("Saved", path)

def make_banana_tile(path):
    # 160x160 dark soil with broad tropical banana fronds
    img = Image.new("RGBA", (160, 160), (45, 28, 18, 255))
    draw = ImageDraw.Draw(img)

    for y in range(160):
        y_in_row = y % 40
        for x in range(160):
            if y_in_row < 6:
                draw.point((x, y), fill=(35 + (x % 3) * 3, 20, 12, 255))
            else:
                draw.point((x, y), fill=(55 + (x % 4) * 4, 36 + (y % 3) * 3, 24, 255))

    # Banana plants in 4 rows
    for row in range(4):
        base_y = row * 40 + 28
        for col in range(6):
            bx = col * 26 + 14 + (col % 2) * 2
            # Stem
            draw.line((bx, base_y, bx, base_y - 8), fill=(101, 163, 13, 255), width=3)
            # Broad leaves (arch left and right)
            draw.ellipse((bx - 12, base_y - 20, bx + 1, base_y - 8), fill=(101, 163, 13, 255), outline=(163, 230, 53, 255))
            draw.ellipse((bx - 1, base_y - 22, bx + 12, base_y - 10), fill=(132, 204, 22, 255), outline=(190, 242, 100, 255))
            draw.ellipse((bx - 8, base_y - 26, bx + 6, base_y - 16), fill=(77, 124, 15, 255), outline=(163, 230, 53, 255))
            # Hanging yellow banana bunch
            draw.ellipse((bx - 2, base_y - 12, bx + 4, base_y - 6), fill=(250, 204, 21, 255), outline=(202, 138, 4, 255))

    img.save(path)
    print("Saved", path)

def make_pumpkin_tile(path):
    img = Image.new("RGBA", (160, 160), (45, 28, 18, 255))
    draw = ImageDraw.Draw(img)

    for y in range(160):
        y_in_row = y % 40
        for x in range(160):
            if y_in_row < 6:
                draw.point((x, y), fill=(35 + (x % 3) * 3, 20, 12, 255))
            else:
                draw.point((x, y), fill=(55 + (x % 4) * 4, 36 + (y % 3) * 3, 24, 255))

    for row in range(4):
        base_y = row * 40 + 26
        for col in range(5):
            bx = col * 32 + 16 + (row % 2) * 6
            # Green creeping vine
            draw.arc((bx - 14, base_y - 8, bx + 14, base_y + 8), 0, 180, fill=(34, 197, 94, 255), width=2)
            draw.ellipse((bx - 12, base_y - 12, bx - 6, base_y - 4), fill=(22, 163, 74, 255))
            draw.ellipse((bx + 6, base_y - 12, bx + 12, base_y - 4), fill=(22, 163, 74, 255))
            # Round plump pumpkin
            draw.ellipse((bx - 8, base_y - 8, bx + 8, base_y + 6), fill=(234, 88, 12, 255), outline=(154, 52, 18, 255))
            draw.ellipse((bx - 4, base_y - 7, bx + 4, base_y + 5), fill=(249, 115, 22, 255))
            # Stem on top
            draw.rectangle((bx - 1, base_y - 11, bx + 1, base_y - 8), fill=(101, 163, 13, 255))

    img.save(path)
    print("Saved", path)

def make_strawberry_tile(path):
    img = Image.new("RGBA", (160, 160), (45, 28, 18, 255))
    draw = ImageDraw.Draw(img)

    for y in range(160):
        y_in_row = y % 40
        for x in range(160):
            if y_in_row < 6:
                draw.point((x, y), fill=(35 + (x % 3) * 3, 20, 12, 255))
            else:
                draw.point((x, y), fill=(55 + (x % 4) * 4, 36 + (y % 3) * 3, 24, 255))

    for row in range(4):
        base_y = row * 40 + 26
        for col in range(8):
            bx = col * 20 + 10
            # Leafy bush mound
            draw.ellipse((bx - 7, base_y - 12, bx + 7, base_y + 2), fill=(22, 101, 52, 255), outline=(34, 197, 94, 255))
            draw.ellipse((bx - 4, base_y - 15, bx + 4, base_y - 3), fill=(34, 197, 94, 255))
            # 2-3 Ruby red berries
            draw.ellipse((bx - 5, base_y - 4, bx - 1, base_y + 2), fill=(225, 29, 72, 255), outline=(244, 63, 94, 255))
            draw.ellipse((bx + 1, base_y - 5, bx + 5, base_y + 1), fill=(225, 29, 72, 255), outline=(244, 63, 94, 255))
            # White blossom dot
            draw.point((bx, base_y - 10), fill=(255, 255, 255, 255))

    img.save(path)
    print("Saved", path)

assets_dir = r"c:\Users\Vihaan Shanker\Desktop\Hackathon\frontend\public\assets"
make_paddy_tile(os.path.join(assets_dir, "crop_paddy.png"))
make_sugarcane_tile(os.path.join(assets_dir, "crop_sugarcane.png"))
make_banana_tile(os.path.join(assets_dir, "crop_banana.png"))
make_pumpkin_tile(os.path.join(assets_dir, "crop_pumpkin.png"))
make_strawberry_tile(os.path.join(assets_dir, "crop_strawberry.png"))
print("All crop tiles generated successfully!")
