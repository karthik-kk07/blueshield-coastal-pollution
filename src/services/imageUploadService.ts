import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check file type
  const isAllowedType =
    file.type.startsWith('image/') ||
    ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp|heic|gif)$/i.test(file.name);

  if (!isAllowedType) {
    return {
      valid: false,
      error: `Invalid file format "${file.type || file.name}". Please upload a JPG, PNG, WebP, or HEIC photo.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses an image to an optimized DataURL fallback if storage bucket is unavailable
 */
export async function fileToDataUrl(file: File, maxWidth = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result as string);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Firebase Storage and returns the public download URL.
 * Falls back to an optimized base64 DataURL if Firebase Storage encounters bucket unavailability.
 */
export async function uploadReportPhoto(file: File, reportNumber?: string): Promise<{ url: string; storagePath?: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `reports/${reportNumber || 'rep'}_${Date.now()}_${cleanName}`;

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        reportNumber: reportNumber || 'unknown',
        uploadedAt: new Date().toISOString(),
      },
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { url: downloadUrl, storagePath: path };
  } catch (error) {
    console.warn('Firebase Storage upload encounter, falling back to optimized inline asset:', error);
    // Graceful fallback to guarantee zero user interruption
    const dataUrl = await fileToDataUrl(file);
    return { url: dataUrl, storagePath: 'inline-compressed' };
  }
}
