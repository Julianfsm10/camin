/**
 * Level Change Detection
 * Detects stairs, curbs, fences through image analysis
 */

export type LevelChangeType = 'stair_down' | 'stair_up' | 'curb' | 'fence';

export interface LevelChangeDetection {
  type: LevelChangeType;
  y: number;
  confidence: number;
  label: string;
}

/**
 * Check for vertical patterns (characteristic of fences/railings)
 */
function hasVerticalPattern(
  data: Uint8ClampedArray,
  width: number,
  y: number,
  stripeHeight: number
): boolean {
  const samplePoints = 10;
  let verticalLines = 0;
  
  for (let i = 0; i < samplePoints; i++) {
    const x = Math.floor((i / samplePoints) * width);
    let verticalEdges = 0;
    
    for (let dy = 0; dy < stripeHeight - 1; dy++) {
      const idx1 = ((y + dy) * width + x) * 4;
      const idx2 = ((y + dy + 1) * width + x) * 4;
      
      const diff = Math.abs(
        (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) -
        (data[idx2] + data[idx2 + 1] + data[idx2 + 2])
      );
      
      if (diff > 30) verticalEdges++;
    }
    
    if (verticalEdges > stripeHeight * 0.3) verticalLines++;
  }
  
  return verticalLines > samplePoints * 0.4;
}

/**
 * Filter nearby detections to avoid duplicates
 */
function filterNearbyDetections(
  detections: LevelChangeDetection[],
  threshold: number = 30
): LevelChangeDetection[] {
  const filtered: LevelChangeDetection[] = [];
  
  for (const current of detections) {
    let isDuplicate = false;
    
    for (let j = 0; j < filtered.length; j++) {
      if (
        current.type === filtered[j].type &&
        Math.abs(current.y - filtered[j].y) < threshold
      ) {
        // Keep the one with higher confidence
        if (current.confidence > filtered[j].confidence) {
          filtered[j] = current;
        }
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      filtered.push(current);
    }
  }
  
  return filtered;
}

/**
 * Detect horizontal lines and level changes in video frame
 */
export function detectLevelChanges(
  canvas: HTMLCanvasElement,
  videoElement: HTMLVideoElement
): LevelChangeDetection[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;
  
  if (width === 0 || height === 0) return [];
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(videoElement, 0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const detections: LevelChangeDetection[] = [];
  
  // Divide image into horizontal stripes
  const stripeHeight = 10;
  const numStripes = Math.floor(height / stripeHeight);
  
  let previousBrightness = 0;
  const brightnessHistory: number[] = [];
  
  for (let i = 0; i < numStripes; i++) {
    const y = i * stripeHeight;
    let stripeBrightness = 0;
    let edgeCount = 0;
    
    // Calculate average brightness of stripe
    for (let x = 0; x < width; x++) {
      for (let dy = 0; dy < stripeHeight; dy++) {
        const idx = ((y + dy) * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        stripeBrightness += brightness;
        
        // Count abrupt changes (edges)
        if (x > 0) {
          const prevIdx = ((y + dy) * width + (x - 1)) * 4;
          const prevBrightness = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;
          if (Math.abs(brightness - prevBrightness) > 30) edgeCount++;
        }
      }
    }
    
    stripeBrightness /= (width * stripeHeight);
    brightnessHistory.push(stripeBrightness);
    const edgeDensity = edgeCount / (width * stripeHeight);
    
    // DETECT STAIR DOWN: Abrupt dark → light change (indicates drop-off)
    if (i > 2 && stripeBrightness > previousBrightness + 35 && y > height * 0.5) {
      // Check for pattern consistency (multiple stripes with change)
      const avgPrevious = brightnessHistory.slice(-4, -1).reduce((a, b) => a + b, 0) / 3;
      if (stripeBrightness > avgPrevious + 30) {
        detections.push({
          type: 'stair_down',
          y,
          confidence: Math.min((stripeBrightness - previousBrightness) / 80, 1),
          label: 'Escalera bajando',
        });
      }
    }
    
    // DETECT STAIR UP: Abrupt light → dark change
    if (i > 2 && stripeBrightness < previousBrightness - 35 && y > height * 0.4) {
      const avgPrevious = brightnessHistory.slice(-4, -1).reduce((a, b) => a + b, 0) / 3;
      if (stripeBrightness < avgPrevious - 30) {
        detections.push({
          type: 'stair_up',
          y,
          confidence: Math.min((previousBrightness - stripeBrightness) / 80, 1),
          label: 'Escalera subiendo',
        });
      }
    }
    
    // DETECT CURB: Marked horizontal line in lower third
    if (y > height * 0.6 && edgeDensity > 0.08) {
      // Additional check: should have consistent horizontal edge
      let horizontalEdges = 0;
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const topIdx = ((y - stripeHeight) * width + x) * 4;
        const diff = Math.abs(
          (data[idx] + data[idx + 1] + data[idx + 2]) -
          (data[topIdx] + data[topIdx + 1] + data[topIdx + 2])
        );
        if (diff > 25) horizontalEdges++;
      }
      
      if (horizontalEdges > width * 0.3) {
        detections.push({
          type: 'curb',
          y,
          confidence: Math.min(edgeDensity * 8, 1),
          label: 'Bordillo o andén',
        });
      }
    }
    
    // DETECT FENCE: Repetitive vertical line pattern
    if (edgeDensity > 0.10 && hasVerticalPattern(data, width, y, stripeHeight)) {
      detections.push({
        type: 'fence',
        y,
        confidence: Math.min(edgeDensity * 6, 1),
        label: 'Reja o baranda',
      });
    }
    
    previousBrightness = stripeBrightness;
  }
  
  // Filter duplicates and return top detections
  return filterNearbyDetections(detections).slice(0, 3);
}

/**
 * Estimate distance based on Y position in frame
 */
export function estimateDistanceFromY(y: number, videoHeight: number): number {
  const relativeY = y / videoHeight;
  
  if (relativeY > 0.85) return 0.5;  // Very close
  if (relativeY > 0.75) return 1;
  if (relativeY > 0.65) return 1.5;
  if (relativeY > 0.55) return 2;
  if (relativeY > 0.45) return 2.5;
  return 3;
}
