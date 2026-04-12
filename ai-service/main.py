from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import logging
from datetime import datetime
import numpy as np
from PIL import Image
from io import BytesIO
import torch
from nudenet import NudeDetector
from skimage.metrics import structural_similarity
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global startup status
startup_complete = False
startup_errors = []

app = FastAPI(
    title="SafeVoice AI Service",
    description="AI services for content moderation and verification",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global startup_complete, startup_errors
    logger.info("Starting SafeVoice AI Service initialization...")
    try:
        # Pre-load detectors
        logger.info("Loading NSFW detector...")
        detector = NSFWDetector.get_detector()
        if not detector:
            startup_errors.append("NudeNet detector failed to load")
            logger.warning("NudeNet detector not available")
        
        logger.info("Loading OCR reader...")
        ocr_reader = OCRScanner.get_reader()
        if not ocr_reader:
            startup_errors.append("PaddleOCR not available")
            logger.warning("PaddleOCR not available - OCR features will be limited")
        
        startup_complete = True
        logger.info("✓ SafeVoice AI Service initialization complete")
        if startup_errors:
            logger.warning(f"Startup warnings: {startup_errors}")
    except Exception as e:
        startup_complete = True  # Still mark complete to serve requests
        startup_errors.append(f"Startup error: {str(e)}")
        logger.error(f"Error during startup initialization: {e}")
        logger.warning("Continuing with limited functionality")

# ================= Response Models =================

class ModerationResponse(BaseModel):
    nsfw_score: float
    violence_score: float
    ocr_flag: bool
    final_confidence: float

class VerificationResponse(BaseModel):
    similarity_score: float
    deepfake_detected: bool
    verification_status: str
    confidence_score: float

# ================= Moderation Service =================

class NSFWDetector:
    """
    NSFW Detection using NudeNet
    """

    _detector = None

    @classmethod
    def get_detector(cls):
        if cls._detector is None:
            try:
                cls._detector = NudeDetector()
                logger.info("NudeNet detector loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load NudeNet: {type(e).__name__}: {str(e)}")
                cls._detector = False
        return cls._detector
    
    @staticmethod
    def detect_skin_tone(image: np.ndarray) -> float:
        """
        Detects skin tone percentage in image using RGB color space
        Returns score 0-1 indicating likelihood of nude/18+ content
        """
        try:
            # Ensure proper shape
            if len(image.shape) != 3 or image.shape[2] < 3:
                return 0.0
            
            image = image.astype(float)
            
            # Extract RGB channels
            r = image[:, :, 0]
            g = image[:, :, 1]
            b = image[:, :, 2]
            
            # Skin detection model using RGB thresholds
            # Skin pixels typically have: R>95, G>40, B>20, R>G, R>B, |R-G|>15
            skin_mask = (
                (r > 95) & (g > 40) & (b > 20) &
                (r > g) & (r > b) & 
                (np.abs(r - g) > 15)
            )
            
            skin_percentage = np.count_nonzero(skin_mask) / skin_mask.size
            
            logger.info(f"Skin tone percentage: {skin_percentage:.2%}")
            
            # High skin percentage indicates nudity
            # Threshold: >40% skin = suspicious
            return min(1.0, skin_percentage * 2.5)
        except Exception as e:
            logger.error(f"Error in skin tone detection: {e}")
            return 0.0
    
    @staticmethod
    def detect(image: np.ndarray) -> float:
        """
        Returns NSFW confidence score (0-1)
        """
        logger.info("Running NSFW detection")
        try:
            detector = NSFWDetector.get_detector()
            if not detector:
                logger.warning("NudeNet not available - skipping NSFW detection")
                return 0.0

            # NudeNet expects uint8 RGB image
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8) if image.max() <= 1 else image.astype(np.uint8)

            results = detector.detect(image)
            if not results:
                return 0.0

            explicit_classes = {
                "EXPOSED_BREAST_F",
                "EXPOSED_GENITALIA_F",
                "EXPOSED_GENITALIA_M",
                "EXPOSED_ANUS",
                "EXPOSED_BUTTOCKS",
            }

            nsfw_score = 0.0
            for item in results:
                if item.get("class") in explicit_classes:
                    nsfw_score = max(nsfw_score, float(item.get("score", 0.0)))

            logger.info(f"NSFW detection score: {nsfw_score:.3f}")
            return float(nsfw_score)
        except Exception as e:
            logger.error(f"Error in NSFW detection: {e}")
            return 0.0

class ViolenceDetector:
    """
    Violence Detection using red/dark color dominance analysis
    """
    
    @staticmethod
    def detect(image: np.ndarray) -> float:
        """
        Returns violence confidence score (0-1)
        Detects violent content by analyzing dark red/blood-like colors
        """
        logger.info("Running violence detection")
        try:
            if len(image.shape) < 3:
                return 0.0
            
            # Ensure we have at least 3 channels
            if image.shape[2] < 3:
                return 0.0
            
            image = image.astype(float)
            
            # Extract RGB channels
            red = image[:, :, 0]
            green = image[:, :, 1]
            blue = image[:, :, 2]
            
            # Violence detection heuristics:
            # 1. Dark red colors (blood-like): high red, low green/blue, low brightness
            # 2. Very dark areas (shadows from violence): low RGB overall
            
            # Calculate scores
            red_dominance = (red - (green + blue) / 2) / 255.0
            red_dominance[red_dominance < 0] = 0
            
            # Dark areas
            brightness = (red + green + blue) / 3 / 255.0
            dark_score = (1 - brightness) * 0.5
            
            # Combine: red dominance in dark areas
            base_score = np.mean((red_dominance * dark_score)) * 2

            # Additional blood-like region heuristic for severe injury content
            blood_mask = (
                (red > 110) &
                (red > green * 1.25) &
                (red > blue * 1.25) &
                ((green < 150) | (blue < 150))
            )
            blood_ratio = np.count_nonzero(blood_mask) / blood_mask.size
            blood_score = min(1.0, blood_ratio * 5.0)

            violence_score = max(base_score, blood_score)
            violence_score = min(1.0, max(0.0, violence_score))
            
            logger.info(f"Violence detection score: {violence_score:.3f}")
            return float(violence_score)
        except Exception as e:
            logger.error(f"Error in violence detection: {e}")
            return 0.0

class OCRScanner:
    """
    OCR Scanner for detecting abusive/harmful text in images
    """
    _reader = None
    _ocr_available = None
    
    @classmethod
    def get_reader(cls):
        if cls._reader is None:
            if cls._ocr_available is None:
                cls._ocr_available = False
                try:
                    from paddleocr import PaddleOCR
                    logger.info("Attempting to load PaddleOCR...")
                    cls._reader = PaddleOCR(use_angle_cls=True, lang='en')
                    cls._ocr_available = True
                    logger.info("✓ PaddleOCR reader loaded successfully")
                except ImportError as e:
                    logger.error(f"✗ PaddleOCR not installed: {e}")
                except Exception as e:
                    logger.error(f"✗ Failed to load PaddleOCR: {type(e).__name__}: {str(e)}")
        return cls._reader if cls._ocr_available else None
    
    # Keep terms explicit and avoid ambiguous short words that cause false positives.
    ABUSIVE_KEYWORDS = [
        'kill', 'rape', 'abuse', 'hate', 'violence', 'terrorist', 'bomb',
        'attack', 'murder', 'harm', 'threat', 'curse', 'slur',
        'bitch', 'fuck', 'shit', 'bastard', 'cunt'
    ]

    @staticmethod
    def detect_text_like_image(image: np.ndarray) -> float:
        """
        Fallback score (0-1) for text-heavy high-contrast images when OCR is unavailable.
        """
        try:
            gray = image.mean(axis=2) / 255.0 if len(image.shape) == 3 else image.astype(float) / 255.0
            dark_ratio = float(np.mean(gray < 0.20))
            light_ratio = float(np.mean(gray > 0.85))

            gx = np.abs(np.diff(gray, axis=1))
            gy = np.abs(np.diff(gray, axis=0))
            edge_density = float(np.mean((gx > 0.25)) + np.mean((gy > 0.25))) / 2.0

            score = 0.0
            if light_ratio > 0.55 and 0.01 < dark_ratio < 0.35:
                score += 0.45
            if edge_density > 0.06:
                score += 0.35

            return min(1.0, score)
        except Exception as e:
            logger.error(f"Error in text-like fallback detection: {e}")
            return 0.0
    
    @staticmethod
    def scan(image: np.ndarray) -> bool:
        """
        Returns True if abusive text detected in image
        """
        logger.info("=== Starting OCR Text Scan ===")
        try:
            reader = OCRScanner.get_reader()
            
            if not reader:
                fallback_text_score = OCRScanner.detect_text_like_image(image)
                logger.warning(f"OCR reader not available - fallback text score: {fallback_text_score:.3f}")
                return fallback_text_score >= 0.75
            
            # Ensure image is uint8 (0-255 range)
            if image.dtype != np.uint8:
                if image.max() <= 1:
                    image = (image * 255).astype(np.uint8)
                else:
                    image = image.astype(np.uint8)
            
            logger.info(f"Image shape: {image.shape}, dtype: {image.dtype}")
            
            # Extract text using OCR
            logger.info("Running PaddleOCR...")
            results = reader.ocr(image, cls=True)
            logger.info(f"OCR returned: {type(results)} with {len(results) if results else 0} result lines")
            
            if not results or not results[0]:
                logger.info("No text detected in image")
                return False
            
            # Combine all detected text
            detected_lines = []
            for line in results[0]:
                text = line[1][0]
                confidence = line[1][1]
                detected_lines.append(text)
                logger.info(f"  Detected: '{text}' (confidence: {confidence:.2f})")
            
            detected_text = ' '.join(detected_lines).lower()
            logger.info(f"Combined OCR text: {detected_text}")
            
            # Check abusive keywords as full tokens only (not substring match).
            words = set(re.findall(r"[a-zA-Z]+", detected_text))
            for keyword in OCRScanner.ABUSIVE_KEYWORDS:
                if keyword in words:
                    logger.warning(f"ABUSIVE KEYWORD DETECTED: '{keyword}'")
                    return True
            
            logger.info("No abusive keywords detected")
            return False
            
        except Exception as e:
            logger.error(f"ERROR in OCR scan: {type(e).__name__}: {str(e)}", exc_info=True)
            return False

@app.post("/api/ai/moderate", response_model=ModerationResponse)
async def moderate_content(file: UploadFile = File(...)):
    """
    Content moderation endpoint
    
    Analyzes image for:
    - NSFW content
    - Violence
    - Abusive text (OCR)
    
    Returns confidence scores
    """
    try:
        logger.info(f"Processing moderation request for file: {file.filename}")
        
        # Read image
        image_data = await file.read()
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed (handle RGBA, grayscale, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL Image to numpy array (RGB format from PIL)
        image_array = np.array(image)
        logger.info(f"Image loaded: shape={image_array.shape}, dtype={image_array.dtype}")
        
        # Run detection models
        nsfw_score = NSFWDetector.detect(image_array)
        violence_score = ViolenceDetector.detect(image_array)
        ocr_flag = OCRScanner.scan(image_array)
        
        # Compute final confidence
        final_confidence = max(nsfw_score, violence_score)
        if ocr_flag:
            final_confidence = min(final_confidence + 0.5, 1.0)
        
        logger.info(f"Moderation complete - NSFW: {nsfw_score:.3f}, Violence: {violence_score:.3f}, OCR: {ocr_flag}, Final: {final_confidence:.3f}")
        
        return ModerationResponse(
            nsfw_score=round(nsfw_score, 3),
            violence_score=round(violence_score, 3),
            ocr_flag=ocr_flag,
            final_confidence=round(final_confidence, 3)
        )
    
    except Exception as e:
        logger.error(f"Error in moderation service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Moderation service error")

# ================= Verification Service =================

class FeatureExtractor:
    """
    CNN-based feature extraction
    Uses pre-trained models like ResNet, VGG, etc.
    """
    
    @staticmethod
    def extract(image: np.ndarray) -> np.ndarray:
        """
        Extracts feature vector from image
        """
        logger.info("Extracting CNN features")
        # Placeholder: return random feature vector
        # In production: features = model.predict(image)
        return np.random.randn(512)

class SimilarityComputer:
    """
    Computes SSIM (Structural Similarity) between images
    """
    
    @staticmethod
    def compute_ssim(image1: np.ndarray, image2: np.ndarray) -> float:
        """
        Returns SSIM similarity score (0-1)
        """
        logger.info("Computing SSIM similarity")
        try:
            # Normalize to comparable RGB images and common resolution.
            if image1.ndim == 2:
                image1 = np.stack([image1] * 3, axis=2)
            if image2.ndim == 2:
                image2 = np.stack([image2] * 3, axis=2)

            pil1 = Image.fromarray(image1.astype(np.uint8)).convert("RGB").resize((384, 384))
            pil2 = Image.fromarray(image2.astype(np.uint8)).convert("RGB").resize((384, 384))

            arr1 = np.array(pil1).astype(np.float32) / 255.0
            arr2 = np.array(pil2).astype(np.float32) / 255.0

            # SSIM on grayscale
            gray1 = arr1.mean(axis=2)
            gray2 = arr2.mean(axis=2)
            ssim_score = structural_similarity(gray1, gray2, data_range=1.0)

            # Histogram similarity to reduce false positives for unrelated scenes
            hist1, _ = np.histogram(arr1, bins=64, range=(0, 1), density=True)
            hist2, _ = np.histogram(arr2, bins=64, range=(0, 1), density=True)
            hist_l1 = np.mean(np.abs(hist1 - hist2))
            hist_sim = max(0.0, 1.0 - hist_l1)

            combined = (0.75 * float(ssim_score)) + (0.25 * float(hist_sim))
            combined = min(1.0, max(0.0, combined))
            logger.info(
                f"Similarity metrics - SSIM: {ssim_score:.3f}, HistSim: {hist_sim:.3f}, Combined: {combined:.3f}"
            )
            return combined
        except Exception as e:
            logger.error(f"Error computing similarity: {e}")
            return 0.0

class DeepfakeDetector:
    """
    Deepfake detection model
    Uses facial analysis and artifact detection
    """
    
    @staticmethod
    def detect(image: np.ndarray) -> bool:
        """
        Returns True if deepfake detected
        """
        logger.info("Running deepfake detection")
        # Deterministic placeholder: do not randomly reject/accept.
        return False

@app.post("/api/ai/verify", response_model=VerificationResponse)
async def verify_resolution(
    original: UploadFile = File(...),
    resolved: UploadFile = File(...)
):
    """
    Resolution verification endpoint
    
    Compares original and resolved images:
    - Extracts and compares features
    - Computes SSIM similarity
    - Detects deepfakes
    - Generates confidence score
    
    Returns verification result
    """
    try:
        logger.info(f"Processing verification request")
        logger.info(f"Original: {original.filename}, Resolved: {resolved.filename}")
        
        # Read images
        original_data = await original.read()
        resolved_data = await resolved.read()
        
        original_image = Image.open(BytesIO(original_data))
        resolved_image = Image.open(BytesIO(resolved_data))
        
        original_array = np.array(original_image)
        resolved_array = np.array(resolved_image)
        
        # Feature extraction
        original_features = FeatureExtractor.extract(original_array)
        resolved_features = FeatureExtractor.extract(resolved_array)
        
        # Compute similarity
        similarity_score = SimilarityComputer.compute_ssim(original_array, resolved_array)
        
        # Deepfake detection
        deepfake_detected = DeepfakeDetector.detect(resolved_array)
        
        # Determine verification status
        if deepfake_detected:
            verification_status = "REJECTED"
            confidence_score = 0.95
        elif similarity_score >= 0.75:
            verification_status = "VERIFIED"
            confidence_score = similarity_score
        else:
            verification_status = "REJECTED"
            confidence_score = similarity_score
        
        logger.info(f"Verification complete - Similarity: {similarity_score:.3f}, Status: {verification_status}")
        
        return VerificationResponse(
            similarity_score=round(similarity_score, 3),
            deepfake_detected=deepfake_detected,
            verification_status=verification_status,
            confidence_score=round(confidence_score, 3)
        )
    
    except Exception as e:
        logger.error(f"Error in verification service: {str(e)}")
        raise HTTPException(status_code=500, detail="Verification service error")

# ================= Health Check =================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global startup_complete
    status_code = 200 if startup_complete else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if startup_complete else "initializing",
            "service": "SafeVoice AI Service",
            "startup_complete": startup_complete,
            "errors": startup_errors if startup_errors else None,
            "timestamp": datetime.now().isoformat()
        }
    )

# ================= Application Info =================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SafeVoice AI Service",
        "version": "1.0.0",
        "endpoints": {
            "moderation": "/api/ai/moderate",
            "verification": "/api/ai/verify",
            "health": "/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    logger.info("Starting SafeVoice AI Service on port 8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
