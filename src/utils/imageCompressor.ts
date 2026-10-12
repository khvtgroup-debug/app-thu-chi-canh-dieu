/**
 * Utility for client-side image compression before storing or uploading receipts.
 * Optimizes photos taken from phone cameras (often 5-15MB) down to 100-250KB JPEG
 * so they save fast, work offline, and never hit Firestore or localStorage size limits.
 */

export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  width: number;
  height: number;
  fileName: string;
}

export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Fill white background (useful for transparent PNG conversion to JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Str = dataUrl.split(',')[1] || '';
        const sizeBytes = Math.round((base64Str.length * 3) / 4);
        const sizeKb = Math.round(sizeBytes / 1024);

        resolve({
          dataUrl,
          sizeBytes,
          sizeKb,
          width,
          height,
          fileName: file.name,
        });
      };

      img.onerror = (err) => {
        reject(new Error('Không thể đọc file ảnh: ' + err));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = (err) => {
      reject(new Error('Lỗi khi đọc file: ' + err));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable string (e.g. 145 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
