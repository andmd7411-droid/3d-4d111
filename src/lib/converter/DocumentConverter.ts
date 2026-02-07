import { jsPDF } from 'jspdf';
import { marked } from 'marked';

export type DocumentFormat = 'PDF' | 'TXT' | 'MD' | 'HTML';

export interface DocumentConversionOptions {
    format: DocumentFormat;
    fontSize?: number;
    fontName?: string;
    margin?: number;
}

export class DocumentConverter {
    static async convert(file: File, options: DocumentConversionOptions): Promise<Blob> {
        const text = await file.text();
        const srcExt = file.name.split('.').pop()?.toUpperCase() || 'TXT';

        let content = text;

        // Pre-processing
        if (srcExt === 'MD' && options.format === 'HTML') {
            content = await marked(text);
        } else if (srcExt === 'HTML' && options.format === 'TXT') {
            content = this.stripHtml(text);
        }

        // Output Generation
        switch (options.format) {
            case 'PDF':
                return this.generatePdf(content, options);
            case 'HTML':
                return new Blob([content], { type: 'text/html' });
            case 'MD':
                return new Blob([content], { type: 'text/markdown' });
            case 'TXT':
            default:
                return new Blob([content], { type: 'text/plain' });
        }
    }

    private static generatePdf(content: string, options: DocumentConversionOptions): Blob {
        const doc = new jsPDF();
        const fontSize = options.fontSize || 12;
        const margin = options.margin || 10;
        const lineHeight = fontSize * 0.5; // Roughly in mm

        doc.setFontSize(fontSize);
        // Split text to fit page width
        const splitText = doc.splitTextToSize(content, 190 - (margin * 2));

        let cursorY = margin;

        splitText.forEach((line: string) => {
            if (cursorY > 280) { // A4 height is ~297mm
                doc.addPage();
                cursorY = margin;
            }
            doc.text(line, margin, cursorY);
            cursorY += lineHeight; // approximate line height in mm? Actually 1pt = 0.35mm. 
            // setFontSize uses points. 12pt ~= 4.2mm. 
            // Let's use 7mm spacing for 12pt.
            cursorY += (fontSize / 3);
        });

        return doc.output('blob');
    }

    private static stripHtml(html: string): string {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
}
