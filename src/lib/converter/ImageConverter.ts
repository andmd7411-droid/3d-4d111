/**
 * ImageConverter.ts
 * Handles client-side image conversion using Canvas API.
 * Supports resizing, quality control, and format conversion.
 */

export type ImageFormat = 'JPG' | 'PNG' | 'WEBP' | 'BMP' | 'GIF' | 'ICO' | 'SVG';

export interface ImageConversionOptions {
    format: ImageFormat;
    quality?: number; // 0.1 to 1.0 (for JPEG/WEBP)
    width?: number; // Optional resize width
    height?: number; // Optional resize height
    maintainAspectRatio?: boolean;
}

export class ImageConverter {
    /**
     * Converts a File object to the specified format with given options.
     */
    static async convert(file: File, options: ImageConversionOptions): Promise<Blob> {
        const imageBitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get 2D context');
        }

        // Calculate dimensions
        let { width, height } = this.calculateDimensions(
            imageBitmap.width,
            imageBitmap.height,
            options.width,
            options.height,
            options.maintainAspectRatio
        );

        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas
        // Use high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imageBitmap, 0, 0, width, height);

        // Determine MIME type
        const mimeType = this.getMimeType(options.format);

        // Handle specific formats
        if (options.format === 'BMP') {
            // Browser implementation of toBlob might not support BMP natively everywhere,
            // but modern Chrome does. If not, we might need a polyfill or encoder.
            // For now, relies on browser support.
        }

        if (options.format === 'ICO') {
            // Basic ICO support (often just 32x32 PNG inside ICO container or similar)
            // Browsers don't export image/x-icon. We might need to manually construct ICO header.
            // For high quality, we'll stick to mostly standard web formats first, 
            // and maybe use a library for ICO if needed.
            // For now, let's treat ICO as a PNG resize to 32x32 or 256x256 max?
            if (width > 256 || height > 256) {
                // ICOs normally are small icons
                // Resize logic handled above if passed in options
            }
        }

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error(`Conversion to ${options.format} failed`));
                    }
                },
                mimeType,
                options.quality || 0.92 // Default high quality
            );
        });
    }

    private static calculateDimensions(
        srcWidth: number,
        srcHeight: number,
        targetWidth?: number,
        targetHeight?: number,
        maintainAspectRatio: boolean = true
    ): { width: number; height: number } {
        if (!targetWidth && !targetHeight) {
            return { width: srcWidth, height: srcHeight };
        }

        let width = targetWidth || srcWidth;
        let height = targetHeight || srcHeight;

        if (maintainAspectRatio) {
            const ratio = srcWidth / srcHeight;
            if (targetWidth && !targetHeight) {
                height = Math.round(width / ratio);
            } else if (!targetWidth && targetHeight) {
                width = Math.round(height * ratio);
            } else if (targetWidth && targetHeight) {
                // Fit within box
                const targetRatio = targetWidth / targetHeight;
                if (ratio > targetRatio) {
                    // Source is wider
                    height = Math.round(width / ratio);
                } else {
                    // Source is taller
                    width = Math.round(height * ratio);
                }
            }
        }

        return { width, height };
    }

    private static getMimeType(format: ImageFormat): string {
        switch (format) {
            case 'JPG': return 'image/jpeg';
            case 'PNG': return 'image/png';
            case 'WEBP': return 'image/webp';
            case 'BMP': return 'image/bmp'; // May vary by browser
            case 'GIF': return 'image/gif'; // Static GIF only via canvas
            case 'ICO': return 'image/png'; // Hack: browsers don't output ICO, we serve PNG and component renames ext
            case 'SVG': return 'image/svg+xml'; // Canvas cannot export to SVG directly
            default: return 'image/png';
        }
    }
}
