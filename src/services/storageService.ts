import { supabase } from '../config/supabaseClient';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Clean client-side canvas-based image compressor
 */
export const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Only compress compressible types
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image buffer.'));
    reader.readAsDataURL(file);
  });
};

export const storageService = {
  /**
   * Validate file size and mime types
   */
  validateFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Unsupported file format. Please upload JPG, PNG, WEBP or AVIF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds the 5MB production limit.';
    }
    return null;
  },

  /**
   * Safe upload wrapper that compresses images and returns public URL
   */
  async uploadMedia(
    bucket: 'menu-images' | 'gallery' | 'avatars' | 'banners' | 'admin-assets',
    path: string,
    file: File
  ): Promise<string> {
    // 1. Validation
    const validationError = this.validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // 2. Compress large files
    let uploadPayload: Blob = file;
    if (file.size > 200 * 1024) {
      try {
        uploadPayload = await compressImage(file);
      } catch (err) {
        console.warn('Compression failed, falling back to original upload', err);
      }
    }

    // 3. Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, uploadPayload, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error', error);
      throw error;
    }

    // If uploading avatars, return path key directly, else return public URL link
    if (bucket === 'avatars' || bucket === 'admin-assets') {
      return path;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  /**
   * Deletes a file from Supabase Storage
   */
  async deleteMedia(
    bucket: 'menu-images' | 'gallery' | 'avatars' | 'banners' | 'admin-assets',
    path: string
  ): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('Storage delete error', error);
      throw error;
    }
  },

  /**
   * Generates a signed URL for private assets like user avatars
   */
  async getSignedUrl(
    bucket: 'avatars' | 'admin-assets',
    path: string,
    expiresIn = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      throw error || new Error('Failed to generate signed asset URL.');
    }

    return data.signedUrl;
  }
};
