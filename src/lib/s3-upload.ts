import { put } from "@vercel/blob";

/**
 * Vercel Blob Storage utilities for PDF file management
 * This replaces AWS S3 with Vercel's simpler blob storage
 */

/**
 * Upload a file buffer to Vercel Blob Storage
 */
export async function uploadToBlob(
  buffer: Buffer,
  filename: string,
  contentType: string = "application/pdf"
): Promise<string> {
  try {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
    });

    return blob.url;
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    throw new Error("Failed to upload file to Vercel Blob");
  }
}

/**
 * For Vercel Blob, the URL returned from upload is already a download URL
 * This function exists for API compatibility but just returns the URL
 */
export async function generateDownloadUrl(
  url: string,
  expiresIn: number = 3600 // Not used with Vercel Blob but kept for compatibility
): Promise<string> {
  return url;
}

/**
 * Generate a unique filename for blob storage
 */
export function generateFileKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  return `pdf-exports/${userId}/${timestamp}-${randomId}-${sanitizedFilename}`;
}

/**
 * Alias for uploadToBlob to maintain API compatibility
 */
export const uploadToS3 = uploadToBlob;
