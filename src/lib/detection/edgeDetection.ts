/**
 * Edge Detection Utilities
 * Sobel-based edge detection for generic obstacle detection
 */

export interface ObstacleRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

/**
 * Sobel edge detection - detects edges in grayscale image
 */
export function detectEdges(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const edges = new Uint8ClampedArray(width * height);
  
  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      // Apply kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kidx = (ky + 1) * 3 + (kx + 1);
          gx += grayscale[idx] * sobelX[kidx];
          gy += grayscale[idx] * sobelY[kidx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > 50 ? 255 : 0;
    }
  }
  
  return edges;
}

/**
 * Find obstacle regions based on edge density
 */
export function findObstacleRegions(
  edges: Uint8ClampedArray,
  width: number,
  height: number,
  gridSize: number = 40
): ObstacleRegion[] {
  const obstacles: ObstacleRegion[] = [];
  
  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      // Count edges in this grid cell
      let edgeCount = 0;
      const cellWidth = Math.min(gridSize, width - x);
      const cellHeight = Math.min(gridSize, height - y);
      
      for (let cy = y; cy < y + cellHeight; cy++) {
        for (let cx = x; cx < x + cellWidth; cx++) {
          if (edges[cy * width + cx] > 0) edgeCount++;
        }
      }
      
      // If enough edges, it's a possible obstacle
      const density = edgeCount / (cellWidth * cellHeight);
      if (density > 0.15) { // 15% of cell has edges
        obstacles.push({
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          confidence: Math.min(density * 2, 1),
        });
      }
    }
  }
  
  return mergeNearbyRegions(obstacles, gridSize);
}

/**
 * Merge nearby obstacle regions into larger ones
 */
function mergeNearbyRegions(
  regions: ObstacleRegion[],
  threshold: number
): ObstacleRegion[] {
  if (regions.length === 0) return [];
  
  const merged: ObstacleRegion[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;
    
    let current = { ...regions[i] };
    used.add(i);
    
    // Find adjacent regions
    for (let j = i + 1; j < regions.length; j++) {
      if (used.has(j)) continue;
      
      const other = regions[j];
      const isAdjacent = 
        Math.abs(current.x + current.width - other.x) <= threshold ||
        Math.abs(other.x + other.width - current.x) <= threshold ||
        Math.abs(current.y + current.height - other.y) <= threshold ||
        Math.abs(other.y + other.height - current.y) <= threshold;
      
      if (isAdjacent) {
        // Merge regions
        const minX = Math.min(current.x, other.x);
        const minY = Math.min(current.y, other.y);
        const maxX = Math.max(current.x + current.width, other.x + other.width);
        const maxY = Math.max(current.y + current.height, other.y + other.height);
        
        current = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          confidence: Math.max(current.confidence, other.confidence),
        };
        used.add(j);
      }
    }
    
    merged.push(current);
  }
  
  return merged;
}

/**
 * Convert image data to grayscale
 */
export function toGrayscale(data: Uint8ClampedArray): Uint8ClampedArray {
  const grayscale = new Uint8ClampedArray(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return grayscale;
}
