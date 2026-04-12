#!/usr/bin/env python3
"""
Local test script for content moderation
Tests NSFW, violence, and OCR detection without needing the API running
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image, ImageDraw, ImageFont
import numpy as np
import logging

# Configure logging to see detailed output
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import detection classes from main.py
from main import NSFWDetector, ViolenceDetector, OCRScanner

def create_test_image_with_text(text, filename='test_image.png'):
    """Create a simple test image with text"""
    img = Image.new('RGB', (600, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        # Try to use a larger font
        from PIL import ImageFont
        font = ImageFont.load_default(size=60)
    except:
        font = ImageFont.load_default()
    
    # Draw text in black
    draw.text((50, 100), text, fill='black', font=font)
    img.save(filename)
    print(f"✓ Created test image: {filename}")
    return img

def test_ocr_detection():
    """Test OCR detection with images containing bad words"""
    print("\n" + "="*60)
    print("Testing OCR (Bad Word) Detection")
    print("="*60)
    
    test_cases = [
        ("Fuck", "Image with 'Fuck'"),
        ("KILL THEM", "Image with 'KILL THEM'"),
        ("Hello World", "Image with normal text"),
    ]
    
    for text, description in test_cases:
        print(f"\nTest: {description}")
        print(f"  Text: '{text}'")
        
        # Create test image
        img = create_test_image_with_text(text, f'test_{text.replace(" ", "_")}.png')
        image_array = np.array(img)
        
        # Test OCR
        result = OCRScanner.scan(image_array)
        
        if result:
            print(f"  ✅ DETECTED - Would be BLOCKED")
        else:
            print(f"  ❌ NOT DETECTED - Would be ALLOWED")

def test_nsfw_detection():
    """Test NSFW detection with skin tone analysis"""
    print("\n" + "="*60)
    print("Testing NSFW (Nudity) Detection")
    print("="*60)
    
    # Create image with high skin tone percentage (simulating nude image)
    print("\nTest: Image with 60% skin tone (simulating nude)")
    img = Image.new('RGB', (400, 300))
    pixels = img.load()
    
    # Fill 60% of image with skin-like color
    skin_color = (210, 150, 120)  # Typical skin tone
    for i in range(img.width):
        for j in range(int(img.height * 0.6)):
            pixels[i, j] = skin_color
    
    # Fill rest with normal colors
    for i in range(img.width):
        for j in range(int(img.height * 0.6), img.height):
            pixels[i, j] = (100, 150, 200)  # Sky blue
    
    img.save('test_skin_tone.png')
    image_array = np.array(img)
    
    nsfw_score = NSFWDetector.detect(image_array)
    print(f"  NSFW Score: {nsfw_score:.3f} (threshold: 0.6)")
    
    if nsfw_score > 0.6:
        print(f"  ✅ DETECTED - Would be BLOCKED")
    else:
        print(f"  ❌ NOT DETECTED - Would be ALLOWED")

def test_violence_detection():
    """Test violence detection with red/dark colors"""
    print("\n" + "="*60)
    print("Testing Violence (Blood/Dark Red) Detection")
    print("="*60)
    
    # Create image with red dominance
    print("\nTest: Image with dark red areas (simulating blood)")
    img = Image.new('RGB', (400, 300))
    pixels = img.load()
    
    # Fill image with dark red color
    dark_red = (80, 20, 20)  # Dark red (blood-like)
    for i in range(img.width):
        for j in range(img.height):
            pixels[i, j] = dark_red
    
    img.save('test_violence.png')
    image_array = np.array(img)
    
    violence_score = ViolenceDetector.detect(image_array)
    print(f"  Violence Score: {violence_score:.3f} (threshold: 0.6)")
    
    if violence_score > 0.6:
        print(f"  ✅ DETECTED - Would be BLOCKED")
    else:
        print(f"  ❌ NOT DETECTED - Would be ALLOWED")

if __name__ == '__main__':
    print("\n" + "█"*60)
    print("SafeVoice Content Moderation - Local Test Suite")
    print("█"*60)
    
    try:
        test_ocr_detection()
        test_nsfw_detection()
        test_violence_detection()
        
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)
        print("""
If all tests show:
  ✅ DETECTED - OCR, NSFW, and Violence detection are working!
  ❌ NOT DETECTED - There are issues with the detection models
        """)
        
    except Exception as e:
        print(f"\n❌ ERROR during testing: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
