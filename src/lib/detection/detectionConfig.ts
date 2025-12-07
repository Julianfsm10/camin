/**
 * Detection Configuration
 * Central configuration for detection layers (COCO-SSD + Level Changes)
 */

export const DETECTION_CONFIG = {
  // Region of Interest - frontal zone ~2m ahead x 1m wide
  ROI: {
    xStart: 0.25,
    xEnd: 0.75,
    yStart: 0.30,
    yEnd: 0.85,
  },
  
  // Distances
  MAX_DISTANCE: 3,
  CRITICAL_DISTANCE: 1.5,
  
  // Sizes
  MIN_OBJECT_SIZE: 0.025,
  
  // Level change detection
  LEVEL_DETECTION: {
    enabled: true,
    sensitivity: 0.7,
  },
  
  // Priority objects for COCO-SSD
  PRIORITY_OBJECTS: [
    // People and vehicles (high priority)
    'person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle',
    
    // Urban obstacles
    'chair', 'bench', 'potted plant', 'suitcase', 'backpack',
    'handbag', 'bottle', 'cup', 'umbrella',
    
    // Signs and infrastructure
    'stop sign', 'traffic light', 'fire hydrant', 'parking meter',
    
    // Animals
    'dog', 'cat', 'bird', 'horse', 'sheep', 'cow',
    
    // Other obstacles
    'skateboard', 'sports ball', 'kite', 'frisbee',
    'couch', 'bed', 'dining table', 'tv', 'laptop',
  ],
  
  // Analysis frequency - increased from 10 to 15 (less processing without Layer 2)
  ANALYSIS_FPS: 15,
};

export type DetectionPriority = 'critical' | 'high' | 'medium' | 'low';
export type DetectionType = 'known_object' | 'stair_down' | 'stair_up' | 'curb' | 'fence';

export interface EnhancedDetection {
  type: DetectionType;
  label: string;
  distance: number;
  position: 'izquierda' | 'centro' | 'derecha';
  positionX: number;
  priority: DetectionPriority;
  bbox?: [number, number, number, number];
  confidence: number;
}

/**
 * Get priority based on object class and distance
 */
export function getDetectionPriority(
  type: DetectionType,
  className: string | null,
  distance: number
): DetectionPriority {
  // Level changes have fixed priorities
  if (type === 'stair_down' || type === 'curb') return 'critical';
  if (type === 'stair_up') return 'high';
  if (type === 'fence') return 'medium';
  
  // Known objects
  const criticalClasses = ['person', 'car', 'truck', 'bus', 'motorcycle'];
  const highClasses = ['bicycle', 'dog', 'cat'];
  
  if (distance < 1) return 'critical';
  if (criticalClasses.includes(className || '') && distance < 2) return 'critical';
  if (criticalClasses.includes(className || '')) return 'high';
  if (highClasses.includes(className || '')) return 'high';
  if (distance < 1.5) return 'high';
  if (distance < 2.5) return 'medium';
  return 'low';
}

/**
 * Translate object class to Spanish
 */
export function translateObjectName(className: string): string {
  const translations: Record<string, string> = {
    'person': 'Persona',
    'car': 'Auto',
    'truck': 'Camión',
    'bus': 'Autobús',
    'motorcycle': 'Motocicleta',
    'bicycle': 'Bicicleta',
    'chair': 'Silla',
    'bench': 'Banca',
    'potted plant': 'Planta',
    'stop sign': 'Señal de alto',
    'traffic light': 'Semáforo',
    'fire hydrant': 'Hidrante',
    'dog': 'Perro',
    'cat': 'Gato',
    'bird': 'Pájaro',
    'backpack': 'Mochila',
    'umbrella': 'Paraguas',
    'handbag': 'Bolso',
    'suitcase': 'Maleta',
    'bottle': 'Botella',
    'cup': 'Taza',
    'couch': 'Sofá',
    'bed': 'Cama',
    'dining table': 'Mesa',
    'tv': 'Televisor',
    'laptop': 'Laptop',
    'skateboard': 'Patineta',
    'sports ball': 'Pelota',
  };
  
  return translations[className.toLowerCase()] || className;
}

/**
 * Get relative position from X coordinate
 */
export function getRelativePosition(
  positionX: number
): 'izquierda' | 'centro' | 'derecha' {
  if (positionX < 0.35) return 'izquierda';
  if (positionX > 0.65) return 'derecha';
  return 'centro';
}
