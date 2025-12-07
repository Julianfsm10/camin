/**
 * Generic Obstacle Detection
 * Detects unclassified obstacles using edge analysis
 */

import { detectEdges, findObstacleRegions, toGrayscale, ObstacleRegion } from './edgeDetection';

export interface GenericObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  isAbsolute: boolean; // Coordinates are absolute (not relative to ROI)
}

interface ROI {
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
}

/**
 * Detect generic obstacles in the Region of Interest
 */
export function detectGenericObstacles(
  canvas: HTMLCanvasElement,
  videoElement: HTMLVideoElement,
  roi: ROI
): GenericObstacle[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;
  
  if (width === 0 || height === 0) return [];
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw current frame
  ctx.drawImage(videoElement, 0, 0, width, height);
  
  // Extract only the ROI
  const roiX = Math.floor(roi.xStart * width);
  const roiY = Math.floor(roi.yStart * height);
  const roiWidth = Math.floor((roi.xEnd - roi.xStart) * width);
  const roiHeight = Math.floor((roi.yEnd - roi.yStart) * height);
  
  const imageData = ctx.getImageData(roiX, roiY, roiWidth, roiHeight);
  const data = imageData.data;
  
  // Convert to grayscale and detect edges
  const grayscale = toGrayscale(data);
  const edges = detectEdges(grayscale, roiWidth, roiHeight);
  
  // Find obstacle regions
  const obstacles = findObstacleRegions(edges, roiWidth, roiHeight, 30);
  
  // Convert relative coordinates to absolute and filter small obstacles
  const minArea = roiWidth * roiHeight * 0.02; // Min 2% of ROI
  
  return obstacles
    .filter(obs => obs.width * obs.height >= minArea)
    .map(obs => ({
      x: obs.x + roiX,
      y: obs.y + roiY,
      width: obs.width,
      height: obs.height,
      confidence: obs.confidence,
      isAbsolute: true,
    }));
}

/**
 * Calculate overlap between two bounding boxes
 */
export function calculateOverlap(
  box1: { x: number; y: number; width: number; height: number },
  box2: number[]
): number {
  const [x2, y2, w2, h2] = box2;
  
  const xOverlap = Math.max(0, Math.min(box1.x + box1.width, x2 + w2) - Math.max(box1.x, x2));
  const yOverlap = Math.max(0, Math.min(box1.y + box1.height, y2 + h2) - Math.max(box1.y, y2));
  
  const overlapArea = xOverlap * yOverlap;
  const box1Area = box1.width * box1.height;
  
  return box1Area > 0 ? overlapArea / box1Area : 0;
}
