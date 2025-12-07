import { useEffect, useRef, useState, useCallback } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

import { 
  DETECTION_CONFIG, 
  EnhancedDetection, 
  getDetectionPriority, 
  translateObjectName,
  getRelativePosition 
} from "@/lib/detection/detectionConfig";
import { detectLevelChanges, estimateDistanceFromY } from "@/lib/detection/levelChangeDetection";

interface UseHybridDetectionOptions {
  enabled?: boolean;
  targetFps?: number;
  minConfidence?: number;
  levelDetectionEnabled?: boolean;
}

interface UseHybridDetectionReturn {
  isModelLoaded: boolean;
  isLoading: boolean;
  detections: EnhancedDetection[];
  startDetection: (video: HTMLVideoElement) => void;
  stopDetection: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

// Reference heights for distance estimation (at 1 meter)
const REFERENCE_HEIGHTS: Record<string, number> = {
  'person': 0.7,
  'car': 0.4,
  'truck': 0.5,
  'bus': 0.6,
  'bicycle': 0.3,
  'motorcycle': 0.35,
  'dog': 0.15,
  'cat': 0.1,
  'chair': 0.2,
  'bench': 0.15,
  'default': 0.2
};

/**
 * Estimate distance based on object size in frame
 */
function estimateDistance(bboxHeight: number, videoHeight: number, objectClass: string): number {
  const refHeight = REFERENCE_HEIGHTS[objectClass] || REFERENCE_HEIGHTS['default'];
  const normalizedHeight = bboxHeight / videoHeight;
  
  const distance = refHeight / normalizedHeight;
  return Math.max(0.5, Math.min(10, Math.round(distance * 10) / 10));
}

/**
 * Check if object center is within ROI
 */
function isInROI(bbox: number[], videoWidth: number, videoHeight: number): boolean {
  const [x, y, width, height] = bbox;
  const centerX = (x + width / 2) / videoWidth;
  const centerY = (y + height / 2) / videoHeight;
  
  return (
    centerX >= DETECTION_CONFIG.ROI.xStart &&
    centerX <= DETECTION_CONFIG.ROI.xEnd &&
    centerY >= DETECTION_CONFIG.ROI.yStart &&
    centerY <= DETECTION_CONFIG.ROI.yEnd
  );
}

/**
 * Check if object is large enough to be significant
 */
function isSignificantObject(bbox: number[], videoWidth: number, videoHeight: number): boolean {
  const [, , width, height] = bbox;
  const area = (width * height) / (videoWidth * videoHeight);
  return area >= DETECTION_CONFIG.MIN_OBJECT_SIZE;
}

export function useHybridDetection(options: UseHybridDetectionOptions = {}): UseHybridDetectionReturn {
  const {
    enabled = true,
    targetFps = DETECTION_CONFIG.ANALYSIS_FPS,
    minConfidence = 0.45,
    levelDetectionEnabled = true
  } = options;

  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detections, setDetections] = useState<EnhancedDetection[]>([]);

  // Load COCO-SSD model
  useEffect(() => {
    if (!enabled) return;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        console.log('Loading COCO-SSD model...');
        const model = await cocoSsd.load({
          base: 'lite_mobilenet_v2'
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

  const performDetection = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== 4) return;

    const now = performance.now();
    const frameInterval = 1000 / targetFps;
    
    if (now - lastDetectionTime.current < frameInterval) {
      animationRef.current = requestAnimationFrame(performDetection);
      return;
    }
    
    lastDetectionTime.current = now;
    frameCount.current++;

    try {
      const allDetections: EnhancedDetection[] = [];
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // ============ LAYER 1: Known Objects (COCO-SSD) ============
      const predictions = await modelRef.current.detect(video);
      
      const knownObjects = predictions
        .filter(pred => 
          DETECTION_CONFIG.PRIORITY_OBJECTS.includes(pred.class) && 
          pred.score >= minConfidence
        )
        .filter(pred => isInROI(pred.bbox, videoWidth, videoHeight))
        .filter(pred => isSignificantObject(pred.bbox, videoWidth, videoHeight))
        .map(pred => {
          const bbox = pred.bbox as [number, number, number, number];
          const positionX = (bbox[0] + bbox[2] / 2) / videoWidth;
          const distance = estimateDistance(bbox[3], videoHeight, pred.class);
          
          return {
            type: 'known_object' as const,
            label: translateObjectName(pred.class),
            distance,
            position: getRelativePosition(positionX),
            positionX,
            priority: getDetectionPriority('known_object', pred.class, distance),
            bbox,
            confidence: pred.score,
          };
        })
        .filter(det => det.distance <= DETECTION_CONFIG.MAX_DISTANCE);

      allDetections.push(...knownObjects);

      // ============ LAYER 2: Level Changes (Stairs, Curbs, Fences) ============
      // Run every 4th frame for performance
      if (levelDetectionEnabled && frameCount.current % 4 === 0) {
        const levelChanges = detectLevelChanges(canvas, video);
        
        for (const change of levelChanges) {
          if (change.confidence < 0.5) continue;
          
          const distance = estimateDistanceFromY(change.y, videoHeight);
          
          allDetections.push({
            type: change.type,
            label: change.label,
            distance,
            position: 'centro',
            positionX: 0.5,
            priority: getDetectionPriority(change.type, null, distance),
            confidence: change.confidence,
          });
        }
      }

      // Sort by priority then distance
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = allDetections.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.distance - b.distance;
      });

      // Limit to top 5 detections
      setDetections(sorted.slice(0, 5));
    } catch (err) {
      console.error('Detection error:', err);
    }

    animationRef.current = requestAnimationFrame(performDetection);
  }, [targetFps, minConfidence, levelDetectionEnabled]);

  const startDetection = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    frameCount.current = 0;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(performDetection);
  }, [performDetection]);

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
    stopDetection,
    canvasRef,
  };
}

// Re-export config for use in UI components
export { DETECTION_CONFIG } from "@/lib/detection/detectionConfig";
export type { EnhancedDetection } from "@/lib/detection/detectionConfig";
