import { useEffect, useRef, useState, useCallback } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  distance: number;
  positionX: number;
  position: 'izquierda' | 'adelante' | 'derecha';
  inROI: boolean;
}

interface UseObjectDetectionOptions {
  enabled?: boolean;
  targetFps?: number;
  minConfidence?: number;
}

interface UseObjectDetectionReturn {
  isModelLoaded: boolean;
  isLoading: boolean;
  detections: Detection[];
  startDetection: (video: HTMLVideoElement) => void;
  stopDetection: () => void;
}

// Detection configuration - optimized for 2m ahead x 1m wide zone
const DETECTION_CONFIG = {
  // ROI: Region of Interest - central zone representing ~2m ahead x 1m wide
  ROI: {
    xStart: 0.25,  // Start at 25% width (ignore left periphery)
    xEnd: 0.75,    // End at 75% width (ignore right periphery)
    yStart: 0.30,  // Start at 30% height (ignore sky/ceiling)
    yEnd: 0.85,    // End at 85% height (ignore ground directly at feet)
  },
  MAX_DISTANCE: 3,       // Only alert for objects within 3 meters
  MIN_OBJECT_SIZE: 0.03, // Minimum 3% of ROI area to filter tiny detections
};

// Relevant obstacle classes for mobility assistance
const RELEVANT_CLASSES = [
  'person', 'car', 'truck', 'bus', 'bicycle', 'motorcycle',
  'dog', 'cat', 'chair', 'couch', 'potted plant', 'bed',
  'dining table', 'toilet', 'tv', 'laptop', 'cell phone',
  'book', 'bottle', 'cup', 'backpack', 'umbrella', 'handbag',
  'suitcase', 'sports ball', 'skateboard', 'surfboard',
  'bench', 'stop sign', 'traffic light', 'fire hydrant'
];

// Check if object center is within the ROI
function isInROI(bbox: number[], videoWidth: number, videoHeight: number): boolean {
  const [x, y, width, height] = bbox;
  
  // Calculate center of the object
  const centerX = (x + width / 2) / videoWidth;
  const centerY = (y + height / 2) / videoHeight;
  
  return (
    centerX >= DETECTION_CONFIG.ROI.xStart &&
    centerX <= DETECTION_CONFIG.ROI.xEnd &&
    centerY >= DETECTION_CONFIG.ROI.yStart &&
    centerY <= DETECTION_CONFIG.ROI.yEnd
  );
}

// Estimate distance based on object size in frame
function estimateDistance(bboxHeight: number, videoHeight: number, objectClass: string): number {
  // Reference heights for objects at 1 meter (approximate percentages)
  const referenceHeights: Record<string, number> = {
    'person': 0.7,
    'car': 0.4,
    'truck': 0.5,
    'bus': 0.6,
    'bicycle': 0.3,
    'motorcycle': 0.35,
    'dog': 0.15,
    'cat': 0.1,
    'chair': 0.2,
    'default': 0.2
  };

  const refHeight = referenceHeights[objectClass] || referenceHeights['default'];
  const normalizedHeight = bboxHeight / videoHeight;
  
  // Inverse proportion for distance estimation
  const distance = refHeight / normalizedHeight;
  
  // Clamp between 0.5m and 20m, round to 1 decimal
  return Math.max(0.5, Math.min(20, Math.round(distance * 10) / 10));
}

// Get relative position (left, center/ahead, right)
function getRelativePosition(bbox: number[], videoWidth: number): 'izquierda' | 'adelante' | 'derecha' {
  const [x, , width] = bbox;
  const centerX = (x + width / 2) / videoWidth;
  
  if (centerX < 0.35) return 'izquierda';
  if (centerX > 0.65) return 'derecha';
  return 'adelante';
}

// Check if object is significant enough (not too small)
function isSignificantObject(bbox: number[], videoWidth: number, videoHeight: number): boolean {
  const [, , width, height] = bbox;
  const area = (width * height) / (videoWidth * videoHeight);
  return area >= DETECTION_CONFIG.MIN_OBJECT_SIZE;
}

export function useObjectDetection(options: UseObjectDetectionOptions = {}): UseObjectDetectionReturn {
  const {
    enabled = true,
    targetFps = 10,
    minConfidence = 0.5
  } = options;

  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(0);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detections, setDetections] = useState<Detection[]>([]);

  // Load model
  useEffect(() => {
    if (!enabled) return;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        console.log('Loading COCO-SSD model...');
        const model = await cocoSsd.load({
          base: 'lite_mobilenet_v2' // Faster model for mobile
        });
        modelRef.current = model;
        setIsModelLoaded(true);
        console.log('COCO-SSD model loaded successfully');
      } catch (err) {
        console.error('Failed to load COCO-SSD model:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      modelRef.current = null;
    };
  }, [enabled]);

  const detectObjects = useCallback(async () => {
    if (!modelRef.current || !videoRef.current) return;
    
    const video = videoRef.current;
    if (video.readyState !== 4) return;

    const now = performance.now();
    const frameInterval = 1000 / targetFps;
    
    if (now - lastDetectionTime.current < frameInterval) {
      animationRef.current = requestAnimationFrame(detectObjects);
      return;
    }
    
    lastDetectionTime.current = now;

    try {
      const predictions = await modelRef.current.detect(video);
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      const filteredDetections: Detection[] = predictions
        // Filter by relevant classes and confidence
        .filter(pred => 
          RELEVANT_CLASSES.includes(pred.class) && 
          pred.score >= minConfidence
        )
        // Map to enhanced detection format
        .map(pred => {
          const bbox = pred.bbox as [number, number, number, number];
          const inROI = isInROI(bbox, videoWidth, videoHeight);
          const distance = estimateDistance(bbox[3], videoHeight, pred.class);
          const positionX = (bbox[0] + bbox[2] / 2) / videoWidth;
          const position = getRelativePosition(bbox, videoWidth);
          
          return {
            class: pred.class,
            score: pred.score,
            bbox,
            distance,
            positionX,
            position,
            inROI
          };
        })
        // CRITICAL: Only keep objects within the ROI (frontal zone)
        .filter(det => det.inROI)
        // Filter by minimum object size
        .filter(det => isSignificantObject(det.bbox, videoWidth, videoHeight))
        // Filter by maximum distance
        .filter(det => det.distance <= DETECTION_CONFIG.MAX_DISTANCE)
        // Sort by distance (closest first = highest priority)
        .sort((a, b) => a.distance - b.distance);

      setDetections(filteredDetections);
    } catch (err) {
      console.error('Detection error:', err);
    }

    animationRef.current = requestAnimationFrame(detectObjects);
  }, [targetFps, minConfidence]);

  const startDetection = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(detectObjects);
  }, [detectObjects]);

  const stopDetection = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setDetections([]);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    isModelLoaded,
    isLoading,
    detections,
    startDetection,
    stopDetection
  };
}

// Export config for use in UI components
export { DETECTION_CONFIG };
