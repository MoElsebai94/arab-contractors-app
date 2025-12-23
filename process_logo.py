from PIL import Image, ImageDraw, ImageOps

input_path = "client/public/logo.png"
output_path = "client/public/logo_circular.png"

try:
    img = Image.open(input_path).convert("RGBA")
    
    # Create circular mask
    mask = Image.new("L", img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0) + img.size, fill=255)
    
    # Apply mask
    output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
    output.putalpha(mask)
    
    output.save(output_path)
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
