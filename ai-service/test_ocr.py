import sys
sys.path.insert(0, '/app' if '/app' in sys.path or True else '.')

from PIL import Image, ImageDraw, ImageFont
import numpy as np
from main import OCRScanner

# Create a test image with "Fuck" text
img = Image.new('RGB', (400, 200), color='white')
draw = ImageDraw.Draw(img)
try:
    # Try to use default font
    draw.text((50, 80), "Fuck", fill='black')
except:
    # Fallback if font not available
    draw.text((50, 80), "Fuck", fill='black')

img.save('test_image.png')
print("Created test image with 'Fuck' text")

# Convert to numpy array
image_array = np.array(img)

# Test OCR scanning
print("\nTesting OCR Scanner...")
result = OCRScanner.scan(image_array)
print(f"OCR Flag (should be True): {result}")

if result:
    print("✅ SUCCESS: Image with 'Fuck' text was DETECTED and would be BLOCKED")
else:
    print("❌ FAILED: Image with 'Fuck' text was NOT detected - moderation would allow it")
