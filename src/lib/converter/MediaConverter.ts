import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type MediaFormat = 'MP3' | 'WAV' | 'OGG' | 'AAC' | 'MP4' | 'WEBM' | 'GIF' | 'AVI' | 'MOV';

export interface MediaConversionOptions {
    format: MediaFormat;
    onProgress?: (progress: number) => void;
}

export class MediaConverter {
    private static ffmpeg: FFmpeg | null = null;
    private static isLoading = false;

    private static async load() {
        if (this.ffmpeg) return this.ffmpeg;
        if (this.isLoading) {
            // Wait for loading to finish
            while (this.isLoading) {
                await new Promise(r => setTimeout(r, 100));
            }
            if (this.ffmpeg) return this.ffmpeg;
        }

        // Check for SharedArrayBuffer support (required for multi-threaded ffmpeg-core)
        if (typeof SharedArrayBuffer === 'undefined') {
            throw new Error('SharedArrayBuffer is not defined. This browser environment does not support the required security headers for FFmpeg.wasm (Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: require-corp).');
        }

        this.isLoading = true;

        try {
            const ffmpeg = new FFmpeg();
            // Use specific version to ensure compatibility
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

            console.log("Loading FFmpeg.wasm from:", baseURL);

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            console.log("FFmpeg loaded successfully");
            this.ffmpeg = ffmpeg;
            return ffmpeg;
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            // Re-throw with more user-friendly message
            if (error instanceof Error) {
                throw new Error(`FFmpeg Load Error: ${error.message}`);
            }
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    static async convert(file: File, options: MediaConversionOptions): Promise<Blob> {
        const ffmpeg = await this.load();
        if (!ffmpeg) throw new Error("FFmpeg failed to load");

        const { format, onProgress } = options;

        // Reset progress
        if (onProgress) onProgress(0);

        // Progress handler
        const progressHandler = ({ progress, time }: { progress: number, time: number }) => {
            if (onProgress && progress >= 0 && progress <= 1) {
                onProgress(Math.round(progress * 100));
            }
        };
        ffmpeg.on('progress', progressHandler);

        try {
            const inputName = 'input' + this.getExtension(file.name);
            const outputName = 'output.' + format.toLowerCase();

            // Write file to memory
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // Construct command
            const args = ['-i', inputName];

            // Add specific flags based on format
            switch (format) {
                case 'MP4':
                    // Ensure H.264 for compatibility
                    args.push('-c:v', 'libx264', '-c:a', 'aac');
                    break;
                case 'WEBM':
                    args.push('-c:v', 'libvpx', '-c:a', 'libvorbis');
                    break;
                case 'GIF':
                    args.push('-vf', 'fps=10,scale=320:-1:flags=lanczos');
                    break;
                case 'MP3':
                    args.push('-b:a', '192k');
                    break;
            }

            args.push(outputName);

            // Execute
            await ffmpeg.exec(args);

            // Read result
            const data = await ffmpeg.readFile(outputName);

            // Prepare Blob
            const mimeType = this.getMimeType(format);
            const blob = new Blob([data as any], { type: mimeType });

            // Cleanup
            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
            // ffmpeg.off('progress', progressHandler); // 'off' might not exist on this version or types

            if (onProgress) onProgress(100);
            return blob;

        } catch (error) {
            console.error('Conversion error:', error);
            throw error;
        }
    }

    private static getExtension(filename: string): string {
        const match = filename.match(/\.[^.]+$/);
        return match ? match[0] : '';
    }

    private static getMimeType(format: MediaFormat): string {
        switch (format) {
            case 'MP3': return 'audio/mpeg';
            case 'WAV': return 'audio/wav';
            case 'OGG': return 'audio/ogg';
            case 'AAC': return 'audio/aac';
            case 'MP4': return 'video/mp4';
            case 'WEBM': return 'video/webm';
            case 'AVI': return 'video/x-msvideo';
            case 'MOV': return 'video/quicktime';
            case 'GIF': return 'image/gif';
            default: return 'application/octet-stream';
        }
    }
}
