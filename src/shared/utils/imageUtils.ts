/**
 * Utility functions for client-side image compression and upload processing.
 * Converts uploaded images to lightweight Base64 Data URLs so they can be
 * saved in localStorage, stored in Firestore, and rendered without external CDN failures.
 */

export function compressImageFile(
  file: File,
  maxWidth = 960,
  maxHeight = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG, read as text/dataURL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Retain PNG for transparent graphics, otherwise compress as JPEG
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(format, quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = src;
  });
}

export interface ImageCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropAndCompressImage(
  img: HTMLImageElement,
  crop: ImageCropRect,
  maxEdge = 960,
  quality = 0.85
): string {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  const sx = Math.max(0, Math.min(naturalW, crop.x));
  const sy = Math.max(0, Math.min(naturalH, crop.y));
  const sw = Math.max(1, Math.min(naturalW - sx, crop.width));
  const sh = Math.max(1, Math.min(naturalH - sy, crop.height));

  let outW = sw;
  let outH = sh;
  const longest = Math.max(outW, outH);
  if (longest > maxEdge) {
    const scale = maxEdge / longest;
    outW = Math.max(1, Math.round(outW * scale));
    outH = Math.max(1, Math.round(outH * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', quality);
}
