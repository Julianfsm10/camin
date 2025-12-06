import { useEffect, useRef, useState, useCallback } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  distance: number;
  positionX: number;
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

// Obstacle classes we care about
const OBSTACLE_CLASSES = [
  'person', 'car', 'truck', 'bus', 'bicycle', 'motorcycle',
  'dog', 'cat', 'chair', 'couch', 'potted plant', 'bed',
  'dining table', 'toilet', 'tv', 'laptop', 'cell phone',
  'book', 'bottle', 'cup', 'backpack', 'umbrella', 'handbag',
  'suitcase', 'sports ball', 'skateboard', 'surfboard'
];

// Approximate distance calculation based on bbox size
function calculateDistance(bboxHeight: number, videoHeight: number, objectClass: string): number {
  // Reference heights for objects at 1 meter (approximate)
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
  
  // Simple inverse proportion for distance
  const distance = refHeight / normalizedHeight;
  
  // Clamp and round
  return Math.max(0.5, Math.min(20, Math.round(distance)));
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
      
      const filteredDetections: Detection[] = predictions
        .filter(pred => 
          OBSTACLE_CLASSES.includes(pred.class) && 
          pred.score >= minConfidence
        )
        .map(pred => ({
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox as [number, number, number, number],
          distance: calculateDistance(pred.bbox[3], video.videoHeight, pred.class),
          positionX: (pred.bbox[0] + pred.bbox[2] / 2) / video.videoWidth
        }))
        .sort((a, b) => a.distance - b.distance); // Sort by distance

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
