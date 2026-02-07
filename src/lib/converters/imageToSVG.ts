import { applyGamma, applyDenoise, applySharpen, applyInvert, autoEnhance } from '../image-processing/preprocessing'
import { applyDithering, DitheringMode } from '../image-processing/dithering'
import { traceContours, contoursToSVG } from '../image-processing/vectorization'

interface SVGOptions {
    threshold?: number
    brightness?: number
    contrast?: number
    gamma?: number
    denoise?: number
    sharpen?: number
    invert?: boolean
    autoEnhance?: boolean
    ditheringMode?: DitheringMode
    smoothness?: number
}

export async function convertToSVG(
    imageDataUrl: string,
    options: SVGOptions = {}
): Promise<string> {
    const {
        threshold = 128,
        brightness = 100,
        contrast = 100,
        gamma = 1.0,
        denoise = 0,
        sharpen = 0,
        invert = false,
        autoEnhance: shouldAutoEnhance = false,
        ditheringMode = 'threshold',
        smoothness = 1.0
    } = options

    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }

            ctx.drawImage(img, 0, 0)
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

            // Apply preprocessing pipeline (same as DXF)
            if (shouldAutoEnhance) {
                imageData = autoEnhance(imageData)
            }

            if (gamma !== 1.0) {
                imageData = applyGamma(imageData, gamma)
            }

            if (denoise > 0) {
                imageData = applyDenoise(imageData, denoise)
            }

            if (brightness !== 100 || contrast !== 100) {
                const data = imageData.data
                const brightnessAdjust = (brightness - 100) * 2.55
                const contrastFactor = contrast / 100

                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrastFactor + 128) + brightnessAdjust))
                    data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrastFactor + 128) + brightnessAdjust))
                    data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrastFactor + 128) + brightnessAdjust))
                }
            }

            if (sharpen > 0) {
                imageData = applySharpen(imageData, sharpen)
            }

            if (invert) {
                imageData = applyInvert(imageData)
            }

            // Apply selected dithering algorithm
            const edges = applyDithering(imageData, ditheringMode, threshold)

            // Trace contours from edges
            const contours = traceContours(edges, 3)

            // Convert contours to SVG with smoothness control
            const svg = contoursToSVG(contours, canvas.width, canvas.height, smoothness)

            resolve(svg)
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = imageDataUrl
    })
}
