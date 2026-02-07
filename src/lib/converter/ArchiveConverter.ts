import JSZip from 'jszip';

export type ArchiveFormat = 'ZIP';

export interface ArchiveConversionOptions {
    format: ArchiveFormat;
    action: 'compress' | 'extract';
}

export class ArchiveConverter {
    static async convert(file: File, options: ArchiveConversionOptions): Promise<Blob | Blob[]> {
        if (options.action === 'compress') {
            return this.createArchive(file);
        } else {
            return this.extractArchive(file);
        }
    }

    private static async createArchive(file: File): Promise<Blob> {
        const zip = new JSZip();
        zip.file(file.name, file);
        return zip.generateAsync({ type: 'blob' });
    }

    private static async extractArchive(file: File): Promise<Blob> {
        // For now, extraction is a bit complex for a single blob return type.
        // We might need to change the interface or just return the first file found for simplicity in this version,
        // or return a helper blob that contains a list of extracted files (simulated).
        // A better approach for the "Universal Converter" UI which expects 1 input -> 1 output blob
        // would be to maybe zip it back up? No, that's useless.
        // Let's assume for this specific tool, "Conversion" from ZIP means "Extract and give me the content".
        // If there are multiple files, we might need a UI to select which one, but for now let's just 
        // return a JSON blob listing the contents, or if it's a single file, return that file.

        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            // Check if there's only one file
            const fileNames = Object.keys(contents.files).filter(name => !contents.files[name].dir);

            if (fileNames.length === 0) {
                throw new Error("Archive is empty");
            }

            // If single file, return it
            if (fileNames.length === 1) {
                const fileName = fileNames[0];
                const cleanName = fileName.split('/').pop() || fileName;
                // We'll return the blob, but we should probably tell the UI the name somehow. 
                // For now, returning the blob is what the interface expects.
                return await contents.files[fileName].async('blob');
            }

            // If multiple files, for this Phase 1, return a text file listing contents
            // Real extraction of multiple files requires a different UI flow (download all as individual files).
            const listing = "Archive Contents:\n\n" + fileNames.join("\n");
            return new Blob([listing], { type: 'text/plain' });

        } catch (e) {
            console.error(e);
            throw new Error("Failed to extract archive: " + e);
        }
    }
}
